from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.security import get_current_user
from models.user import User, UserProfile, CompletedMission
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
            goals=[],
            builder_role="",
            frameworks=[],
            workflow_focus="",
            risk_focus="",
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    avg_score_res = await db.execute(
        select(func.avg(CompletedMission.reliability_score)).where(
            CompletedMission.user_id == current_user.id
        )
    )
    avg_score = avg_score_res.scalar()
    reliability_score = round(float(avg_score)) if avg_score is not None else 0

    return {
        "id": str(profile.id),
        "userId": str(profile.user_id),
        "level": profile.level,
        "subLevel": profile.sub_level,
        "problemsSolved": profile.problems_solved,
        "streak": profile.streak,
        "expertise": profile.expertise,
        "application": profile.application,
        "goals": profile.goals,
        "builderRole": profile.builder_role,
        "frameworks": profile.frameworks,
        "workflowFocus": profile.workflow_focus,
        "riskFocus": profile.risk_focus,
        "reliabilityScore": reliability_score,
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
        profile.goals = profile_data.goals
        profile.builder_role = profile_data.builderRole
        profile.frameworks = profile_data.frameworks
        profile.workflow_focus = profile_data.workflowFocus
        profile.risk_focus = profile_data.riskFocus
        profile.updated_at = datetime.now(UTC)
    else:
        profile = UserProfile(
            user_id=current_user.id,
            level=profile_data.level,
            sub_level=profile_data.subLevel,
            expertise=profile_data.expertise,
            application=profile_data.application,
            goals=profile_data.goals,
            builder_role=profile_data.builderRole,
            frameworks=profile_data.frameworks,
            workflow_focus=profile_data.workflowFocus,
            risk_focus=profile_data.riskFocus,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)

    avg_score_res = await db.execute(
        select(func.avg(CompletedMission.reliability_score)).where(
            CompletedMission.user_id == current_user.id
        )
    )
    avg_score = avg_score_res.scalar()
    reliability_score = round(float(avg_score)) if avg_score is not None else 0

    return {
        "id": str(profile.id),
        "userId": str(profile.user_id),
        "level": profile.level,
        "subLevel": profile.sub_level,
        "problemsSolved": profile.problems_solved,
        "streak": profile.streak,
        "expertise": profile.expertise,
        "application": profile.application,
        "goals": profile.goals,
        "builderRole": profile.builder_role,
        "frameworks": profile.frameworks,
        "workflowFocus": profile.workflow_focus,
        "riskFocus": profile.risk_focus,
        "reliabilityScore": reliability_score,
    }
