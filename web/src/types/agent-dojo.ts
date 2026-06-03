export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  riskLevel: string;
  sideEffects: string;
  expectedUsage: string;
}

export interface AgentExample {
  input: string;
  expectedBehavior: string;
  explanation: string;
}

export interface AgentTestCase {
  id: string;
  input: string;
  simulatedContext: string;
  expectedBehavior: string;
  expectedToolCalls: string[];
  forbiddenToolCalls: string[];
  failureType: string;
  hidden: boolean;
}

export interface AgentMission {
  id: string;
  title: string;
  difficulty: string;
  track: string;
  brief: string;
  agentGoal: string;
  availableTools: AgentTool[];
  workflowRules: string[];
  visibleExamples: AgentExample[];
  testCases: AgentTestCase[];
  tags: string[];
  hint: string;
  starterInstructions: string;
}

export interface AgentScenarioResult {
  scenarioId: string;
  passed: boolean;
  score: number;
  reasoning: string;
  expectedBehavior: string;
  observedBehavior: string;
  toolUseFeedback: string;
  guardrailFeedback: string;
  workflowFeedback: string;
  missingElements: string[];
  strengths: string[];
  criticalFailure: boolean;
  failureType: string;
  expectedToolCalls: string[];
  observedToolCalls: string[];
}

export interface AgentEvaluation {
  overallScore: number;
  passed: boolean;
  scenariosPassed: number;
  scenariosTotal: number;
  results: AgentScenarioResult[];
  toolTrajectory: string[];
  missingGuardrails: string[];
  improvedInstructions: string;
  workflowFeedback: string;
  creditsRemaining?: number;
}

export interface AgentProfile {
  id?: string;
  level: string;
  expertise: string;
  application: string;
  goals: string[];
  learningStyle: string;
  subLevel: number;
  reliabilityScore: number;
  missionsCompleted: number;
  streak: number;
  builderRole: string;
  frameworks: string[];
  workflowFocus: string;
  riskFocus: string;
}
