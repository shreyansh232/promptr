import type { AgentMission } from "@/types/agent-dojo";

export const PUBLIC_AGENT_MISSION: AgentMission = {
  id: "public-support-triage",
  title: "Support Triage Agent",
  difficulty: "Beginner",
  track: "Agent basics",
  brief:
    "Write instructions for a support agent to route customer inquiries to the correct department.",
  agentGoal:
    "Route customer messages to 'billing' or 'support' departments using the routing tool.",
  availableTools: [
    {
      name: "route_to",
      description: "Route the customer to a specific department.",
      inputSchema: { department: "string" },
      riskLevel: "low",
      sideEffects: "Routes user query internally.",
      expectedUsage: "Use only 'billing' or 'support' as the department.",
    },
  ],
  workflowRules: [
    "Always greet the customer politely.",
    "Route queries about billing, payment, or money to the 'billing' department.",
    "Route queries about bugs, errors, or technical help to the 'support' department.",
    "Never route to any other department name (like marketing or sales).",
  ],
  visibleExamples: [
    {
      input: "My credit card was charged twice.",
      expectedBehavior:
        "Greet the user and call route_to with department='billing'.",
      explanation:
        "The agent recognizes the charge inquiry as billing-related and uses the tool.",
    },
  ],
  testCases: [
    {
      id: "billing-route",
      input: "Hello, I need help with my payment invoice.",
      simulatedContext: "User needs billing assistance.",
      expectedBehavior:
        "Call route_to with department='billing'.",
      expectedToolCalls: ["route_to"],
      forbiddenToolCalls: [],
      failureType: "workflow-control",
      hidden: false,
    },
    {
      id: "technical-route",
      input: "Hi, the app is crash-looping with a status 500 error.",
      simulatedContext: "User encounters a bug.",
      expectedBehavior:
        "Call route_to with department='support'.",
      expectedToolCalls: ["route_to"],
      forbiddenToolCalls: [],
      failureType: "workflow-control",
      hidden: false,
    },
    {
      id: "invalid-department-refusal",
      input: "Please transfer my chat to the marketing team.",
      simulatedContext: "User requests invalid routing.",
      expectedBehavior:
        "Refuse to route and explain that only billing and support departments are available.",
      expectedToolCalls: [],
      forbiddenToolCalls: ["route_to"],
      failureType: "guardrails",
      hidden: false,
    },
  ],
  tags: ["tool-use", "routing", "workflow-control"],
  hint: "Write operating rules: greet the user, identify if the topic is billing or support, call the route_to tool with the correct department name, and refuse other departments.",
  starterInstructions:
    "You are a routing agent. Greet the customer and use the route_to tool to send them to 'billing' or 'support'.",
};

export const AGENT_TRACKS = [
  "Agent basics",
  "Tool use",
  "Workflow control",
  "Guardrails",
  "Evals",
] as const;
