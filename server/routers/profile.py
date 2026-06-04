from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.security import get_current_user
from models.user import User, UserProfile
from schemas.models import UserProfile as UserProfileSchema

router = APIRouter()
DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


@router.get("/me")
async def get_my_profile(current_user: UserDep, db: DbDep):
    logger.info(f"Fetching profile for user: {current_user.id}")

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            level="beginner",
            sub_level=1,
            problems_solved=0,
            streak=0,
            expertise="general",
            application="",
            learning_style="visual",
            goals=[],
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return {
        "id": str(profile.id),
        "userId": str(profile.user_id),
        "level": profile.level,
        "subLevel": profile.sub_level,
        "problemsSolved": profile.problems_solved,
        "streak": profile.streak,
        "expertise": profile.expertise,
        "application": profile.application,
        "learningStyle": profile.learning_style,
        "goals": profile.goals,
        "createdAt": profile.created_at.isoformat(),
        "updatedAt": profile.updated_at.isoformat(),
    }


@router.post("/")
async def update_profile(
    profile_data: UserProfileSchema, current_user: UserDep, db: DbDep
):
    logger.info(f"Updating profile for user: {current_user.id}")
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if profile:
        profile.level = profile_data.level
        profile.sub_level = profile_data.subLevel
        profile.expertise = profile_data.expertise
        profile.application = profile_data.application
        profile.learning_style = profile_data.learningStyle
        profile.goals = profile_data.goals
        profile.updated_at = datetime.now(UTC)
    else:
        profile = UserProfile(
            user_id=current_user.id,
            level=profile_data.level,
            sub_level=profile_data.subLevel,
            expertise=profile_data.expertise,
            application=profile_data.application,
            learning_style=profile_data.learningStyle,
            goals=profile_data.goals,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)

    return {
        "id": str(profile.id),
        "userId": str(profile.user_id),
        "level": profile.level,
        "subLevel": profile.sub_level,
        "problemsSolved": profile.problems_solved,
        "streak": profile.streak,
        "expertise": profile.expertise,
        "application": profile.application,
        "learningStyle": profile.learning_style,
        "goals": profile.goals,
    }
