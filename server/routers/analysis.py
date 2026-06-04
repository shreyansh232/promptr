import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.security import get_current_user
from models.user import User, CustomScenario
from schemas.analysis import (
    ChatRequest,
    CustomScenarioRequest,
    PracticeProblemsResponse,
    PromptAnalysisResponse,
    TestCaseEvaluationRequest,
    TestCaseEvaluationResponse,
)
from schemas.user import UserType
from services.llm_service import (
    analyze_prompt_response,
    evaluate_prompt_full,
    generate_custom_scenario,
    generate_practice_problems,
)

router = APIRouter()
DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


def format_custom_scenario(scenario: CustomScenario) -> dict:
    return {
        "id": str(scenario.id),
        "title": scenario.title,
        "difficulty": scenario.difficulty,
        "description": scenario.description,
        "goal": scenario.goal,
        "agentDescription": scenario.agent_description,
        "tools": json.dumps(scenario.tools)
        if isinstance(scenario.tools, (list, dict))
        else str(scenario.tools),
        "examples": json.dumps(scenario.examples)
        if isinstance(scenario.examples, (list, dict))
        else str(scenario.examples),
        "testCases": json.dumps(scenario.test_cases)
        if isinstance(scenario.test_cases, (list, dict))
        else str(scenario.test_cases),
        "hint": scenario.hint or "",
        "tags": scenario.tags or [],
        "createdAt": scenario.created_at.isoformat() if scenario.created_at else "",
    }


@router.post("/analyze-prompt")
async def analyze_prompt(request: ChatRequest) -> PromptAnalysisResponse:
    try:
        logger.info(f"Analyzing prompt for user: {request.user_type.userId}")
        return await analyze_prompt_response(request)
    except Exception as exc:
        logger.error(f"Error analyzing prompt: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-problems")
async def generate_problems(user_info: UserType, db: DbDep) -> PracticeProblemsResponse:
    try:
        logger.info(f"Generating problems for user: {user_info.userId}")
        # Caching removed for now, we'll rely on redis in the future
        response = await generate_practice_problems(user_info)
        return response
    except Exception as exc:
        logger.error(f"Error generating problems: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/evaluate-prompt")
async def evaluate_prompt(
    request: TestCaseEvaluationRequest,
) -> TestCaseEvaluationResponse:
    try:
        logger.info(f"Evaluating prompt for problem: {request.problemTitle}")
        test_cases = [tc.model_dump() for tc in request.testCases]
        result = await evaluate_prompt_full(
            request.prompt,
            test_cases,
            problem_title=request.problemTitle,
            problem_description=request.problemDescription,
            problem_goal=request.problemGoal,
        )
        return TestCaseEvaluationResponse(**result)
    except Exception as exc:
        logger.error(f"Error evaluating prompt: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-custom-scenario")
async def generate_custom_scenario_endpoint(
    request: CustomScenarioRequest,
) -> dict:
    try:
        return await generate_custom_scenario(request.agentDescription, request.tools)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/custom-scenarios")
async def get_custom_scenarios(
    current_user: UserDep,
    db: DbDep,
):
    try:
        result = await db.execute(
            select(CustomScenario)
            .where(CustomScenario.user_id == current_user.id)
            .order_by(CustomScenario.created_at.desc())
        )
        scenarios = result.scalars().all()
        return {"customScenarios": [format_custom_scenario(s) for s in scenarios]}
    except Exception as exc:
        logger.error(f"Error fetching custom scenarios: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/custom-scenarios")
async def create_custom_scenario(
    request: CustomScenarioRequest,
    current_user: UserDep,
    db: DbDep,
):
    try:
        problem = await generate_custom_scenario(
            request.agentDescription, request.tools
        )
        db_scenario = CustomScenario(
            user_id=current_user.id,
            title=problem.get("title", "Custom Scenario"),
            difficulty=problem.get("difficulty", "Intermediate"),
            description=problem.get("description", ""),
            goal=problem.get("goal", ""),
            agent_description=request.agentDescription,
            tools=problem.get("availableTools", []),
            examples=problem.get("visibleExamples", []),
            test_cases=problem.get("testCases", []),
            pro_tips=problem.get("proTips", []),
            tags=problem.get("tags", []),
            hint=problem.get("hint", ""),
        )
        db.add(db_scenario)
        await db.commit()
        await db.refresh(db_scenario)
        return {"customScenario": format_custom_scenario(db_scenario)}
    except Exception as exc:
        logger.error(f"Error creating custom scenario: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/custom-scenarios")
async def delete_custom_scenario(
    id: str,
    current_user: UserDep,
    db: DbDep,
):
    try:
        try:
            scenario_uuid = uuid.UUID(id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid custom scenario ID")
        result = await db.execute(
            select(CustomScenario).where(
                CustomScenario.id == scenario_uuid,
                CustomScenario.user_id == current_user.id,
            )
        )
        scenario = result.scalars().first()
        if not scenario:
            raise HTTPException(status_code=404, detail="Custom scenario not found")
        await db.delete(scenario)
        await db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error deleting custom scenario: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
