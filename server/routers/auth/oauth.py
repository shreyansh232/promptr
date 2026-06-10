import secrets
from datetime import timedelta

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from core.db import get_db
from core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token
from models.user import OAuthAccount, User
from services.redis import redis_client

settings = get_settings()
router = APIRouter()
oauth = OAuth()

if settings.google_client_id:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

if settings.github_client_id:
    oauth.register(
        name="github",
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        access_token_url="https://github.com/login/oauth/access_token",
        access_token_params=None,
        authorize_url="https://github.com/login/oauth/authorize",
        authorize_params=None,
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "user:email"},
    )


@router.get("/{provider}/login")
async def oauth_login(provider: str, request: Request):
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail="OAuth provider not supported")
    backend_url = settings.backend_url.rstrip("/")
    redirect_uri = f"{backend_url}/api/auth/{provider}/callback"
    return await client.authorize_redirect(request, redirect_uri)


class ExchangeCodeRequest(BaseModel):
    code: str


@router.post("/exchange-code")
async def exchange_code(request_data: ExchangeCodeRequest):
    """Exchange a short-lived OAuth code for the actual JWT access token."""
    code = request_data.code
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    try:
        stored = await redis_client.get(f"oauth_exchange:{code}")
        if not stored:
            raise HTTPException(status_code=400, detail="Code expired or invalid")

        data = stored.split(":", 1)
        if len(data) != 2:
            raise HTTPException(status_code=400, detail="Invalid code data")

        token, is_new_str = data
        await redis_client.delete(f"oauth_exchange:{code}")
        return {
            "access_token": token,
            "is_new": is_new_str == "true",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to exchange code") from e


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str, request: Request, db: AsyncSession = Depends(get_db)
):
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail="OAuth provider not supported")

    try:
        token = await client.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail="OAuth authorization failed") from e

    user_info = None
    if provider == "google":
        user_info = token.get("userinfo")
    elif provider == "github":
        resp = await client.get("user", token=token)
        user_info = resp.json()
        if not user_info.get("email"):
            emails_resp = await client.get("user/emails", token=token)
            emails = emails_resp.json()
            primary_email = next((e["email"] for e in emails if e["primary"]), None)
            user_info["email"] = primary_email

    if not user_info or not user_info.get("email"):
        raise HTTPException(
            status_code=400, detail="Failed to fetch user email from OAuth provider"
        )

    email = user_info["email"]
    provider_account_id = str(user_info.get("sub") or user_info.get("id"))
    name = user_info.get("name") or user_info.get("login")
    image = user_info.get("picture") or user_info.get("avatar_url")

    # Check if oauth account exists
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_account_id == provider_account_id,
        )
    )
    oauth_account = result.scalars().first()

    if oauth_account:
        user_id = oauth_account.user_id
    else:
        # Check if user with email exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            user = User(email=email, name=name, image=image)
            db.add(user)
            await db.commit()
            await db.refresh(user)

        new_oauth = OAuthAccount(
            user_id=user.id, provider=provider, provider_account_id=provider_account_id
        )
        db.add(new_oauth)
        await db.commit()
        user_id = user.id

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_id)}, expires_delta=access_token_expires
    )

    # Check if user has a profile to determine if they are new
    from models.user import UserProfile

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    is_new = profile is None

    # Generate a short-lived one-time code instead of passing the token in the URL
    oauth_code = secrets.token_urlsafe(32)
    code_key = f"oauth_exchange:{oauth_code}"
    code_value = f"{access_token}:{'true' if is_new else 'false'}"
    try:
        await redis_client.setex(code_key, 120, code_value)  # 2-minute TTL
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate OAuth code")

    # Redirect to frontend with the code (NOT the actual token)
    frontend_url = settings.frontend_url.rstrip("/")
    redirect_url = f"{frontend_url}/oauth/callback?code={oauth_code}&is_new={'true' if is_new else 'false'}"
    return RedirectResponse(url=redirect_url)
