import json
from textwrap import dedent

from services.llm_utils import (
    PRACTICE_PROBLEMS_RESPONSE_SHAPE,
    _format_goals,
    _normalize_level,
)

from schemas.user import UserType


def build_problems_prompt(user_info: UserType) -> str:
    level = _normalize_level(user_info.level)
    goals = _format_goals(user_info.goals)
    response_shape = json.dumps(PRACTICE_PROBLEMS_RESPONSE_SHAPE, indent=2)

    sub_level_guidance = ""
    if user_info.subLevel == 1:
        sub_level_guidance = (
            "Sublevel 1 (Problem 1 of 5): Keep it extremely basic and foundational for an absolute beginner. "
            "Create a very simple prompt writing drill. Focus strictly on basic role setting and clear task description."
        )
    elif user_info.subLevel == 2:
        sub_level_guidance = (
            "Sublevel 2 (Problem 2 of 5): Introduce basic CONSTRAINTS (e.g., length limits, tone restrictions) "
            "and simple OUTPUT FORMATTING (e.g., bullet points or key-value structures)."
        )
    elif user_info.subLevel == 3:
        sub_level_guidance = (
            "Sublevel 3 (Problem 3 of 5): Introduce FEW-SHOT prompting. "
            "Require the user to write a prompt that includes 1 or 2 high-quality examples."
        )
    elif user_info.subLevel == 4:
        sub_level_guidance = (
            "Sublevel 4 (Problem 4 of 5): Introduce CHAIN-OF-THOUGHT (CoT) prompting. "
            "Create a reasoning-heavy task where the model must think step-by-step."
        )
    else:
        sub_level_guidance = (
            "Sublevel 5 (Problem 5 of 5): Introduce ADVANCED prompt engineering concepts. "
            "Focus on prompt robustness against edge cases or performing self-consistency checks."
        )

    application_context = ""
    if user_info.application and user_info.application.strip():
        application_context = f"""
        - Application: {user_info.application}
        CRITICAL: The problem MUST be grounded in the learner's application area: "{user_info.application}".
        All examples and evaluation scenarios should relate to this use case.
        """
    else:
        application_context = (
            "- Application: Not specified (use general prompt engineering scenarios)"
        )

    return dedent(
        f"""
        You are Promptr Coach creating practice drills for a prompt engineering learner.

        === SKILL PROGRESSION CONTEXT ===
        The learner is currently at:
        - Level Tier: {level}
        - Problem Progress: {user_info.subLevel} of 5

        CRITICAL REQUIREMENT FOR PROGRESSION AND PERSONALIZATION:
        {sub_level_guidance}

        === KNOWLEDGE BASE & ADVANCED SKILLS ===
        Before generating any problem, ensure it reinforces Core Elements (Instruction, Context, Input Data, Output Indicator)
        and Advanced Skills (Few-Shot, CoT, Optimization, Template Systems, System Prompt Design, Progressive Disclosure, Error Recovery).
        Explicitly instruct the user to use these skills.

        === PROBLEM GENERATION RULES ===
        Learner profile:
        - Level: {level}
        - Industry/Expertise: {user_info.expertise}
        {application_context}
        - Learning style: {user_info.learning_style}
        - Goals: {goals}

        Create 1 unique practice problem tailored to this learner's profile.
        CRITICAL: The problem must be NEW and DIFFERENT from common or previously seen problems.

        === PROBLEM DESCRIPTION FORMAT (follow strictly) ===
        The description field must read like a LeetCode problem statement — terse, technical, no preamble.
        - TOTAL description: 80–180 words. Anything over 200 is rejected.
        - Start with a single sentence stating the concrete task (e.g. "Create a prompt that...").
        - Follow with a numbered list of 4-5 specific requirements.
        - End with one sentence describing how the prompt will be tested.
        - Goal field: 1 sentence, ≤ 25 words. State the win condition.

        Return valid JSON only. No markdown fences. Use this exact shape:
        {response_shape}
        """
    ).strip()
