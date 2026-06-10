import asyncio
import json
import os

from openai import AsyncOpenAI

from core.config import BACKEND_DIR
from prompts.analysis import build_analysis_prompt
from prompts.evaluation import build_evaluation_prompt
from prompts.problems import build_problems_prompt
from prompts.scenario import build_scenario_prompt
from schemas.analysis import (
    ChatRequest,
    CustomScenarioResponse,
    PracticeProblemsResponse,
    PromptAnalysisResponse,
    TestCaseEvaluationResult,
)
from schemas.user import UserType
from services.llm_utils import (
    CUSTOM_SCENARIO_FALLBACK,
    PROBLEMS_FALLBACK,
    SCENARIO_INJECTION_FALLBACK,
    _analysis_response_fallback,
    _parse_llm_json,
)

API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY:
    raise RuntimeError(
        f"Missing 'OPENAI_API_KEY' in environment. Set it in {BACKEND_DIR / '.env'}"
    )

client = AsyncOpenAI(api_key=API_KEY)
MODEL = "gpt-4o-mini"  # Update model if necessary


def check_for_direct_injection_patterns(text: str) -> tuple[bool, str | None]:
    if not text:
        return False, None
    lower_text = text.lower()
    hijack_patterns = [
        '"score": 100',
        '"passed": true',
        '"score": 90',
        "score: 100",
        "passed: true",
        "ignore the evaluator instructions",
        "ignore the judging rules",
        "override the evaluation score",
        "force the evaluation to pass",
        "ignore previous instructions",
        "ignore system instructions",
        "ignore system prompt",
        "bypass rules",
        "bypass the rules",
        "bypass constraints",
        "bypass the constraints",
    ]
    for pattern in hijack_patterns:
        if pattern in lower_text:
            return True, f"System override attempt detected via pattern: '{pattern}'"
    return False, None


async def _send_prompt(prompt: str, timeout: int = 60) -> str:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        timeout=timeout,
    )
    return response.choices[0].message.content or ""


async def analyze_prompt_response(request: ChatRequest) -> PromptAnalysisResponse:
    prompt = request.messages[-1].content
    is_injection, reason = check_for_direct_injection_patterns(prompt)
    if is_injection:
        return PromptAnalysisResponse(
            label="WEAK",
            score=0,
            feedback=f"Security warning: Prompt injection or system instruction override attempt detected. ({reason})",
            motivation="Please write valid, safe prompt instructions to get feedback.",
            tags=["security-violation"],
            content="Violation detected.",
            learning_points=[
                "Write safe prompt instructions",
                "Do not attempt system overrides",
            ],
            improved_prompts=[],
        )

    raw_response = await _send_prompt(build_analysis_prompt(request.user_type, prompt))
    try:
        analysis = _parse_llm_json(raw_response)
        return PromptAnalysisResponse.model_validate(
            {
                "label": analysis["label"],
                "score": analysis.get("score", 50),
                "feedback": analysis["feedback"],
                "motivation": analysis.get("motivation", "Keep iterating."),
                "tags": analysis["tags"],
                "content": analysis["content"],
                "learning_points": analysis.get("learning_points", []),
                "improved_prompts": analysis["improved_prompts"],
            }
        )
    except (json.JSONDecodeError, KeyError, ValueError):
        fallback = _analysis_response_fallback(prompt)
        fallback.content = raw_response
        return fallback


async def generate_practice_problems(user_info: UserType) -> PracticeProblemsResponse:
    raw_response = await _send_prompt(build_problems_prompt(user_info))
    try:
        return PracticeProblemsResponse.model_validate(_parse_llm_json(raw_response))
    except (json.JSONDecodeError, KeyError, ValueError):
        return PROBLEMS_FALLBACK


async def generate_custom_scenario(
    agent_desc: str, tools_desc: str
) -> CustomScenarioResponse:
    is_injection, reason = check_for_direct_injection_patterns(agent_desc)
    if not is_injection and tools_desc:
        is_injection, reason = check_for_direct_injection_patterns(tools_desc)
    if is_injection:
        return SCENARIO_INJECTION_FALLBACK

    raw_response = await _send_prompt(build_scenario_prompt(agent_desc, tools_desc))
    try:
        return CustomScenarioResponse.model_validate(_parse_llm_json(raw_response))
    except (json.JSONDecodeError, KeyError, ValueError):
        return CUSTOM_SCENARIO_FALLBACK


async def evaluate_prompt_against_test_case(
    user_prompt: str,
    test_input: str,
    expected_output: str,
    test_description: str,
    problem_title: str = "",
    problem_description: str = "",
    problem_goal: str = "",
) -> dict:
    is_injection, reason = check_for_direct_injection_patterns(user_prompt)
    if is_injection:
        return TestCaseEvaluationResult(
            score=0,
            passed=False,
            reasoning=f"Security warning: ({reason})",
            missing_elements=["Security: valid prompt instructions required"],
            strengths=[],
        ).model_dump()

    raw_response = await _send_prompt(
        build_evaluation_prompt(
            user_prompt,
            test_input,
            expected_output,
            test_description,
            problem_title,
            problem_description,
            problem_goal,
        )
    )
    try:
        result = TestCaseEvaluationResult.model_validate(_parse_llm_json(raw_response))
        return result.model_dump()
    except (json.JSONDecodeError, KeyError, ValueError):
        return TestCaseEvaluationResult(
            score=50,
            passed=False,
            reasoning="Could not evaluate. Please try again.",
            missing_elements=[],
            strengths=[],
        ).model_dump()


async def evaluate_prompt_full(
    user_prompt: str,
    test_cases: list[dict],
    problem_title: str = "",
    problem_description: str = "",
    problem_goal: str = "",
) -> dict:
    async def evaluate_single(tc: dict) -> dict:
        result = await evaluate_prompt_against_test_case(
            user_prompt,
            tc.get("input", ""),
            tc.get("expectedOutput", ""),
            tc.get("description", ""),
            problem_title,
            problem_description,
            problem_goal,
        )
        result["testCase"] = tc.get("description", "")
        return result

    if not test_cases:
        return {
            "overallScore": 0,
            "passed": False,
            "testCasesPassed": 0,
            "testCasesTotal": 0,
            "results": [],
        }

    results = await asyncio.gather(*(evaluate_single(tc) for tc in test_cases))
    total_score = sum(r["score"] for r in results)
    avg_score = round(total_score / len(test_cases))
    passed_count = sum(1 for r in results if r["passed"])

    return {
        "overallScore": avg_score,
        "passed": avg_score >= 90,
        "testCasesPassed": passed_count,
        "testCasesTotal": len(test_cases),
        "results": results,
    }
