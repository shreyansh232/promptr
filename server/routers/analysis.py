from fastapi import APIRouter, Depends, HTTPException
from motor.core import AgnosticDatabase
from datetime import datetime, UTC

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
    generate_practice_problems,
    generate_custom_scenario,
)

router = APIRouter()


@router.post("/analyze-prompt")
async def analyze_prompt(request: ChatRequest) -> PromptAnalysisResponse:
    try:
        return await analyze_prompt_response(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-problems")
async def generate_problems(
    user_info: UserType, db: AgnosticDatabase = Depends(get_db)
) -> PracticeProblemsResponse:
    try:
        if user_info.userId:
            cached = await db.generated_problems.find_one(
                {
                    "userId": user_info.userId,
                    "level": user_info.level,
                    "subLevel": user_info.subLevel,
                }
            )
            if cached and "problems" in cached:
                problems = cached["problems"]
                # Skip cache if it contains ONLY the fallback problem so the user can get a real generated problem
                if not (
                    problems
                    and len(problems) == 1
                    and problems[0].get("title") == "Fix a vague prompt"
                ):
                    return PracticeProblemsResponse(problems=problems)

        response = await generate_practice_problems(user_info)

        if user_info.userId and response.problems:
            # Do NOT save fallback problems to the database cache
            if not (
                len(response.problems) == 1
                and response.problems[0].title == "Fix a vague prompt"
            ):
                db_doc = {
                    "userId": user_info.userId,
                    "level": user_info.level,
                    "subLevel": user_info.subLevel,
                    "problems": [p.model_dump() for p in response.problems],
                    "createdAt": datetime.now(UTC),
                }
                await db.generated_problems.replace_one(
                    {
                        "userId": user_info.userId,
                        "level": user_info.level,
                        "subLevel": user_info.subLevel,
                    },
                    db_doc,
                    upsert=True,
                )

        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/evaluate-prompt")
async def evaluate_prompt(
    request: TestCaseEvaluationRequest,
) -> TestCaseEvaluationResponse:
    try:
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
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-custom-scenario")
async def generate_custom_scenario_endpoint(
    request: CustomScenarioRequest,
) -> dict:
    try:
        return await generate_custom_scenario(request.agentDescription, request.tools)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
