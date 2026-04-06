from pydantic import BaseModel

try:
    from backend.schemas.user import UserType
except ImportError:
    from schemas.user import UserType


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    user_type: UserType


class PromptSuggestion(BaseModel):
    title: str
    prompt: str
    reasoning: str


class PromptAnalysisResponse(BaseModel):
    label: str
    score: int
    feedback: str
    motivation: str
    tags: list[str]
    content: str
    learning_points: list[str]
    improved_prompts: list[PromptSuggestion]


class PracticeExample(BaseModel):
    input: str
    output: str
    explanation: str


class PracticeTestCase(BaseModel):
    input: str
    expectedOutput: str
    description: str


class PracticeProblem(BaseModel):
    id: int
    title: str
    difficulty: str
    description: str
    goal: str = ""
    examples: list[PracticeExample]
    testCases: list[PracticeTestCase]
    proTips: list[str] = []


class PracticeProblemsResponse(BaseModel):
    problems: list[PracticeProblem]


class TestCaseEvaluationRequest(BaseModel):
    prompt: str
    testCases: list[PracticeTestCase]


class TestCaseResult(BaseModel):
    score: int
    passed: bool
    reasoning: str
    missing_elements: list[str] = []
    strengths: list[str] = []
    testCase: str = ""


class TestCaseEvaluationResponse(BaseModel):
    overallScore: int
    passed: bool
    testCasesPassed: int
    testCasesTotal: int
    results: list[TestCaseResult]
