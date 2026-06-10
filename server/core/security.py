import uuid as uuid_mod
from datetime import UTC, datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from core.db import get_db
from models.user import User
from services.redis import redis_client

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode.update({"exp": expire, "jti": uuid_mod.uuid4().hex})
    encoded_jwt = jwt.encode(to_encode, settings.auth_secret, algorithm=ALGORITHM)
    return encoded_jwt


async def blacklist_token(jti: str, expire_timestamp: int) -> None:
    """Add a JWT ID to the blacklist. Expires when the token would have expired."""
    now = int(datetime.now(UTC).timestamp())
    ttl = max(1, expire_timestamp - now)
    try:
        await redis_client.setex(f"token_blacklist:{jti}", ttl, "1")
    except Exception:
        pass  # Fail-open: if Redis is down, logout still works (token not blacklisted)


async def is_token_blacklisted(jti: str) -> bool:
    """Check if a JWT ID has been blacklisted."""
    try:
        result = await redis_client.get(f"token_blacklist:{jti}")
        return result == "1"
    except Exception:
        return False  # Fail-open: if Redis is down, allow through


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.auth_secret, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        jti: str | None = payload.get("jti")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Check token blacklist
    if jti and await is_token_blacklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        uuid_user_id = uuid_mod.UUID(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid_user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user
