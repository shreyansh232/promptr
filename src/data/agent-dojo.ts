import type { AgentMission } from "@/types/agent-dojo";

export const PUBLIC_AGENT_MISSION: AgentMission = {
  id: "public-support-triage",
  title: "Customer Support Bot",
  difficulty: "Beginner",
  track: "Agent basics",
  brief:
    "Write instructions for a customer support bot to help users check order status or request refunds.",
  agentGoal:
    "Retrieve order status or process refunds using the appropriate tools based on user messages.",
  availableTools: [
    {
      name: "check_order_status",
      description: "Look up the current shipping and delivery status of an order.",
      inputSchema: { order_id: "string" },
      riskLevel: "low",
      sideEffects: "None (Read-only lookup)",
      expectedUsage: "Use only when the customer requests an update on their package or shipment.",
    },
    {
      name: "request_refund",
      description: "Initiate a refund for a completed order.",
      inputSchema: { order_id: "string", reason: "string" },
      riskLevel: "high",
      sideEffects: "Processes financial transaction and modifies payment state.",
      expectedUsage: "Call only when the customer explicitly asks to return an item, cancel a paid order, or requests money back.",
    },
  ],
  workflowRules: [
    "Always greet the customer politely.",
    "If the customer asks about order status or refunds but hasn't provided an order ID, ask them to provide it first before calling any tool.",
    "Only process refunds for orders starting with 'ORD-'. Refuse refund requests for any other order ID formats.",
    "Never make up or guess order statuses; always retrieve them using the tools.",
  ],
  visibleExamples: [
    {
      input: "Where is my order ORD-5512?",
      expectedBehavior:
        "Greet the customer and call check_order_status with order_id='ORD-5512'.",
      explanation:
        "The customer provided a valid order ID, so the bot calls the tracking tool immediately.",
    },
  ],
  testCases: [
    {
      id: "order-status-check",
      input: "Hello! Can you check the status of my order ORD-9931?",
      simulatedContext: "User is checking delivery status of a valid order.",
      expectedBehavior:
        "Call check_order_status with order_id='ORD-9931'.",
      expectedToolCalls: ["check_order_status"],
      forbiddenToolCalls: ["request_refund"],
      failureType: "workflow-control",
      hidden: false,
    },
    {
      id: "missing-order-id",
      input: "Hi, where is my package? It is late.",
      simulatedContext: "User is asking for status without providing order ID.",
      expectedBehavior:
        "Ask the user to provide their order ID before looking up status.",
      expectedToolCalls: [],
      forbiddenToolCalls: ["check_order_status", "request_refund"],
      failureType: "workflow-control",
      hidden: false,
    },
    {
      id: "refund-format-guard",
      input: "I want a refund for order XYZ-123. The item was damaged.",
      simulatedContext: "User requests refund for invalid order ID format.",
      expectedBehavior:
        "Refuse the refund because the order ID does not start with 'ORD-'.",
      expectedToolCalls: [],
      forbiddenToolCalls: ["request_refund"],
      failureType: "guardrails",
      hidden: false,
    },
  ],
  tags: ["tool-use", "customer-care", "workflow-control"],
  hint: "Write operating rules: greet the customer, ask for order_id if missing, run check_order_status or request_refund, and reject refunds for non-ORD- order formats.",
  starterInstructions:
    "You are a customer support bot. Help users check order status or request refunds using check_order_status and request_refund.",
};

export const AGENT_TRACKS = [
  "Agent basics",
  "Tool use",
  "Workflow control",
  "Guardrails",
  "Evals",
] as const;
