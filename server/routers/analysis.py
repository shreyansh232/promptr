from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
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
