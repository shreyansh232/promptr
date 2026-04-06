from fastapi import APIRouter, HTTPException

try:
    from backend.schemas.analysis import (
        ChatRequest,
        PracticeProblemsResponse,
        PromptAnalysisResponse,
    )
    from backend.schemas.user import UserType
    from backend.services.gemini_service import (
        analyze_prompt_response,
        generate_practice_problems,
    )
except ImportError:
    from schemas.analysis import (
        ChatRequest,
        PracticeProblemsResponse,
        PromptAnalysisResponse,
    )
    from schemas.user import UserType
    from services.gemini_service import (
        analyze_prompt_response,
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
