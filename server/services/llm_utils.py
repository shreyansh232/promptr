import json
import re

from schemas.analysis import (
    PracticeExample,
    PracticeProblem,
    PracticeProblemsResponse,
    PracticeTestCase,
    PromptAnalysisResponse,
    PromptSuggestion,
)

ANALYSIS_RESPONSE_SHAPE = {
    "label": "MODERATE",
    "score": 65,
    "feedback": "Explain in plain language what is working and what is missing.",
    "motivation": "Encourage the learner with one honest next step.",
    "tags": ["task-clarity", "context", "constraints", "output-format"],
    "response": "Describe the kind of answer this prompt would likely produce.",
    "learning_points": [
        "One short lesson",
        "A second short lesson",
        "A third short lesson",
    ],
    "improved_prompts": [
        {
            "title": "Clarify the task",
            "prompt": "Improved prompt text",
            "reasoning": "Explain why this version is easier for the model to follow.",
        },
        {
            "title": "Add context and constraints",
            "prompt": "Improved prompt text",
            "reasoning": "Explain what extra context or guardrails were added.",
        },
        {
            "title": "Define the output",
            "prompt": "Improved prompt text",
            "reasoning": "Explain how the output format improves consistency.",
        },
    ],
}

PRACTICE_PROBLEMS_RESPONSE_SHAPE = {
    "problems": [
        {
            "id": 1,
            "title": "Product Description Generator",
            "difficulty": "Easy",
            "description": "Create a prompt that generates compelling product descriptions for e-commerce listings. The prompt should:\n\n1. Extract key product features and specifications\n2. Generate engaging marketing copy\n3. Include relevant keywords for SEO\n4. Maintain a consistent brand voice\n5. Be adaptable for different product categories\n\nYour prompt will be tested with various product types and evaluated based on the quality and consistency of the generated descriptions.",
            "goal": "Create a prompt that successfully handles all test cases below. Your prompt will be evaluated based on accuracy, consistency, and quality of outputs.",
            "examples": [
                {
                    "input": "Wireless Bluetooth Earbuds, 24-hour battery life, water-resistant, noise-cancelling",
                    "output": "Experience uninterrupted music with these premium wireless earbuds. Featuring advanced Bluetooth technology and impressive 24-hour battery life, these earbuds are perfect for your active lifestyle. The water-resistant design ensures durability, while noise-cancelling technology delivers crystal-clear sound quality. Whether you're working out or commuting, these earbuds are your ideal audio companion.",
                    "explanation": "The prompt successfully transformed technical specifications into compelling marketing copy while maintaining readability and highlighting key features.",
                }
            ],
            "testCases": [
                {
                    "input": "Organic Green Tea, 100 bags, antioxidant-rich, sourced from Japanese farms",
                    "expectedOutput": "A compelling product description that highlights health benefits, origin, quantity, and appeals to health-conscious consumers.",
                    "description": "Generate a product description for a health food item that emphasizes wellness and quality sourcing.",
                }
            ],
            "proTips": [
                "Be specific and clear in your prompt instructions",
                "Include examples in your prompt to guide the AI",
                "Define the desired output format and tone",
                "Test with edge cases to ensure robustness",
            ],
            "tags": [
                "structured-output",
                "audience-awareness",
                "task-clarity",
            ],
            "hint": "Try stating the desired format explicitly (e.g. 'Use a professional yet engaging tone in exactly 4 sentences').",
        }
    ]
}

ANALYSIS_FALLBACK = PromptAnalysisResponse(
    label="MODERATE",
    score=50,
    feedback=(
        "Your prompt has a starting point, but it needs a clearer task, stronger context, "
        "and a more explicit output target."
    ),
    motivation="Revise one part at a time: task first, then context, then output format.",
    tags=["task-clarity", "context", "output-format"],
    content="The current draft would likely produce a generic answer because key details are missing.",
    learning_points=[
        "Say exactly what the model should do.",
        "Add only the context that helps the model make better decisions.",
        "Name the output format when structure matters.",
    ],
    improved_prompts=[],
)

PROBLEMS_FALLBACK = PracticeProblemsResponse(
    problems=[
        PracticeProblem(
            id=1,
            title="Fix a vague prompt",
            difficulty="Easy",
            description=(
                "Rewrite a vague request so the task, context, and desired output are clear. "
                "Keep the final prompt under 80 words."
            ),
            goal="Improve the vague request to be clear, specific, and structured using zero-shot prompting.",
            examples=[
                PracticeExample(
                    input="Write something about climate change.",
                    output=(
                        "Act as a science writer. Explain climate change to high school students "
                        "in 3 short paragraphs using simple language and one real-world example."
                    ),
                    explanation="The rewrite adds role, audience, scope, and output shape.",
                )
            ],
            testCases=[
                PracticeTestCase(
                    input="Make this better: Tell me about pricing.",
                    expectedOutput=(
                        "A clearer prompt with a defined audience, pricing context, and response format."
                    ),
                    description="Practice turning a vague business request into a usable prompt.",
                )
            ],
            proTips=[
                "Define a clear role/persona.",
                "Specify target audience/context.",
                "Define expected structure.",
            ],
            tags=["task-clarity", "audience-awareness", "output-format"],
            hint="Hint: Try starting your prompt with 'Act as a [role]' to set a clear persona, and specify the exact bullet format in your instructions.",
        )
    ]
)

LEVEL_GUIDANCE = {
    "beginner": (
        "Teach with short sentences, concrete examples, and one improvement idea at a time. "
        "Avoid jargon unless you define it in simple words."
    ),
    "intermediate": (
        "Teach with concise reasoning, point out tradeoffs, and show how better constraints "
        "lead to more reliable outputs."
    ),
    "expert": (
        "Teach with precision, discuss robustness and evaluation criteria, and emphasize iterative refinement."
    ),
}


def _normalize_level(level: str) -> str:
    if level == "advanced":
        return "expert"
    return level if level in LEVEL_GUIDANCE else "beginner"


def _format_goals(goals: list[str]) -> str:
    cleaned_goals = [goal.strip() for goal in goals if goal.strip()]
    if cleaned_goals:
        return ", ".join(cleaned_goals)
    return "Build stronger prompts"


def _analysis_response_fallback(prompt: str) -> PromptAnalysisResponse:
    fallback = ANALYSIS_FALLBACK.model_copy(deep=True)
    fallback.improved_prompts = [
        PromptSuggestion(
            title="Simple rewrite",
            prompt=(
                "Act as a helpful expert. Complete this task: "
                f"{prompt.strip()} "
                "Use a clear structure and finish with a concise summary."
            ),
            reasoning="This rewrite makes the task explicit and asks for a structured response.",
        )
    ]
    return fallback


def _parse_llm_json(raw: str) -> dict:
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())
