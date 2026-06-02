"use client";

import Link from "next/link";
import { CaretLeft, CaretRight, Lock, Target } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

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
}: MainSidebarProps) {
  const pathname = usePathname();
  const currentIndex = getLevelIndex(userLevel ?? "beginner");
  const showPracticeButton = pathname !== "/dashboard";

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
        <div className="flex items-center justify-between px-4 py-4 min-h-[64px]">
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
                      isActive
                        ? "bg-white/[0.04]"
                        : "hover:bg-white/[0.02]"
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

        {/* Spacer pushes nav to bottom */}
        <div className="flex-1" />

        {/* Action Buttons */}
        {showPracticeButton && (
          <div className={`px-4 py-4 border-t border-border ${!isExpanded ? "flex flex-col items-center gap-4" : ""}`}>
            {isExpanded ? (
              <Link
                href="/dashboard"
                className="group flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs font-mono text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Practice Mode
                </span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
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
