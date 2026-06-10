"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Copy, Warning, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { AgentEvaluation, AgentMission } from "@/types/agent-dojo";

interface EvaluationReportProps {
  mission: AgentMission | null;
  evaluation: AgentEvaluation | null;
  isEvaluating: boolean;
  isAuthenticated: boolean;
}

function getScoreColorClass(score: number): string {
  if (score < 40) return "text-[#ff7777]";
  if (score < 70) return "text-[#ffc83d]";
  return "text-[#48d8a4]";
}

export function EvaluationReport({
  mission,
  evaluation,
  isEvaluating,
  isAuthenticated,
}: EvaluationReportProps) {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([
    "Bootstrapping evaluation sandbox...",
  ]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isEvaluating) {
      setActiveScenarioIndex(0);
      setLogMessages(["Bootstrapping evaluation sandbox..."]);
      setElapsed(0);
      return;
    }

    const testCaseCount = mission?.testCases?.length ?? 1;

    // Cycle through active scenarios index
    const scenarioInterval = setInterval(() => {
      setActiveScenarioIndex((prev) => Math.min(prev + 1, testCaseCount - 1));
    }, 2000);

    // Dynamic terminal log messages
    const statuses = [
      "Analyzing prompt constraints...",
      "Simulating trajectory paths...",
      "Executing tool safety checks...",
      "Verifying workflow completions...",
      "Analyzing guardrail coverage...",
      "Synthesizing patch recommendations...",
    ];

    let statusIdx = 0;
    const logInterval = setInterval(() => {
      if (statusIdx < statuses.length) {
        setLogMessages((prev) => [...prev, statuses[statusIdx]]);
        statusIdx++;
      }
    }, 1200);

    const elapsedInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(scenarioInterval);
      clearInterval(logInterval);
      clearInterval(elapsedInterval);
    };
  }, [isEvaluating, mission?.testCases?.length]);

  if (isEvaluating) {
    const scenarios = mission?.testCases ?? [];
    const totalScenarios = scenarios.length || 1;
    const progressPct = Math.min(
      Math.round(((activeScenarioIndex + 1) / totalScenarios) * 100),
      99,
    );

    return (
      <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-[#080908]">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71786d]">
              Evaluating
            </span>
            <span className="font-mono text-[10px] tabular-nums text-[#71786d]">
              {elapsed}s
            </span>
          </div>
          <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-[#48d8a4] shadow-[0_0_10px_#48d8a4] transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#48d8a4]">
              Scenario {activeScenarioIndex + 1} / {totalScenarios}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-[#71786d]">
              {progressPct}%
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Scenario pipeline */}
          {scenarios.length > 0 && (
            <div>
              <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4a514a]">
                Scenarios
              </p>
              <div className="space-y-1">
                {scenarios.map((tc, idx) => {
                  const state =
                    idx < activeScenarioIndex
                      ? "done"
                      : idx === activeScenarioIndex
                        ? "active"
                        : "pending";
                  return (
                    <div
                      key={tc.id}
                      className={`flex items-center gap-3 rounded-[3px] px-3 py-2.5 transition-all duration-300 ${
                        state === "active"
                          ? "bg-[#48d8a4]/[0.07] ring-1 ring-inset ring-[#48d8a4]/20"
                          : state === "done"
                            ? "bg-white/[0.02]"
                            : "bg-transparent"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
                          state === "active"
                            ? "animate-pulse bg-[#48d8a4] shadow-[0_0_6px_#48d8a4]"
                            : state === "done"
                              ? "bg-[#48d8a4]/35"
                              : "bg-white/10"
                        }`}
                      />
                      <span
                        className={`flex-1 truncate font-mono text-[11px] transition-colors duration-300 ${
                          state === "active"
                            ? "text-[#e8ede4]"
                            : state === "done"
                              ? "text-[#4a514a] line-through decoration-[#4a514a]/50"
                              : "text-[#4a514a]"
                        }`}
                      >
                        {tc.id}
                      </span>
                      <span
                        className={`shrink-0 font-mono text-[9px] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                          state === "active"
                            ? "text-[#48d8a4]"
                            : state === "done"
                              ? "text-[#48d8a4]/40"
                              : "text-[#3a403a]"
                        }`}
                      >
                        {state === "active"
                          ? "Running"
                          : state === "done"
                            ? "Done"
                            : "Queued"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live event feed */}
          <div>
            <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4a514a]">
              Live Feed
            </p>
            <div className="space-y-2">
              {logMessages.map((msg, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5"
                  style={{
                    opacity: Math.min(
                      1,
                      0.3 + (i / Math.max(logMessages.length - 1, 1)) * 0.7,
                    ),
                  }}
                >
                  <span className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#48d8a4]/50" />
                  <span className="font-mono text-[11px] leading-[1.6] text-[#8f978b]">
                    {msg}
                    {i === logMessages.length - 1 && (
                      <span className="ml-1.5 inline-block h-[10px] w-[4px] animate-pulse rounded-[1px] bg-[#48d8a4]/70 align-middle" />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            <div className={`font-mono text-6xl leading-none ${getScoreColorClass(evaluation.overallScore)}`}>
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
                className={`border p-3 rounded-[4px] ${
                  result.passed
                    ? "border-[#48d8a4]/15 bg-[#48d8a4]/5"
                    : "border-[#ff5a5a]/15 bg-[#ff5a5a]/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-mono text-xs text-[#f7f2e8]">
                    <span>{result.scenarioId}</span>
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
            ).map((tool) => {
              const isNoTools = tool === "No tool calls predicted";
              return (
                <span
                  key={tool}
                  className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] border ${
                    isNoTools
                      ? "border-white/5 bg-white/[0.02] text-[#71786d] italic"
                      : "border-[#48d8a4]/10 bg-[#48d8a4]/5 text-[#48d8a4]"
                  }`}
                >
                  {tool}
                </span>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-mono text-[11px] text-[#8f978b]">
            Missing Guardrails
          </h2>
          <ul className="mt-3 space-y-2 text-xs">
            {evaluation.missingGuardrails.length > 0 ? (
              evaluation.missingGuardrails.map((guardrail) => (
                <li
                  key={guardrail}
                  className="flex items-start gap-2 border border-amber-500/10 bg-amber-500/5 p-2 rounded text-amber-300"
                >
                  <Warning size={14} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{guardrail}</span>
                </li>
              ))
            ) : (
              <div className="text-[#71786d] italic">No missing guardrails detected.</div>
            )}
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
