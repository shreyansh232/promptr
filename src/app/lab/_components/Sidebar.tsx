"use client";

import Link from "next/link";
import { CaretLeft, CaretRight, Lock, Target } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

export interface CustomScenario {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  goal: string;
  agentDescription: string;
  tools: string;
  examples: string; // JSON string
  testCases: string; // JSON string
  proTips: string[];
  tags: string[];
  hint: string;
  createdAt: Date | string;
}

interface MainSidebarProps {
  userLevel?: string | null;
  subLevel?: number;
  activeProblemTitle?: string;
  solvedProblems?: {
    userLevel: string;
    subLevel: number;
    problemTitle: string;
  }[];
  isExpanded: boolean;
  onToggle: () => void;
  // Custom Scenario additions:
  customScenarios?: CustomScenario[];
  activeCustomScenarioId?: string | null;
  onSelectCustomScenario?: (scenario: CustomScenario) => void;
  onOpenNewScenarioModal?: () => void;
  onDeleteCustomScenario?: (id: string, e: React.MouseEvent) => void;
}

const levels = [
  {
    id: "beginner",
    label: "Beginner",
  },
  {
    id: "intermediate",
    label: "Intermediate",
  },
  {
    id: "expert",
    label: "Expert",
  },
];

const levelOrder = ["beginner", "intermediate", "expert"];

function getLevelIndex(level: string): number {
  const normalized = level === "advanced" ? "expert" : level;
  return levelOrder.indexOf(normalized ?? "beginner");
}

export default function MainSidebar({
  userLevel,
  subLevel: _subLevel = 1,
  activeProblemTitle: _activeProblemTitle,
  solvedProblems: _solvedProblems = [],
  isExpanded,
  onToggle,
  customScenarios = [],
  activeCustomScenarioId = null,
  onSelectCustomScenario,
  onOpenNewScenarioModal,
  onDeleteCustomScenario,
}: MainSidebarProps) {
  const pathname = usePathname();
  const currentIndex = getLevelIndex(userLevel ?? "beginner");
  const showPracticeButton = pathname !== "/missions";

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] flex-col border-r border-border bg-[#070707] transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isExpanded
            ? "translate-x-0"
            : "-translate-x-full lg:w-[68px] lg:translate-x-0"
        }`}
      >
        {/* Header — plain wordmark + toggle */}
        <div className="flex min-h-[64px] items-center justify-between px-4 py-4">
          {isExpanded && (
            <Link
              href="/"
              className="text-[14px] font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
            >
              Promptr
            </Link>
          )}
          <button
            onClick={onToggle}
            aria-label="Toggle sidebar"
            className={`rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${!isExpanded ? "mx-auto" : ""}`}
          >
            {isExpanded ? (
              <CaretLeft size={16} weight="bold" />
            ) : (
              <CaretRight size={16} weight="bold" />
            )}
          </button>
        </div>

        {/* Progression — LeetCode-style flat list */}
        {isExpanded && (
          <div className="px-2 py-5">
            <ol>
              {levels.map((level, index) => {
                const isActive = index === currentIndex;
                const isLocked = index > currentIndex;

                return (
                  <li
                    key={level.id}
                    className={`group relative flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150 ${
                      isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Active indicator: 2px left bar */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-[#ff8a3d]"
                      />
                    )}

                    {/* Numbered index — mono, tabular */}
                    <span
                      className={`w-5 font-mono text-[10px] tabular-nums tracking-wide ${
                        isActive
                          ? "font-bold text-foreground"
                          : isLocked
                            ? "text-muted-foreground/25"
                            : "text-muted-foreground/50"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Level label */}
                    <span
                      className={`flex-1 text-[12.5px] ${
                        isActive
                          ? "font-semibold text-foreground"
                          : isLocked
                            ? "text-muted-foreground/35"
                            : "text-muted-foreground/80"
                      }`}
                    >
                      {level.label}
                    </span>

                    {/* Status indicator: orange dot (current) | nothing (unlocked) | lock (locked) */}
                    {isActive ? (
                      <span
                        aria-label="Current level"
                        className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]"
                      />
                    ) : isLocked ? (
                      <Lock
                        size={10}
                        weight="regular"
                        className="text-muted-foreground/30"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Custom Scenarios List */}
        {isExpanded && (
          <div className="no-scrollbar flex-1 overflow-y-auto border-t border-border px-2 py-5">
            <div className="mb-3 flex items-center justify-between px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60">
              <span>Prompt Tests</span>
            </div>

            {onOpenNewScenarioModal && (
              <button
                onClick={onOpenNewScenarioModal}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-none border border-dashed border-[#48d8a4]/30 bg-[#48d8a4]/5 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.08em] text-[#48d8a4] transition-all hover:border-[#48d8a4]/50 hover:bg-[#48d8a4]/10"
              >
                + New Prompt Test
              </button>
            )}

            {customScenarios.length > 0 ? (
              <ul className="space-y-1">
                {customScenarios.map((scenario) => {
                  const isActive = activeCustomScenarioId === scenario.id;
                  return (
                    <li key={scenario.id} className="group relative">
                      <div
                        className={`flex w-full items-center justify-between rounded-none px-3 py-2 transition-colors duration-150 ${
                          isActive
                            ? "bg-white/[0.04] text-foreground"
                            : "text-muted-foreground hover:bg-white/[0.02] hover:text-foreground"
                        }`}
                      >
                        <button
                          onClick={() => onSelectCustomScenario?.(scenario)}
                          className="flex flex-1 items-center gap-2.5 truncate text-left focus:outline-none"
                        >
                          <svg
                            className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#48d8a4]" : "text-muted-foreground/50"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="flex-1 truncate font-mono text-[11.5px] uppercase tracking-[0.05em]">
                            {scenario.title}
                          </span>
                        </button>

                        {onDeleteCustomScenario && (
                          <button
                            onClick={(e) =>
                              onDeleteCustomScenario(scenario.id, e)
                            }
                            className="rounded p-1 text-muted-foreground/40 opacity-0 transition-all hover:text-red-400 focus:outline-none group-hover:opacity-100"
                            title="Delete prompt test"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-3 py-4 text-center font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground/30">
                No custom tests
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showPracticeButton && (
          <div
            className={`border-t border-border px-4 py-4 ${!isExpanded ? "flex flex-col items-center gap-4" : ""}`}
          >
            {isExpanded ? (
              <Link
                href="/missions"
                className="group flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Practice Mode
                </span>
              </Link>
            ) : (
              <Link
                href="/missions"
                title="Practice Mode"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:border-primary/35 hover:bg-secondary hover:text-foreground"
              >
                <Target size={16} />
              </Link>
            )}
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
