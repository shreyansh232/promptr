from services.gemini_service import (
    analyze_prompt_response,
    evaluate_prompt_full,
    _parse_gemini_json,
)
from schemas.analysis import ChatRequest
from schemas.user import UserType


def test_parse_gemini_json():
    raw = '```json\n{"key": "value"}\n```'
    assert _parse_gemini_json(raw) == {"key": "value"}

    raw = '{"key": "value"}'
    assert _parse_gemini_json(raw) == {"key": "value"}


def test_analyze_prompt_response_success(mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[
        0
    ].message.content = '{"label": "STRONG", "score": 90, "feedback": "G", "motivation": "M", "tags": [], "response": "R", "learning_points": [], "improved_prompts": []}'

    request = ChatRequest(
        user_type=UserType(
            level="beginner", expertise="E", goals=[], learning_style="visual"
        ),
        messages=[{"role": "user", "content": "test prompt"}],
    )

    result = analyze_prompt_response(request)
    assert result.label == "STRONG"
    assert result.score == 90


def test_analyze_prompt_response_fallback(mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[0].message.content = "Invalid JSON"

    request = ChatRequest(
        user_type=UserType(
            level="beginner", expertise="E", goals=[], learning_style="visual"
        ),
        messages=[{"role": "user", "content": "test prompt"}],
    )

    result = analyze_prompt_response(request)
    assert result.label == "MODERATE"  # Fallback label
    assert "Invalid JSON" in result.content


def test_evaluate_prompt_against_test_case(mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[
        0
    ].message.content = '{"score": 75, "passed": true, "reasoning": "R", "missing_elements": [], "strengths": []}'

    from services.gemini_service import evaluate_prompt_against_test_case

    result = evaluate_prompt_against_test_case("p", "i", "e", "d")

    assert result["score"] == 75
    assert result["passed"] is True


def test_evaluate_prompt_full(mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[
        0
    ].message.content = '{"score": 80, "passed": false, "reasoning": "R", "missing_elements": [], "strengths": []}'

    test_cases = [{"input": "i", "expectedOutput": "o", "description": "d"}]
    result = evaluate_prompt_full("prompt", test_cases)

    assert result["overallScore"] == 80
    assert result["testCasesTotal"] == 1
    assert result["passed"] is False
