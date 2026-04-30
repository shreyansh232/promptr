from fastapi import APIRouter, HTTPException

from schemas.analysis import (
    ChatRequest,
    PracticeProblemsResponse,
    PromptAnalysisResponse,
    TestCaseEvaluationRequest,
    TestCaseEvaluationResponse,
)
from schemas.user import UserType
from services.gemini_service import (
    analyze_prompt_response,
    evaluate_prompt_full,
    generate_practice_problems,
)

router = APIRouter()


@router.post("/analyze-prompt")
async def analyze_prompt(request: ChatRequest) -> PromptAnalysisResponse:
    try:
        return analyze_prompt_response(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-problems")
async def generate_problems(user_info: UserType) -> PracticeProblemsResponse:
    try:
        return generate_practice_problems(user_info)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/evaluate-prompt")
async def evaluate_prompt(
    request: TestCaseEvaluationRequest,
) -> TestCaseEvaluationResponse:
    try:
        test_cases = [tc.model_dump() for tc in request.testCases]
        result = evaluate_prompt_full(request.prompt, test_cases)
        return TestCaseEvaluationResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
