from typing import Any

from pydantic import BaseModel, Field

from schemas.user import UserType


class AgentLearnerProfile(UserType):
    builderRole: str = ""
    frameworks: list[str] = Field(default_factory=list)
    workflowFocus: str = ""
    riskFocus: str = ""


class AgentTool(BaseModel):
    name: str
    description: str
    inputSchema: dict[str, Any] = Field(default_factory=dict)
    riskLevel: str = "low"
    sideEffects: str = ""
    expectedUsage: str = ""


class AgentExample(BaseModel):
    input: str
    expectedBehavior: str
    explanation: str


class AgentTestCase(BaseModel):
    id: str
    input: str
    simulatedContext: str = ""
    expectedBehavior: str
    expectedToolCalls: list[str] = Field(default_factory=list)
    forbiddenToolCalls: list[str] = Field(default_factory=list)
    failureType: str = ""
    hidden: bool = False


class AgentMission(BaseModel):
    id: str
    title: str
    difficulty: str
    track: str
    brief: str
    agentGoal: str
    availableTools: list[AgentTool]
    workflowRules: list[str]
    visibleExamples: list[AgentExample]
    testCases: list[AgentTestCase]
    tags: list[str] = Field(default_factory=list)
    hint: str = ""
    starterInstructions: str = ""


class AgentMissionResponse(BaseModel):
    mission: AgentMission


class AgentEvaluationRequest(BaseModel):
    instructions: str
    mission: AgentMission


class AgentScenarioResult(BaseModel):
    scenarioId: str
    passed: bool
    score: int
    reasoning: str
    expectedBehavior: str = ""
    observedBehavior: str = ""
    toolUseFeedback: str = ""
    guardrailFeedback: str = ""
    workflowFeedback: str = ""
    missingElements: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    criticalFailure: bool = False
    failureType: str = ""
    expectedToolCalls: list[str] = Field(default_factory=list)
    observedToolCalls: list[str] = Field(default_factory=list)


class AgentEvaluationResponse(BaseModel):
    overallScore: int
    passed: bool
    scenariosPassed: int
    scenariosTotal: int
    results: list[AgentScenarioResult]
    toolTrajectory: list[str] = Field(default_factory=list)
    missingGuardrails: list[str] = Field(default_factory=list)
    improvedInstructions: str
    workflowFeedback: str


class CompletedAgentMissionRequest(BaseModel):
    userId: str
    userLevel: str
    subLevel: int
    missionId: str
    missionTitle: str
    missionJson: str
    userInstructions: str
    reliabilityScore: int
    passed: bool
