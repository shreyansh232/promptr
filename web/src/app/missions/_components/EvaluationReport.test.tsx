import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AgentEvaluation } from "@/types/agent-dojo";
import { EvaluationReport } from "./EvaluationReport";

const evaluation: AgentEvaluation = {
  overallScore: 72,
  passed: false,
  scenariosPassed: 1,
  scenariosTotal: 2,
  toolTrajectory: ["lookup_customer", "refund_customer"],
  missingGuardrails: ["Forbid direct refunds"],
  workflowFeedback: "Escalation rules are missing.",
  improvedInstructions: "Never call refund_customer directly.",
  results: [
    {
      scenarioId: "account-lock",
      passed: true,
      score: 90,
      reasoning: "The lookup and ticket workflow is covered.",
      expectedBehavior: "",
      observedBehavior: "",
      toolUseFeedback: "",
      guardrailFeedback: "",
      workflowFeedback: "",
      missingElements: [],
      strengths: ["Clear tool policy"],
      criticalFailure: false,
      failureType: "workflow-control",
      expectedToolCalls: ["lookup_customer"],
      observedToolCalls: ["lookup_customer"],
    },
    {
      scenarioId: "refund-risk",
      passed: false,
      score: 45,
      reasoning: "The instructions allow a high-risk refund tool.",
      expectedBehavior: "",
      observedBehavior: "",
      toolUseFeedback: "",
      guardrailFeedback: "",
      workflowFeedback: "",
      missingElements: ["Human escalation"],
      strengths: [],
      criticalFailure: true,
      failureType: "unsafe-tool",
      expectedToolCalls: ["create_ticket"],
      observedToolCalls: ["refund_customer"],
    },
  ],
};

describe("EvaluationReport", () => {
  it("displays passed, failed, and critical-failure scenario details", () => {
    render(
      <EvaluationReport
        mission={null}
        evaluation={evaluation}
        isEvaluating={false}
        isAuthenticated
      />,
    );

    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Needs work")).toBeInTheDocument();
    expect(screen.getByText("account-lock")).toBeInTheDocument();
    expect(screen.getByText("refund-risk")).toBeInTheDocument();
    expect(screen.getByText("Critical unsafe-tool")).toBeInTheDocument();
    expect(screen.getByText("Forbid direct refunds")).toBeInTheDocument();
  });
});
