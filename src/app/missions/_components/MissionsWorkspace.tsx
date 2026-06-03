"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import type {
  AgentEvaluation,
  AgentMission,
  AgentProfile,
} from "@/types/agent-dojo";
import { EvaluationReport } from "./EvaluationReport";
import { MissionEditor } from "./MissionEditor";
import { ProgressRail } from "./ProgressRail";

import { UserMenu } from "@/components/UserMenu";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type EditorTab = "instructions" | "tools" | "scenarios";

interface MissionsWorkspaceProps {
  initialMission: AgentMission;
  initialProfile: AgentProfile | null;
  isAuthenticated: boolean;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  isLabMode?: boolean;
}

function CircularProgress({ completed, total }: { completed: number; total: number }) {
  const percentage = Math.min(Math.max((completed / total) * 100, 0), 100);
  const radius = 10;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-2" title={`${completed} of ${total} missions completed`}>
      <div className="relative flex items-center justify-center h-6 w-6">
        <svg className="h-full w-full -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="12"
            cy="12"
            r={radius}
            className="stroke-white/10"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground circle */}
          <circle
            cx="12"
            cy="12"
            r={radius}
            className="stroke-[#b7ff5a] transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute font-mono text-[8px] font-bold text-[#f7f2e8]">
          {completed}
        </span>
      </div>
      <span className="hidden font-mono text-[9px] uppercase tracking-wider text-[#abb4a4] sm:inline">
        {completed}/{total}
      </span>
    </div>
  );
}

export function MissionsWorkspace({
  initialMission,
  initialProfile,
  isAuthenticated,
  user,
  isLabMode = false,
}: MissionsWorkspaceProps) {
  const [mission, setMission] = useState(initialMission);
  const [profile, setProfile] = useState(initialProfile);
  const [instructions, setInstructions] = useState(
    initialMission.starterInstructions,
  );
  const [activeTab, setActiveTab] = useState<EditorTab>("instructions");
  const [evaluation, setEvaluation] = useState<AgentEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const completedCount = profile?.missionsCompleted ?? 0;

  const handleSelectMission = (selectedMission: AgentMission) => {
    setMission(selectedMission);
    setInstructions(selectedMission.starterInstructions);
    setEvaluation(null);
  };

  const runEvaluation = async () => {
    if (instructions.trim().length < 10) {
      toast.error("Write agent instructions before running scenarios.");
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await fetch("/api/agent-instructions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions, mission }),
      });

      const data = (await response.json()) as AgentEvaluation & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to evaluate instructions");
      }

      setEvaluation(data);

      if (isAuthenticated && data.passed) {
        const progressResponse = await fetch("/api/user/agent-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            missionId: mission.id,
            missionTitle: mission.title,
            missionJson: JSON.stringify(mission),
            userInstructions: instructions,
            reliabilityScore: data.overallScore,
            passed: data.passed,
          }),
        });

        if (progressResponse.ok) {
          const progress = (await progressResponse.json()) as {
            reliabilityScore: number;
            level: string;
            subLevel: number;
            missionsCompleted: number;
            streak: number;
          };
          setProfile((current) =>
            current
              ? {
                  ...current,
                  reliabilityScore: progress.reliabilityScore,
                  level: progress.level,
                  subLevel: progress.subLevel,
                  missionsCompleted: progress.missionsCompleted,
                  streak: progress.streak,
                }
              : current,
          );
          toast.success("Mission passed and progress saved.");
        }
      } else if (!isAuthenticated && data.passed) {
        toast.success("Mission passed. Sign in to save your run.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not evaluate instructions.",
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#10110f] text-[#f7f2e8]">
      {/* Global Top Bar */}
      <header className="z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#080908] px-4">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Chevron */}
          {!isLabMode && (
            <button
              onClick={() => setIsSidebarOpen((open) => !open)}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="flex h-8 w-8 items-center justify-center border border-white/10 bg-white/[0.02] text-[#8f978b] transition-colors hover:bg-white/5 hover:text-[#f7f2e8] focus-visible:outline-none"
            >
              {isSidebarOpen ? <CaretLeft size={16} /> : <CaretRight size={16} />}
            </button>
          )}
        </div>

        {/* Right side profile / sign in */}
        <div className="flex items-center gap-4">
          {!isLabMode && <CircularProgress completed={completedCount} total={25} />}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/sign-up"
                className="bg-[#b7ff5a] px-3.5 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.11em] text-[#10110f] transition-colors hover:bg-[#cbff82]"
              >
                Save progress
              </Link>
            </div>
          ) : (
            <UserMenu name={user?.name} image={user?.image} />
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
        {/* Sidebar */}
        {!isLabMode && (
          <div
            className={`shrink-0 overflow-hidden transition-all duration-300 ${
              isSidebarOpen ? "w-[260px] border-r border-white/10" : "w-0"
            }`}
          >
            <div className="h-full w-[260px]">
              <ProgressRail
                activeMission={mission}
                profile={profile}
                isAuthenticated={isAuthenticated}
                onSelectMission={handleSelectMission}
              />
            </div>
          </div>
        )}

        {/* Middle Editor */}
        <div className="relative h-full min-h-0 min-w-0 flex-1">
          <MissionEditor
            mission={mission}
            instructions={instructions}
            activeTab={activeTab}
            isEvaluating={isEvaluating}
            onInstructionsChange={setInstructions}
            onTabChange={setActiveTab}
            onRun={runEvaluation}
          />
        </div>

        {/* Right Report */}
        <div className="h-full min-h-0 w-[360px] shrink-0">
          <EvaluationReport
            evaluation={evaluation}
            isEvaluating={isEvaluating}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </div>
  );
}
