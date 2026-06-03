"use client";

import { CheckCircle, LockKey, Play } from "@phosphor-icons/react";
import { CURRICULUM_MISSIONS } from "@/data/missions";
import type { AgentMission, AgentProfile } from "@/types/agent-dojo";

interface ProgressRailProps {
  activeMission: AgentMission;
  profile: AgentProfile | null;
  isAuthenticated: boolean;
  onSelectMission: (mission: AgentMission) => void;
}

const tracks = [
  "Agent basics",
  "Tool use",
  "Workflow control",
  "Guardrails",
  "Evals",
];

export function ProgressRail({
  activeMission,
  profile,
  isAuthenticated,
  onSelectMission,
}: ProgressRailProps) {
  const completedCount = profile?.missionsCompleted ?? 0;

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#080908]">
      {/* Grouped Missions List */}
      <div className="no-scrollbar min-h-0 flex-1 select-none space-y-6 overflow-y-auto px-3 py-4">
        {tracks.map((track, trackIdx) => {
          const trackMissions = CURRICULUM_MISSIONS.filter(
            (m) => m.track.toLowerCase() === track.toLowerCase(),
          );

          return (
            <div key={track} className="space-y-2">
              <div className="flex items-center gap-2 px-1 text-xs font-semibold text-[#8f978b]">
                Level {trackIdx + 1}: {track}
              </div>
              <ul className="space-y-1.5">
                {trackMissions.map((item) => {
                  const overallIdx = CURRICULUM_MISSIONS.findIndex(
                    (m) => m.id === item.id,
                  );
                  const isCompleted =
                    isAuthenticated && overallIdx < completedCount;
                  const isUnlocked = !isAuthenticated
                    ? overallIdx === 0
                    : overallIdx <= completedCount;
                  const isActive = item.id === activeMission.id;

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          if (isUnlocked) {
                            onSelectMission(item);
                          }
                        }}
                        disabled={!isUnlocked}
                        className={`flex w-full items-center justify-between border px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? "border-[#48d8a4]/60 bg-[#48d8a4]/10 text-[#6be0b9]"
                            : isUnlocked
                              ? "border-white/5 bg-white/[0.01] text-[#abb4a4] hover:bg-white/[0.04] hover:text-[#f7f2e8]"
                              : "cursor-not-allowed border-white/5 bg-black/40 text-[#555d52]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] text-[#71786d]">
                            Mission {trackIdx + 1}.{(overallIdx % 5) + 1}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-semibold">
                            {item.title}
                          </div>
                        </div>

                        <div className="ml-2 shrink-0">
                          {isCompleted ? (
                            <CheckCircle
                              size={14}
                              className="text-[#48d8a4]"
                              weight="fill"
                            />
                          ) : isUnlocked ? (
                            isActive ? (
                              <Play
                                size={10}
                                className="text-[#48d8a4]"
                                weight="fill"
                              />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-[#48d8a4]/40" />
                            )
                          ) : (
                            <LockKey size={12} className="text-[#555d52]" />
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
