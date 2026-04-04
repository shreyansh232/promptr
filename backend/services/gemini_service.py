import json
import os
import re

import google.generativeai as genai

try:
    from backend.core.config import BACKEND_DIR
    from backend.schemas.analysis import ChatRequest
    from backend.schemas.user import UserType
except ImportError:
    from core.config import BACKEND_DIR
    from schemas.analysis import ChatRequest
    from schemas.user import UserType

API_KEY = os.environ.get("api_key")
if not API_KEY:
    raise RuntimeError(f"Missing 'api_key' in environment. Set it in {BACKEND_DIR / '.env'}")

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("gemini-2.0-flash")

ANALYSIS_FALLBACK = {
    "label": "MODERATE",
    "feedback": "Let's explore your prompt together and make it even better!",
    "motivation": "Great effort! Every prompt you write sharpens your skills.",
    "tags": ["growth-opportunity"],
    "learning_points": [
        "Review the structure of your prompt",
        "Consider adding more context",
    ],
}


def _parse_gemini_json(raw: str) -> dict:
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


def _build_analysis_prompt(user_info: UserType, prompt: str) -> str:
    return f"""
    You are an encouraging prompt engineering expert and mentor. Consider this user profile:
    Level: {user_info.level}
    Expertise: {user_info.expertise}
    Learning Style: {user_info.learning_style}
    Goals: {', '.join(user_info.goals)}

    Analyze the following prompt and respond in this exact JSON format:
    {{
        "label": "<STRONG/MODERATE/WEAK>",
        "feedback": "<encouraging feedback highlighting strengths and growth areas>",
        "motivation": "<personalized motivational message based on user's progress>",
        "tags": ["tag1", "tag2", "tag3"],
        "response": "<your response to the prompt>",
        "learning_points": ["key lesson 1", "key lesson 2"],
        "improved_prompts": [
            {{
                "title": "<improvement focus>",
                "prompt": "<improved version 1>",
                "reasoning": "<positive reinforcement of user's approach>"
            }},
            {{
                "title": "<improvement focus>",
                "prompt": "<improved version 2>",
                "reasoning": "<connection to user's learning style>"
            }},
            {{
                "title": "<improvement focus>",
                "prompt": "<improved version 3>",
                "reasoning": "<alignment with user's goals and growth>"
            }}
        ]
    }}

    Remember to:
    1. Highlight what works well in their prompt
    2. Frame improvements as growth opportunities
    3. Connect feedback to their learning style and goals
    4. Provide specific, actionable steps forward
    5. Celebrate their progress and effort

    User Prompt: {prompt}
    """


def _build_problems_prompt(user_info: UserType) -> str:
    return f"""
    Generate 5 prompt engineering practice problems tailored for a:
    Level: {user_info.level}
    Expertise: {user_info.expertise}
    Learning Style: {user_info.learning_style}
    Goals: {', '.join(user_info.goals)}

    Return the problems in this exact JSON format:
    {{
        "problems": [
            {{
                "id": number,
                "title": "string",
                "difficulty": "Easy/Medium/Hard",
                "description": "detailed problem description",
                "examples": [{{
                    "input": "string",
                    "output": "string",
                    "explanation": "string"
                }}],
                "testCases": [{{
                    "input": "string",
                    "expectedOutput": "string",
                    "description": "string"
                }}]
            }}
        ]
    }}
    """


def _send_prompt(prompt: str) -> str:
    chat = MODEL.start_chat(history=[])
    result = chat.send_message(prompt)
    return result.text


def analyze_prompt_response(request: ChatRequest) -> dict:
    prompt = request.messages[-1].content
    raw_response = _send_prompt(_build_analysis_prompt(request.user_type, prompt))

    try:
        analysis = _parse_gemini_json(raw_response)
        return {
            "label": analysis["label"],
            "feedback": analysis["feedback"],
            "motivation": analysis.get(
                "motivation",
                "Keep going — every prompt is a step forward!",
            ),
            "tags": analysis["tags"],
            "content": analysis["response"],
            "learning_points": analysis.get("learning_points", []),
            "improved_prompts": analysis["improved_prompts"],
        }
    except (json.JSONDecodeError, KeyError):
        return {
            **ANALYSIS_FALLBACK,
            "content": raw_response,
            "improved_prompts": [
                {
                    "title": "Starting Point",
                    "prompt": prompt,
                    "reasoning": "This is your original prompt — let's build on it!",
                }
            ],
        }


def generate_practice_problems(user_info: UserType) -> dict:
    raw_response = _send_prompt(_build_problems_prompt(user_info))
    return _parse_gemini_json(raw_response)
