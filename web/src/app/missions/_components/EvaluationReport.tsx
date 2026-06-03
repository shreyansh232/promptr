"use client";

import { CheckCircle, Copy, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { AgentEvaluation, AgentMission } from "@/types/agent-dojo";

interface EvaluationReportProps {
  mission: AgentMission | null;
  evaluation: AgentEvaluation | null;
  isEvaluating: boolean;
  isAuthenticated: boolean;
}

export function EvaluationReport({
  mission,
  evaluation,
  isEvaluating,
  isAuthenticated,
}: EvaluationReportProps) {
  if (isEvaluating) {
    return (
      <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-[#0b0c0a] p-5">
        <div className="h-2 w-full overflow-hidden bg-white/10">
          <div className="h-full w-1/2 animate-pulse bg-[#48d8a4]" />
        </div>
        <div className="mt-5 font-mono text-[11px] text-[#abb4a4]">
          Running simulated trajectories
        </div>
        <p className="mt-3 text-sm leading-6 text-[#abb4a4]">
          Promptr is checking tool choice, escalation behavior, workflow
          completion, and guardrail coverage.
        </p>
      </aside>
    );
  }

  if (!evaluation) {
    const scenarioCount = mission?.testCases?.length ?? 0;
    const toolCount = mission?.availableTools?.length ?? 0;
    const guardrailCount = mission?.workflowRules?.length ?? 0;

    return (
      <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-[#0b0c0a] p-5">
        <div className="font-mono text-[11px] text-[#8f978b]">
          Reliability Report
        </div>
        <div className="mt-6 border border-white/10 bg-black/20 p-5 font-mono">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8f978b]">Scenarios:</span>
              <span className="text-[#f7f2e8]">{scenarioCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8f978b]">Tools:</span>
              <span className="text-[#f7f2e8]">{toolCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8f978b]">Guardrails:</span>
              <span className="text-[#f7f2e8]">{guardrailCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8f978b]">Coverage:</span>
              <span className="text-[#abb4a4]">Pending</span>
            </div>
            <div className="mt-6 flex justify-between border-t border-white/10 pt-4">
              <span className="text-[#8f978b]">Status:</span>
              <span className="text-[#ff8a3d]">Not Evaluated</span>
            </div>
          </div>
        </div>
        <p className="mt-6 text-xs leading-5 text-[#71786d]">
          Run the mission scenarios to see likely tool trajectory, missing
          guardrails, and an improved instruction patch.
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-[#0b0c0a]">
      <div className="border-b border-white/10 p-5">
        <div className="font-mono text-[11px] text-[#8f978b]">
          Reliability Report
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-6xl leading-none text-[#f7f2e8]">
              {evaluation.overallScore}
            </div>
            <div className="mt-2 text-xs text-[#71786d]">Reliability score</div>
          </div>
          <StatusPill passed={evaluation.passed} />
        </div>
        {!isAuthenticated && evaluation.passed && (
          <p className="mt-4 border border-[#ff8a3d]/30 bg-[#ff8a3d]/10 p-3 text-xs leading-5 text-[#ffd2b6]">
            Sign in to save this pass and continue the mission track.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <section>
          <h2 className="font-mono text-[11px] text-[#8f978b]">
            Scenario Results
          </h2>
          <div className="mt-3 space-y-3">
            {evaluation.results.map((result) => (
              <article
                key={result.scenarioId}
                className="border border-white/10 bg-black/20 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xs text-[#f7f2e8]">
                    {result.scenarioId}
                  </div>
                  {result.passed ? (
                    <CheckCircle size={16} className="text-[#48d8a4]" />
                  ) : (
                    <XCircle size={16} className="text-[#ff7777]" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-[#abb4a4]">
                  {result.reasoning}
                </p>
                {result.criticalFailure && (
                  <div className="mt-2 border border-[#ff5a5a]/40 bg-[#ff5a5a]/10 px-2 py-1 font-mono text-[10px] text-[#ff9b9b]">
                    Critical {result.failureType}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-mono text-[11px] text-[#8f978b]">
            Tool Trajectory
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(evaluation.toolTrajectory.length
              ? evaluation.toolTrajectory
              : ["No tool calls predicted"]
            ).map((tool) => (
              <span
                key={tool}
                className="border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-[#d8ddcf]"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-mono text-[11px] text-[#8f978b]">
            Missing Guardrails
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#d8ddcf]">
            {evaluation.missingGuardrails.map((guardrail) => (
              <li key={guardrail}>{guardrail}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-mono text-[11px] text-[#8f978b]">
              Instruction Patch
            </h2>
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-none px-2 text-[#8f978b] hover:bg-white/5 hover:text-[#f7f2e8]"
              onClick={() =>
                void navigator.clipboard.writeText(
                  evaluation.improvedInstructions,
                )
              }
            >
              <Copy size={14} />
            </Button>
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap border border-white/10 bg-[#060706] p-3 font-mono text-xs leading-5 text-[#d8ddcf]">
            {evaluation.improvedInstructions}
          </pre>
        </section>
      </div>
    </aside>
  );
}

function StatusPill({ passed }: { passed: boolean }) {
  return (
    <div
      className={`border px-3 py-2 font-mono text-[10px] ${
        passed
          ? "border-[#48d8a4]/50 bg-[#48d8a4]/10 text-[#6be0b9]"
          : "border-[#ff5a5a]/50 bg-[#ff5a5a]/10 text-[#ff9b9b]"
      }`}
    >
      {passed ? "Passed" : "Needs work"}
    </div>
  );
}
