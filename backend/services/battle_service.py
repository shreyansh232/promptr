"""
Prompt Battle Service — async PvP prompt evaluation.

Flow:
1. User creates a battle (WAITING status)
2. Another user joins (ACTIVE status)
3. Both submit prompts independently
4. When both submitted, evaluate both against test cases
5. Higher score wins; tiebreaker = fewer tokens
6. ELO exchanged between participants
"""

import json
from typing import Optional

try:
    from backend.schemas.battle import (
        CreateBattleRequest,
        SubmitPromptRequest,
    )
    from backend.services.gemini_service import (
        evaluate_prompt_full,
        _send_prompt,
    )
except ImportError:
    from schemas.battle import (
        CreateBattleRequest,
        SubmitPromptRequest,
    )
    from services.gemini_service import (
        evaluate_prompt_full,
        _send_prompt,
    )

# ELO exchange amounts for battles
BATTLE_WIN_ELO = 30
BATTLE_LOSS_ELO = -20
BATTLE_DRAW_ELO = 5


def _build_battle_objective_prompt(title: str, description: str, goal: str) -> str:
    """Generate a battle objective using the LLM if not provided."""
    return f"""
You are creating a prompt engineering battle.

Battle: {title}
Description: {description}
Goal: {goal}

Create 2 test cases for this battle. Each test case should have:
- input: The raw input data the prompt will receive
- expectedOutput: Description of what a good output should contain
- description: What aspect this test case evaluates

Return valid JSON only. No markdown fences. Use this exact shape:
{{
    "testCases": [
        {{
            "input": "...",
            "expectedOutput": "...",
            "description": "..."
        }}
    ]
}}
"""


def generate_battle_test_cases(title: str, description: str, goal: str) -> list[dict]:
    """Generate test cases for a battle using the LLM."""
    try:
        raw = _send_prompt(_build_battle_objective_prompt(title, description, goal))
        # Strip markdown fences if present
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
        return data.get("testCases", [])
    except Exception:
        # Fallback test cases
        return [
            {
                "input": "Sample input 1",
                "expectedOutput": "A well-structured response that addresses the core task",
                "description": "Tests basic prompt effectiveness",
            },
            {
                "input": "Sample input 2 with edge case",
                "expectedOutput": "A response that handles the edge case gracefully",
                "description": "Tests edge case handling",
            },
        ]
