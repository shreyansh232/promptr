import json
import os
import re
from textwrap import dedent

from openai import OpenAI

try:
    from backend.core.config import BACKEND_DIR
    from backend.schemas.analysis import (
        ChatRequest,
        PracticeProblemsResponse,
        PromptAnalysisResponse,
    )
    from backend.schemas.user import UserType
except ImportError:
    from core.config import BACKEND_DIR
    from schemas.analysis import (
        ChatRequest,
        PracticeProblemsResponse,
        PromptAnalysisResponse,
    )
    from schemas.user import UserType

API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY:
    raise RuntimeError(
        f"Missing 'OPENAI_API_KEY' in environment. Set it in {BACKEND_DIR / '.env'}"
    )

client = OpenAI(api_key=API_KEY)
MODEL = "gpt-4o-mini"

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
        {
            "id": 1,
            "title": "Fix a vague prompt",
            "difficulty": "Easy",
            "description": (
                "Rewrite a vague request so the task, context, and desired output are clear. "
                "Keep the final prompt under 80 words."
            ),
            "examples": [
                {
                    "input": "Write something about climate change.",
                    "output": (
                        "Act as a science writer. Explain climate change to high school students "
                        "in 3 short paragraphs using simple language and one real-world example."
                    ),
                    "explanation": "The rewrite adds role, audience, scope, and output shape.",
                }
            ],
            "testCases": [
                {
                    "input": "Make this better: Tell me about pricing.",
                    "expectedOutput": (
                        "A clearer prompt with a defined audience, pricing context, and response format."
                    ),
                    "description": "Practice turning a vague business request into a usable prompt.",
                }
            ],
        }
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

LEARNING_STYLE_GUIDANCE = {
    "visual": "Use labels, side-by-side comparisons, and obvious structure.",
    "auditory": "Explain the reasoning in natural, conversational language.",
    "kinesthetic": "Give action-oriented drills and concrete next moves to try immediately.",
}


def _parse_gemini_json(raw: str) -> dict:
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


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
        {
            "title": "Simple rewrite",
            "prompt": (
                "Act as a helpful expert. Complete this task: "
                f"{prompt.strip()} "
                "Use a clear structure and finish with a concise summary."
            ),
            "reasoning": "This rewrite makes the task explicit and asks for a structured response.",
        }
    ]
    return fallback


def _build_analysis_prompt(user_info: UserType, prompt: str) -> str:
    level = _normalize_level(user_info.level)
    goals = _format_goals(user_info.goals)
    learning_style = LEARNING_STYLE_GUIDANCE.get(
        user_info.learning_style,
        "Keep the teaching style concrete and easy to follow.",
    )
    response_shape = json.dumps(ANALYSIS_RESPONSE_SHAPE, indent=2)

    return dedent(
        f"""
        You are Promptr Coach, a practical prompt engineering teacher.

        Teach prompt engineering simply. Base every judgment on these principles:
        1. A good prompt clearly states the task or instruction.
        2. Add context only when it helps the model make better decisions.
        3. Add constraints when they improve focus, quality, or safety.
        4. Specify the output format when structure matters.
        5. Prompt writing is iterative: start simple, test, and refine.

        Learner profile:
        - Level: {level}
        - Expertise: {user_info.expertise}
        - Learning style: {user_info.learning_style}
        - Goals: {goals}

        Teaching calibration:
        - {LEVEL_GUIDANCE[level]}
        - {learning_style}

        Analyze the learner's prompt with an honest but supportive tone.
        Keep feedback simple and specific.
        Do not use filler praise.
        Do not mention hidden reasoning or internal chain-of-thought.

        Grade the prompt using this rubric:
        - STRONG (score 85-100): the task is clear, the context is useful, the constraints are focused, and the output is easy to understand.
        - MODERATE (score 50-84): the prompt has a clear intent but is missing one or two key ingredients such as context, constraints, or output shape.
        - WEAK (score 0-49): the prompt is vague, underspecified, or likely to produce generic results.

        Assign a numeric score from 0 to 100 based on how well the prompt meets the criteria.
        Be honest and precise — do not inflate scores. A score of 90+ means the prompt is production-ready.

        Build the response around these teaching moves:
        - Identify the strongest part of the draft.
        - Identify the most important missing piece.
        - Explain what the model would likely do with the current version.
        - Give three rewrites with different teaching purposes:
          1. clearer task
          2. better context and constraints
          3. stronger output format or evaluation criteria
        - Make the learning points feel like reusable rules the learner can apply elsewhere.

        Return valid JSON only. No markdown fences. Use this exact shape:
        {response_shape}

        Additional rules:
        - Keep tags short and useful. Prefer tags like task-clarity, context, constraints, output-format, examples, evaluation, iteration.
        - Keep learning_points to 3 or 4 items.
        - Keep each improved prompt realistic and meaningfully better than the original.
        - If the original prompt is already strong, preserve its strengths and show refinements, not a full rewrite from scratch.

        Learner prompt:
        {prompt}
        """
    ).strip()


def _build_problems_prompt(user_info: UserType) -> str:
    level = _normalize_level(user_info.level)
    goals = _format_goals(user_info.goals)
    response_shape = json.dumps(PRACTICE_PROBLEMS_RESPONSE_SHAPE, indent=2)

    return dedent(
        f"""
        You are Promptr Coach creating practice drills for a prompt engineering learner.

        === KNOWLEDGE BASE (MANDATORY REFERENCE) ===

        Before generating any problem, consult the prompt engineering knowledge base below.
        Every problem MUST teach, test, or reinforce a concept from this knowledge base.

        ---

        # Prompt Engineering Knowledge Base

        ## 1. Elements of a Prompt
        Every effective prompt contains some combination of:
        - **Instruction**: The specific task (e.g., "Classify", "Summarize", "Write")
        - **Context**: External information that steers the model (audience, domain, background)
        - **Input Data**: The actual input to respond to
        - **Output Indicator**: The type or format of the output (e.g., "Return JSON", "Sentiment:")

        ## 2. General Tips for Designing Prompts
        - **Start Simple**: Prompt engineering is iterative. Break big tasks into subtasks.
        - **Use Clear Commands**: "Write", "Classify", "Summarize", "Translate", "Order"
        - **Be Specific**: More descriptive = better results. Provide examples for specific formats.
        - **Avoid Impreciseness**: Be direct, not clever. "Use 2-3 sentences to explain X to a high school student" beats "Keep it short and not too descriptive."
        - **Say What To Do**: Positive instructions work better than negative constraints. "Recommend from top trending movies" beats "DO NOT ask for interests."

        ## 3. Prompting Techniques
        ### Zero-Shot Prompting
        - Model performs task without examples. Works for simple, common tasks.
        - Example: "Classify the text into neutral, negative or positive. Text: I think the vacation is okay. Sentiment:"

        ### Few-Shot Prompting
        - Provide demonstrations in the prompt for in-context learning.
        - Label space and input distribution in demonstrations matter.
        - Format plays a key role — even random labels with correct format outperform no labels.

        ### Chain-of-Thought (CoT) Prompting
        - Enables complex reasoning through intermediate steps.
        - Combine with few-shot for complex tasks.
        - Zero-shot CoT: Add "Let's think step by step." to trigger reasoning.

        ### Self-Consistency
        - Generate multiple reasoning paths, select the most consistent answer.

        ### Prompt Chaining
        - Break complex tasks into a sequence of simpler prompts.

        ### Tree of Thoughts (ToT)
        - Explores multiple reasoning branches with search/evaluation.

        ### Retrieval Augmented Generation (RAG)
        - Combines prompt generation with external knowledge retrieval.

        ### ReAct (Reasoning + Acting)
        - Combines reasoning traces with tool use (search, calculator, APIs).
        - Alternates between "Thought:" and "Action:".

        ### Generate Knowledge Prompting
        - Ask model to generate relevant knowledge before answering.

        ### Program-Aided Language Models (PAL)
        - Offloads computational tasks to a code interpreter.

        ## 4. Risks and Misuses
        - **Prompt Injection**: Malicious input that overrides instructions.
        - **Prompt Leaking**: Tricks model into revealing system prompts.
        - **Jailbreaking**: Bypasses safety filters.
        - **Factuality**: LLMs can hallucinate — use RAG, ask for sources.
        - **Biases**: LLMs reflect training data biases — instruct for fairness.

        ## 5. LLM Settings
        - **Temperature**: Controls randomness (0.0 = deterministic, 1.0 = creative)
        - **Top-p**: Nucleus sampling for output diversity
        - **Max Tokens**: Maximum response length
        - **Frequency/Presence Penalty**: Controls repetition and topic diversity

        ## 6. Progression of Skills
        - **Beginner (ELO 0-1199)**: Clear instructions, specificity, zero-shot, basic few-shot
        - **Intermediate (ELO 1200-1499)**: Few-shot design, CoT, prompt chaining, edge cases
        - **Expert (ELO 1500+)**: ToT, ReAct, RAG, robustness, adversarial inputs, evaluation

        ## 7. Common Anti-Patterns
        1. Vague instruction: "Write something about X"
        2. Missing context: No audience, domain, or background
        3. No output format: Model doesn't know how to structure response
        4. Negative-only instructions: "Don't do X" without saying what to do
        5. Overly long prompts: Too much unnecessary detail
        6. No examples for complex tasks
        7. No constraints: No word limits, format requirements
        8. Mixed instructions: Multiple conflicting tasks
        9. Assuming model knowledge: No necessary domain context
        10. No evaluation criteria

        ---

        === PROBLEM GENERATION RULES ===

        Use these teaching ideas:
        - Teach prompt writing as a sequence: task, context, constraints, output format, refinement.
        - Start with simple fixes and progress toward more demanding prompt design.
        - Each exercise should teach ONE main skill from the knowledge base above.
        - Keep explanations practical, not academic.

        Learner profile:
        - Level: {level}
        - Expertise: {user_info.expertise}
        - Learning style: {user_info.learning_style}
        - Goals: {goals}

        Create 1 practice problem tailored to this learner's profile.

        The problem MUST:
        1. Teach or test a specific concept from the knowledge base above.
        2. Match the learner's level (beginner = clarity/specificity, intermediate = reasoning/few-shot, expert = robustness/advanced techniques).
        3. Include at least one anti-pattern from the knowledge base for the learner to fix or avoid.

        === PROBLEM DESCRIPTION FORMAT (follow strictly) ===

        The description field must read like a LeetCode problem statement — NOT a lesson intro.

        BAD (lesson intro style — do NOT write this):
        "In this exercise, you'll improve a vague prompt to make it clearer and more actionable.
        A clear prompt helps the AI understand exactly what you need, leading to better responses."

        GOOD (LeetCode problem style — write like this):
        "Create a prompt that generates clear and concise explanations for code snippets.
        The prompt should:

        1. Analyze the given code snippet and identify its purpose
        2. Explain the code's functionality in simple terms
        3. Highlight key programming concepts used in the code
        4. Provide examples of how the code might be used
        5. Suggest potential improvements or alternative approaches

        Your prompt will be tested with various code snippets in different programming languages
        and evaluated based on the clarity and accuracy of the explanations generated."

        Rules for the description:
        - Start with a single sentence stating the concrete task (e.g. "Create a prompt that...").
        - Follow with a numbered list of 4-6 specific requirements the prompt must satisfy.
        - End with a sentence describing how the prompt will be tested and evaluated.
        - Never start with "In this exercise" or "You'll learn" — state the task directly.

        === OTHER FIELDS ===

        The problem must also include:
        - A goal statement explaining what success looks like
        - At least 1 example showing input → output with explanation
        - At least 2 test cases with input, expected output description, and what's being tested
        - 3-4 pro tips for writing good prompts (reference specific techniques from the knowledge base)

        Keep it practical and industry-specific.

        Return valid JSON only. No markdown fences. Use this exact shape:
        {response_shape}
        """
    ).strip()


def _send_prompt(prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content or ""


def analyze_prompt_response(request: ChatRequest) -> PromptAnalysisResponse:
    prompt = request.messages[-1].content
    raw_response = _send_prompt(_build_analysis_prompt(request.user_type, prompt))

    try:
        analysis = _parse_gemini_json(raw_response)
        return PromptAnalysisResponse.model_validate(
            {
                "label": analysis["label"],
                "score": analysis.get("score", 50),
                "feedback": analysis["feedback"],
                "motivation": analysis.get(
                    "motivation",
                    "Keep iterating. Small prompt changes can produce much better outputs.",
                ),
                "tags": analysis["tags"],
                "content": analysis["response"],
                "learning_points": analysis.get("learning_points", []),
                "improved_prompts": analysis["improved_prompts"],
            }
        )
    except (json.JSONDecodeError, KeyError, ValueError):
        fallback = _analysis_response_fallback(prompt)
        fallback.content = raw_response
        return fallback


def generate_practice_problems(user_info: UserType) -> PracticeProblemsResponse:
    raw_response = _send_prompt(_build_problems_prompt(user_info))

    try:
        return PracticeProblemsResponse.model_validate(_parse_gemini_json(raw_response))
    except (json.JSONDecodeError, KeyError, ValueError):
        return PROBLEMS_FALLBACK
