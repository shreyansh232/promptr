"use client";

import { CheckCircle, Gauge, LockKey, Play } from "@phosphor-icons/react";
import { CURRICULUM_MISSIONS } from "@/data/missions";
import type { AgentMission, AgentProfile } from "@/types/agent-dojo";

interface ProgressRailProps {
  activeMission: AgentMission;
  profile: AgentProfile | null;
  isAuthenticated: boolean;
  onSelectMission: (mission: AgentMission) => void;
}

const tracks = ["Agent basics", "Tool use", "Workflow control", "Guardrails", "Evals"];

export function ProgressRail({
  activeMission,
  profile,
  isAuthenticated,
  onSelectMission,
}: ProgressRailProps) {
  const completedCount = profile?.missionsCompleted ?? 0;

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#080908]">
      {/* Top Metrics */}
      <div className="grid grid-cols-3 border-b border-white/10 text-center shrink-0">
        <Metric
          label="Reliability"
          value={profile ? `${profile.reliabilityScore}` : "--"}
        />
        <Metric label="Completed" value={`${completedCount}/25`} />
        <Metric label="Streak" value={`${profile?.streak ?? 0}`} />
      </div>

      {/* Grouped Missions List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-6 select-none no-scrollbar">
        {tracks.map((track, trackIdx) => {
          const trackMissions = CURRICULUM_MISSIONS.filter(
            (m) => m.track.toLowerCase() === track.toLowerCase()
          );

          return (
            <div key={track} className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f978b] px-1">
                Level {trackIdx + 1}: {track}
              </div>
              <ul className="space-y-1.5">
                {trackMissions.map((item) => {
                  const overallIdx = CURRICULUM_MISSIONS.findIndex(
                    (m) => m.id === item.id
                  );
                  const isCompleted = isAuthenticated && overallIdx < completedCount;
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
                        className={`w-full text-left border px-3 py-2.5 transition-colors flex items-center justify-between ${
                          isActive
                            ? "border-[#b7ff5a]/60 bg-[#b7ff5a]/10 text-[#f7f2e8]"
                            : isUnlocked
                            ? "border-white/5 bg-white/[0.01] text-[#abb4a4] hover:bg-white/[0.04] hover:text-[#f7f2e8]"
                            : "cursor-not-allowed border-white/5 bg-black/40 text-[#555d52]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[9px] text-[#71786d] uppercase">
                            Mission {trackIdx + 1}.{(overallIdx % 5) + 1}
                          </div>
                          <div className="text-xs font-semibold truncate mt-0.5">
                            {item.title}
                          </div>
                        </div>

                        <div className="ml-2 shrink-0">
                          {isCompleted ? (
                            <CheckCircle size={14} className="text-[#b7ff5a]" weight="fill" />
                          ) : isUnlocked ? (
                            isActive ? (
                              <Play size={10} className="text-[#b7ff5a]" weight="fill" />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-[#b7ff5a]/40" />
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 px-2 py-4 last:border-r-0">
      <div className="flex justify-center text-[#b7ff5a]">
        <Gauge size={14} />
      </div>
      <div className="mt-1 font-mono text-lg text-[#f7f2e8]">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.13em] text-[#71786d]">
        {label}
      </div>
    </div>
  );
}
