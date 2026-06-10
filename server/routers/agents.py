from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.security import get_current_user
from models.user import CompletedMission, User
from schemas.agent import (
    AgentEvaluationRequest,
    AgentEvaluationResponse,
    AgentLearnerProfile,
    AgentMissionResponse,
    CompletedAgentMissionRequest,
)
from services.agent_service import evaluate_agent_instructions, generate_agent_mission

router = APIRouter()
DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


@router.post("/agent-missions/generate")
async def generate_mission(
    profile: AgentLearnerProfile, db: DbDep
) -> AgentMissionResponse:
    try:
        logger.info(f"Generating mission for user: {profile.userId}")
        # Cache is disabled; in future, we'll use Redis for this
        response = await generate_agent_mission(profile)
        return response
    except Exception as exc:
        logger.error(f"Error generating mission: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/agent-instructions/evaluate")
async def evaluate_instructions(
    request: AgentEvaluationRequest,
) -> AgentEvaluationResponse:
    try:
        logger.info(
            f"Evaluating agent instructions for mission: {request.mission.title}"
        )
        return await evaluate_agent_instructions(request)
    except Exception as exc:
        logger.error(f"Error evaluating agent instructions: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/agent-missions/completed")
async def save_completed_mission(
    request_data: CompletedAgentMissionRequest, current_user: UserDep, db: DbDep
) -> dict:
    if not request_data.passed:
        return {"success": True, "message": "Failed mission not saved"}

    try:
        # Check if already exists
        result = await db.execute(
            select(CompletedMission).where(
                CompletedMission.user_id == current_user.id,
                CompletedMission.mission_id == request_data.missionId,
            )
        )
        existing = result.scalars().first()

        from models.user import UserProfile

        # Check if user profile exists, create if not
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.id)
        )
        profile = profile_result.scalars().first()
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
            await db.flush()

        user_level = request_data.userLevel
        sub_level = request_data.subLevel

        if not user_level:
            user_level = profile.level
        if sub_level == 0:
            sub_level = profile.sub_level

        if existing:
            existing.user_level = user_level
            existing.sub_level = sub_level
            existing.mission_title = request_data.missionTitle
            existing.mission_json = request_data.missionJson
            existing.user_instructions = request_data.userInstructions
            existing.reliability_score = request_data.reliabilityScore
            existing.passed = request_data.passed
            existing.updated_at = datetime.now(UTC)
        else:
            new_mission = CompletedMission(
                user_id=current_user.id,
                mission_id=request_data.missionId,
                user_level=user_level,
                sub_level=sub_level,
                mission_title=request_data.missionTitle,
                mission_json=request_data.missionJson,
                user_instructions=request_data.userInstructions,
                reliability_score=request_data.reliabilityScore,
                passed=request_data.passed,
                tool_trajectory=[],
                results=[],
            )
            db.add(new_mission)
            profile.problems_solved += 1

        await db.commit()

        # Get count of completed missions
        missions_count_res = await db.execute(
            select(func.count(CompletedMission.id)).where(
                CompletedMission.user_id == current_user.id
            )
        )
        missions_completed = missions_count_res.scalar() or 0

        # Calculate average reliability score
        avg_score_res = await db.execute(
            select(func.avg(CompletedMission.reliability_score)).where(
                CompletedMission.user_id == current_user.id
            )
        )
        avg_score = avg_score_res.scalar()
        reliability_score = round(float(avg_score)) if avg_score is not None else 0

        return {
            "success": True,
            "reliabilityScore": reliability_score,
            "level": profile.level,
            "subLevel": profile.sub_level,
            "missionsCompleted": missions_completed,
            "streak": profile.streak,
        }
    except Exception as exc:
        await db.rollback()
        logger.error(f"Error saving completed mission: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/agent-missions/completed")
async def get_completed_missions(current_user: UserDep, db: DbDep) -> list[dict]:
    result = await db.execute(
        select(CompletedMission).where(CompletedMission.user_id == current_user.id)
    )
    completed = result.scalars().all()

    return [
        {
            "id": str(mission.id),
            "missionId": mission.mission_id,
            "userLevel": mission.user_level,
            "subLevel": mission.sub_level,
            "missionTitle": mission.mission_title,
            "missionJson": mission.mission_json,
            "userInstructions": mission.user_instructions,
            "reliabilityScore": mission.reliability_score,
            "passed": mission.passed,
            "createdAt": mission.created_at.isoformat(),
        }
        for mission in completed
    ]
