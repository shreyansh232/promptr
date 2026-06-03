from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from motor.core import AgnosticDatabase

from core.db import get_db
from schemas.agent import (
    AgentEvaluationRequest,
    AgentEvaluationResponse,
    AgentLearnerProfile,
    AgentMissionResponse,
    CompletedAgentMissionRequest,
)
from services.agent_service import evaluate_agent_instructions, generate_agent_mission

router = APIRouter()
DbDep = Annotated[AgnosticDatabase, Depends(get_db)]


@router.post("/agent-missions/generate")
async def generate_mission(
    profile: AgentLearnerProfile, db: DbDep
) -> AgentMissionResponse:
    try:
        cache_key = {
            "userId": profile.userId,
            "level": profile.level,
            "subLevel": profile.subLevel,
            "workflowFocus": profile.workflowFocus or profile.application,
            "riskFocus": profile.riskFocus,
        }

        if profile.userId:
            cached = await db.generated_agent_missions.find_one(cache_key)
            if cached and "mission" in cached:
                return AgentMissionResponse(mission=cached["mission"])

        response = generate_agent_mission(profile)

        if profile.userId and response.mission:
            await db.generated_agent_missions.replace_one(
                cache_key,
                {
                    **cache_key,
                    "mission": response.mission.model_dump(),
                    "createdAt": datetime.now(UTC),
                },
                upsert=True,
            )

        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/agent-instructions/evaluate")
async def evaluate_instructions(
    request: AgentEvaluationRequest,
) -> AgentEvaluationResponse:
    try:
        return evaluate_agent_instructions(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/agent-missions/completed")
async def save_completed_mission(
    request_data: CompletedAgentMissionRequest, db: DbDep
) -> dict:
    query = {
        "userId": request_data.userId,
        "userLevel": request_data.userLevel,
        "subLevel": request_data.subLevel,
        "missionId": request_data.missionId,
    }
    data = request_data.model_dump()
    data["createdAt"] = datetime.now(UTC)

    await db.completed_agent_missions.replace_one(query, data, upsert=True)
    return {"success": True}


@router.get("/agent-missions/completed/{user_id}")
async def get_completed_missions(user_id: str, db: DbDep) -> list[dict]:
    cursor = db.completed_agent_missions.find({"userId": user_id})
    completed = await cursor.to_list(length=100)
    for item in completed:
        item["id"] = str(item.pop("_id"))
        if "createdAt" in item and isinstance(item["createdAt"], datetime):
            item["createdAt"] = item["createdAt"].isoformat()
    return completed
