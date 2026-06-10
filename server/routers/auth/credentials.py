from datetime import timedelta
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from core.db import get_db
from core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    blacklist_token,
    create_access_token,
    get_password_hash,
    verify_password,
)
from models.user import User
from schemas.auth import Token, UserCreate, UserLogin

settings = get_settings()

router = APIRouter()
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: DbDep):
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_new": True,
    }


@router.post("/logout")
async def logout(authorization: str | None = Header(None)):
    """Blacklist the current JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(
            token,
            settings.auth_secret,
            algorithms=[ALGORITHM],
            options={"verify_exp": False},
        )
        jti: str | None = payload.get("jti")
        exp: int = payload.get("exp", 0)
        if jti:
            await blacklist_token(jti, exp)
    except jwt.PyJWTError:
        pass  # Already invalid — nothing to blacklist
    return {"success": True}


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: DbDep):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalars().first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user has completed onboarding (profile exists and has custom values)
    from models.user import UserProfile

    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = profile_result.scalars().first()
    is_new = True
    if profile and profile.expertise != "general" and profile.application != "":
        is_new = False

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_new": is_new,
    }
