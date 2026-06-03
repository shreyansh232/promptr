"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type {
  AgentEvaluation,
  AgentMission,
  AgentProfile,
  AgentTool,
  AgentExample,
  AgentTestCase,
} from "@/types/agent-dojo";
import { EvaluationReport } from "./EvaluationReport";
import { MissionEditor } from "./MissionEditor";
import { ProgressRail } from "./ProgressRail";

import { UserMenu } from "@/components/UserMenu";
import Link from "next/link";
import { CaretLeft, CaretRight, Fire } from "@phosphor-icons/react";
import { NewScenarioModal } from "@/components/NewScenarioModal";
import type { CustomScenario } from "@/app/lab/_components/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

function CircularProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = Math.min(Math.max((completed / total) * 100, 0), 100);
  const radius = 10;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex items-center gap-2"
      title={`${completed} of ${total} missions completed`}
    >
      <div className="relative flex h-6 w-6 items-center justify-center">
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
            className="stroke-[#48d8a4] transition-all duration-500 ease-out"
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
      <span className="hidden font-mono text-[10px] text-[#abb4a4] sm:inline">
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

  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([]);
  const [activeCustomScenarioId, setActiveCustomScenarioId] = useState<
    string | null
  >(null);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [isGeneratingCustomScenario, setIsGeneratingCustomScenario] =
    useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const completedCount = profile?.missionsCompleted ?? 0;

  // Load custom scenarios on mount if in lab mode
  useEffect(() => {
    if (!isLabMode) return;
    const fetchCustomScenarios = async () => {
      try {
        const response = await fetch("/api/custom-scenarios");
        if (response.ok) {
          const data = (await response.json()) as {
            customScenarios?: CustomScenario[];
          };
          setCustomScenarios(data.customScenarios ?? []);
        }
      } catch (error) {
        console.error("Error fetching custom scenarios:", error);
      }
    };
    void fetchCustomScenarios();
  }, [isLabMode]);

  // Set default sidebar open on desktop
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Map CustomScenario from DB into AgentMission structure for the workspace
  const mapScenarioToMission = (scenario: CustomScenario): AgentMission => {
    let availableTools: AgentTool[] = [];
    if (scenario.tools) {
      try {
        const parsedTools = JSON.parse(scenario.tools) as Record<
          string,
          unknown
        >[];
        if (Array.isArray(parsedTools)) {
          availableTools = parsedTools.map((t) => ({
            name: typeof t.name === "string" ? t.name : "",
            description: typeof t.description === "string" ? t.description : "",
            inputSchema: (t.inputSchema as Record<string, unknown>) ?? {},
            riskLevel: typeof t.riskLevel === "string" ? t.riskLevel : "low",
            sideEffects: typeof t.sideEffects === "string" ? t.sideEffects : "",
            expectedUsage:
              typeof t.expectedUsage === "string" ? t.expectedUsage : "",
          }));
        }
      } catch {
        // If not valid JSON, treat tools as a raw string
        availableTools = [
          {
            name: "custom_tool",
            description: scenario.tools,
            inputSchema: {},
            riskLevel: "low",
            sideEffects: "None",
            expectedUsage: "Use this custom tool as appropriate.",
          },
        ];
      }
    }

    let visibleExamples: AgentExample[] = [];
    try {
      const parsed = JSON.parse(scenario.examples) as Record<string, unknown>[];
      if (Array.isArray(parsed)) {
        visibleExamples = parsed.map((ex) => ({
          input: typeof ex.input === "string" ? ex.input : "",
          expectedBehavior:
            typeof ex.expectedBehavior === "string"
              ? ex.expectedBehavior
              : typeof ex.output === "string"
                ? ex.output
                : "",
          explanation: typeof ex.explanation === "string" ? ex.explanation : "",
        }));
      }
    } catch (e) {
      console.error("Error parsing examples:", e);
    }

    let testCases: AgentTestCase[] = [];
    try {
      const parsed = JSON.parse(scenario.testCases) as Record<
        string,
        unknown
      >[];
      if (Array.isArray(parsed)) {
        testCases = parsed.map((tc, index) => ({
          id: typeof tc.id === "string" ? tc.id : `tc-${index + 1}`,
          input: typeof tc.input === "string" ? tc.input : "",
          simulatedContext:
            typeof tc.simulatedContext === "string"
              ? tc.simulatedContext
              : typeof tc.description === "string"
                ? tc.description
                : "",
          expectedBehavior:
            typeof tc.expectedBehavior === "string"
              ? tc.expectedBehavior
              : typeof tc.expectedOutput === "string"
                ? tc.expectedOutput
                : "",
          expectedToolCalls: Array.isArray(tc.expectedToolCalls)
            ? (tc.expectedToolCalls as string[])
            : [],
          forbiddenToolCalls: Array.isArray(tc.forbiddenToolCalls)
            ? (tc.forbiddenToolCalls as string[])
            : [],
          failureType:
            typeof tc.failureType === "string"
              ? tc.failureType
              : "workflow-control",
          hidden: typeof tc.hidden === "boolean" ? tc.hidden : false,
        }));
      }
    } catch (e) {
      console.error("Error parsing test cases:", e);
    }

    // Extract workflow rules from description
    const lines = scenario.description.split("\n");
    const workflowRules: string[] = [];
    let inRulesSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.toLowerCase().includes("rules") ||
        trimmed.toLowerCase().includes("constraints")
      ) {
        inRulesSection = true;
        continue;
      }
      const isListItem = /^(?:\d+\.|\*|-)\s+(.*)/.exec(trimmed);
      if (isListItem?.[1]) {
        workflowRules.push(isListItem[1].trim());
      } else if (inRulesSection && trimmed.length > 5) {
        workflowRules.push(trimmed);
      }
    }
    if (workflowRules.length === 0) {
      workflowRules.push(
        "Follow all operational constraints detailed in the description.",
      );
    }

    return {
      id: scenario.id,
      title: scenario.title,
      difficulty: scenario.difficulty || "Intermediate",
      track: "Custom",
      brief: scenario.description,
      agentGoal: scenario.goal,
      availableTools,
      workflowRules,
      visibleExamples,
      testCases,
      tags: scenario.tags || [],
      hint: scenario.hint || "",
      starterInstructions: scenario.agentDescription || "",
    };
  };

  const handleSelectCustomScenario = (scenario: CustomScenario) => {
    setEvaluation(null);
    setActiveCustomScenarioId(scenario.id);
    const mappedMission = mapScenarioToMission(scenario);
    setMission(mappedMission);
    setInstructions(mappedMission.starterInstructions);
  };

  const handleCreateCustomScenario = async (
    agentDescription: string,
    tools: string,
  ) => {
    setIsGeneratingCustomScenario(true);
    try {
      const response = await fetch("/api/custom-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentDescription, tools }),
      });

      if (!response.ok) {
        const errData = (await response.json()) as { error?: string };
        toast.error(errData.error ?? "Failed to create custom prompt test.");
        return;
      }

      const data = (await response.json()) as {
        customScenario: CustomScenario;
      };
      const scenario = data.customScenario;
      setCustomScenarios((prev) => [scenario, ...prev]);
      setIsNewScenarioModalOpen(false);
      handleSelectCustomScenario(scenario);
      toast.success("Custom prompt test generated and loaded!");
    } catch (error) {
      console.error("Error creating custom scenario:", error);
      toast.error("An error occurred during generation.");
    } finally {
      setIsGeneratingCustomScenario(false);
    }
  };

  const handleDeleteCustomScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const confirmDeleteCustomScenario = async () => {
    if (!deleteTargetId) return;
    try {
      const response = await fetch(
        `/api/custom-scenarios?id=${deleteTargetId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setCustomScenarios((prev) =>
          prev.filter((s) => s.id !== deleteTargetId),
        );
        if (activeCustomScenarioId === deleteTargetId) {
          setActiveCustomScenarioId(null);
          setMission(initialMission);
          setInstructions(initialMission.starterInstructions);
          setEvaluation(null);
        }
        toast.success("Prompt test deleted successfully.");
      } else {
        toast.error("Failed to delete custom prompt test.");
      }
    } catch (error) {
      console.error("Error deleting custom scenario:", error);
      toast.error("An error occurred.");
    } finally {
      setDeleteTargetId(null);
    }
  };

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#10110f] text-[#f7f2e8]">
      {/* Sidebar (Full Height) */}
      <aside
        className={`z-40 flex h-full flex-col border-r border-white/10 bg-[#080908] transition-all duration-300 ${
          isSidebarOpen ? "w-[260px]" : "w-[60px]"
        }`}
      >
        {/* Sidebar Header with Toggle Chevron */}
        <div
          className={`flex h-14 shrink-0 items-center px-4 ${isSidebarOpen ? "justify-between" : "justify-center"}`}
        >
          {isSidebarOpen && (
            <span className="font-mono text-xs font-semibold text-[#abb4a4]">
              {isLabMode ? "Lab" : "Missions"}
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen((open) => !open)}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="flex h-8 w-8 items-center justify-center bg-transparent text-[#8f978b] transition-colors hover:text-[#f7f2e8] focus-visible:outline-none"
          >
            {isSidebarOpen ? <CaretLeft size={16} /> : <CaretRight size={16} />}
          </button>
        </div>

        {/* Sidebar Content (Only show if open) */}
        {isSidebarOpen ? (
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            {isLabMode ? (
              <div className="flex h-full flex-col px-3 py-4">
                <button
                  onClick={() => setIsNewScenarioModalOpen(true)}
                  className="mb-4 flex w-full shrink-0 items-center justify-center gap-2 bg-[#48d8a4] px-3 py-2.5 font-mono text-sm font-bold text-[#10110f] transition-colors hover:bg-[#62e2b7]"
                >
                  + New prompt test
                </button>

                {customScenarios.length > 0 ? (
                  <ul className="no-scrollbar flex-1 space-y-1 overflow-y-auto">
                    {customScenarios.map((scenario) => {
                      const isActive = activeCustomScenarioId === scenario.id;
                      return (
                        <li key={scenario.id} className="group relative">
                          <div
                            className={`flex w-full items-center justify-between rounded-[4px] px-3 py-2 transition-all ${
                              isActive
                                ? "bg-[#48d8a4]/10 text-[#6be0b9]"
                                : "text-[#abb4a4] hover:bg-white/[0.02] hover:text-[#f7f2e8]"
                            }`}
                          >
                            <button
                              onClick={() =>
                                handleSelectCustomScenario(scenario)
                              }
                              className="flex flex-1 items-center truncate py-1 text-left focus:outline-none"
                            >
                              <span
                                className={`flex-1 truncate text-[12.5px] font-medium tracking-normal ${
                                  isActive
                                    ? "text-[#f7f2e8]"
                                    : "text-[#abb4a4] group-hover:text-[#f7f2e8]"
                                }`}
                              >
                                {scenario.title}
                              </span>
                            </button>

                            <button
                              onClick={(e) =>
                                handleDeleteCustomScenario(scenario.id, e)
                              }
                              className="ml-1 shrink-0 rounded p-1 text-[#abb4a4]/40 opacity-0 transition-all hover:text-red-400 focus:outline-none group-hover:opacity-100"
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
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-3 py-8 text-center font-mono text-[10px] text-[#71786d]">
                    No custom tests
                  </div>
                )}
              </div>
            ) : (
              <ProgressRail
                activeMission={mission}
                profile={profile}
                isAuthenticated={isAuthenticated}
                onSelectMission={handleSelectMission}
              />
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </aside>

      {/* Content Area (Header + Main Editor + Report) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#10110f]">
        {/* Global Top Bar */}
        <header className="z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#080908] px-4">
          <div className="flex items-center gap-3"></div>

          {/* Right side profile / sign in */}
          <div className="flex items-center gap-4">
            {!isLabMode && (
              <div className="flex items-center gap-3">
                <CircularProgress completed={completedCount} total={25} />
                {isAuthenticated && (
                  <div
                    className="flex items-center gap-1 text-orange-500"
                    title={`${profile?.streak ?? 0} day streak`}
                  >
                    <Fire size={18} weight="fill" />
                    <span className="font-mono text-[10px] font-bold text-[#f7f2e8]">
                      {profile?.streak ?? 0}
                    </span>
                  </div>
                )}
              </div>
            )}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/sign-up"
                  className="bg-[#48d8a4] px-4 py-2 font-mono text-xs font-bold text-[#10110f] transition-colors hover:bg-[#62e2b7]"
                >
                  Save progress
                </Link>
              </div>
            ) : (
              <UserMenu name={user?.name} image={user?.image} />
            )}
          </div>
        </header>

        {/* Workspace Layout */}
        <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
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
          <div className="h-full min-h-0 w-[360px] shrink-0 border-l border-white/10">
            <EvaluationReport
              mission={mission}
              evaluation={evaluation}
              isEvaluating={isEvaluating}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </div>

      {/* New Scenario Modal */}
      <NewScenarioModal
        isOpen={isNewScenarioModalOpen}
        onClose={() => setIsNewScenarioModalOpen(false)}
        onSubmit={handleCreateCustomScenario}
        isLoading={isGeneratingCustomScenario}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <DialogContent className="max-w-[400px] rounded-none border border-white/10 bg-[#111111] p-6 font-mono text-xs text-[#f5efe6] shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:rounded-none">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-mono text-sm font-semibold text-[#f5efe6]">
              Delete Prompt Test
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-[#a0978a]">
              Are you sure you want to delete this prompt test? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTargetId(null)}
              className="rounded-none border border-[#ff3b30] bg-[#ff3b30]/10 font-mono text-xs text-[#ff8b8b] hover:bg-[#ff3b30]/20"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteCustomScenario}
              className="rounded-none border border-transparent bg-[#ff3b30] font-mono text-xs text-[#f5efe6] hover:bg-[#d63025]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
