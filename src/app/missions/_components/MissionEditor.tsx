"use client";

import {
  BracketsCurly,
  CircleNotch,
  Flask,
  Play,
  ShieldWarning,
  TerminalWindow,
  Wrench,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AgentMission } from "@/types/agent-dojo";

type EditorTab = "instructions" | "tools" | "scenarios";

interface MissionEditorProps {
  mission: AgentMission;
  instructions: string;
  activeTab: EditorTab;
  isEvaluating: boolean;
  onInstructionsChange: (value: string) => void;
  onTabChange: (tab: EditorTab) => void;
  onRun: () => void;
}

export function MissionEditor({
  mission,
  instructions,
  activeTab,
  isEvaluating,
  onInstructionsChange,
  onTabChange,
  onRun,
}: MissionEditorProps) {
  return (
    <main className="flex h-full min-h-0 flex-col bg-[#10110f]">
      <section className="shrink-0 border-b border-white/10 px-5 py-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-[#abb4a4]">
              {mission.track} / {mission.difficulty}
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-[#f7f2e8]">
              {mission.title}
            </h1>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#abb4a4] lg:line-clamp-none">
              {mission.brief}
            </p>
          </div>
          <Button
            onClick={onRun}
            disabled={isEvaluating || instructions.trim().length < 10}
            className="h-11 rounded-none bg-[#48d8a4] px-6 font-mono text-sm font-bold text-[#10110f] hover:bg-[#62e2b7] disabled:opacity-40"
          >
            {isEvaluating ? (
              <span className="flex items-center gap-2">
                <CircleNotch size={16} className="animate-spin" />
                Running...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play size={14} weight="fill" />
                Run Test
              </span>
            )}
          </Button>
        </div>
      </section>

      <div className="flex border-b border-white/10">
        <TabButton
          icon={<TerminalWindow size={16} />}
          label="Instructions"
          active={activeTab === "instructions"}
          onClick={() => onTabChange("instructions")}
        />
        <TabButton
          icon={<Wrench size={16} />}
          label="Tools"
          active={activeTab === "tools"}
          onClick={() => onTabChange("tools")}
        />
        <TabButton
          icon={<Flask size={16} />}
          label="Scenarios"
          active={activeTab === "scenarios"}
          onClick={() => onTabChange("scenarios")}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {activeTab === "instructions" && (
          <div className="grid min-h-full grid-rows-[auto_1fr] gap-4">
            <div className="grid gap-3 border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_1fr]">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#8f978b]">
                  <BracketsCurly size={14} />
                  Agent Goal
                </div>
                <p className="text-sm leading-6 text-[#d8ddcf]">
                  {mission.agentGoal}
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#8f978b]">
                  <ShieldWarning size={14} />
                  Workflow Rules
                </div>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-[#d8ddcf]">
                  {mission.workflowRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>

            <label className="grid min-h-[380px] grid-rows-[auto_1fr] border border-white/10 bg-[#060706]">
              <div className="border-b border-white/10 px-4 py-3 font-mono text-[11px] text-[#8f978b]">
                developer_instructions.md
              </div>
              <Textarea
                value={instructions}
                onChange={(event) => onInstructionsChange(event.target.value)}
                spellCheck={false}
                className="min-h-full resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-6 text-[#f7f2e8] shadow-none outline-none placeholder:text-[#646b60] focus-visible:ring-0"
                placeholder="Write the durable instructions your agent should follow..."
              />
            </label>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="grid gap-3">
            {mission.availableTools.map((tool) => (
              <article
                key={tool.name}
                className="border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-mono text-base text-[#f7f2e8]">
                    {tool.name}
                  </h2>
                  <span
                    className={`border px-2 py-1 font-mono text-[10px] ${
                      tool.riskLevel === "high"
                        ? "border-[#ff5a5a]/50 text-[#ff9b9b]"
                        : tool.riskLevel === "medium"
                          ? "border-[#ffcc66]/50 text-[#ffdb8f]"
                          : "border-green-400/40 text-green-400"
                    }`}
                  >
                    {tool.riskLevel} risk
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#abb4a4]">
                  {tool.description}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ToolDetail
                    label="Schema"
                    value={JSON.stringify(tool.inputSchema)}
                  />
                  <ToolDetail label="Side effects" value={tool.sideEffects} />
                  <ToolDetail label="Expected use" value={tool.expectedUsage} />
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="grid gap-3">
            {mission.testCases
              .filter((scenario) => !scenario.hidden)
              .map((scenario) => (
                <article
                  key={scenario.id}
                  className="border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-mono text-sm text-[#f7f2e8]">
                      {scenario.id}
                    </h2>
                    <span className="border border-white/10 px-2 py-1 font-mono text-[10px] text-[#8f978b]">
                      {scenario.failureType}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#d8ddcf]">
                    {scenario.input}
                  </p>
                  <p className="mt-3 border-l border-[#48d8a4]/40 pl-3 text-sm leading-6 text-[#abb4a4]">
                    {scenario.expectedBehavior}
                  </p>
                </article>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 flex-1 items-center justify-center gap-2 border-r border-white/10 font-mono text-[11px] transition-colors last:border-r-0 ${
        active
          ? "bg-[#48d8a4]/10 text-[#6be0b9]"
          : "bg-[#0b0c0a] text-[#777f72] hover:bg-white/[0.03] hover:text-[#d8ddcf]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ToolDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-[#060706] p-3">
      <div className="font-mono text-[10px] text-[#71786d]">{label}</div>
      <div className="mt-2 break-words text-xs leading-5 text-[#d8ddcf]">
        {value}
      </div>
    </div>
  );
}
