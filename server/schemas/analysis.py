from typing import Any

from pydantic import BaseModel, Field

from schemas.user import UserType


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    user_type: UserType


class CustomScenarioRequest(BaseModel):
    agentDescription: str
    tools: str = ""


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
    tags: list[str] = []
    hint: str = ""


class PracticeProblemsResponse(BaseModel):
    problems: list[PracticeProblem]


class TestCaseEvaluationRequest(BaseModel):
    prompt: str
    testCases: list[PracticeTestCase]
    problemTitle: str = ""
    problemDescription: str = ""
    problemGoal: str = ""


class TestCaseResult(BaseModel):
    score: int
    passed: bool
    reasoning: str
    missing_elements: list[str] = []
    strengths: list[str] = []
    testCase: str = ""


class TestCaseEvaluationResult(BaseModel):
    """Raw LLM response shape for single test case evaluation."""

    score: int
    passed: bool
    reasoning: str
    missing_elements: list[str] = []
    strengths: list[str] = []


class TestCaseEvaluationResponse(BaseModel):
    overallScore: int
    passed: bool
    testCasesPassed: int
    testCasesTotal: int
    results: list[TestCaseResult]


class ScenarioTool(BaseModel):
    name: str
    description: str
    inputSchema: dict[str, Any] = Field(default_factory=dict)
    riskLevel: str = "low"
    sideEffects: str = ""
    expectedUsage: str = ""


class ScenarioExample(BaseModel):
    input: str
    expectedBehavior: str
    explanation: str


class ScenarioTestCase(BaseModel):
    id: str
    input: str
    simulatedContext: str = ""
    expectedBehavior: str
    expectedToolCalls: list[str] = Field(default_factory=list)
    forbiddenToolCalls: list[str] = Field(default_factory=list)
    failureType: str = ""
    hidden: bool = False


class CustomScenarioResponse(BaseModel):
    title: str
    difficulty: str
    description: str
    goal: str = ""
    availableTools: list[ScenarioTool] = Field(default_factory=list)
    workflowRules: list[str] = Field(default_factory=list)
    visibleExamples: list[ScenarioExample] = Field(default_factory=list)
    testCases: list[ScenarioTestCase] = Field(default_factory=list)
    proTips: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    hint: str = ""
