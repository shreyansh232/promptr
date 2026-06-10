"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentMission, AgentTestCase } from "@/types/agent-dojo";
import { usePathname } from "next/navigation";
import { parseBrief } from "@/lib/brief-formatter";

type EditorTab = "instructions" | "tools" | "scenarios";

interface MissionEditorProps {
  mission: AgentMission;
  instructions: string;
  activeTab: EditorTab;
  isEvaluating: boolean;
  onInstructionsChange: (value: string) => void;
  onTabChange: (tab: EditorTab) => void;
  onRun: () => void;
  isLabMode?: boolean;
  onAddCustomScenario?: (newTestCase: AgentTestCase) => void;
}

export function MissionEditor({
  mission,
  instructions,
  activeTab,
  isEvaluating,
  onInstructionsChange,
  onTabChange,
  onRun,
  isLabMode: _isLabMode = false,
  onAddCustomScenario,
}: MissionEditorProps) {
  const pathname = usePathname();

  // Add Custom Scenario States
  const [isAddScenarioOpen, setIsAddScenarioOpen] = useState(false);
  const [input, setInput] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [simulatedContext, setSimulatedContext] = useState("");
  const [failureType, setFailureType] = useState("workflow-control");
  const [expectedToolCalls, setExpectedToolCalls] = useState("");
  const [forbiddenToolCalls, setForbiddenToolCalls] = useState("");

  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !expectedBehavior.trim()) return;

    const newTestCase: AgentTestCase = {
      id: simulatedContext.trim(),
      input: input.trim(),
      simulatedContext: simulatedContext.trim(),
      expectedBehavior: expectedBehavior.trim(),
      expectedToolCalls: expectedToolCalls
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      forbiddenToolCalls: forbiddenToolCalls
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      failureType,
      hidden: false,
    };

    onAddCustomScenario?.(newTestCase);

    // Reset state
    setInput("");
    setSimulatedContext("");
    setExpectedBehavior("");
    setExpectedToolCalls("");
    setForbiddenToolCalls("");
    setFailureType("workflow-control");
    setIsAddScenarioOpen(false);
  };

  return (
    <main className="flex h-full min-h-0 flex-col bg-[#10110f]">
      <section className="shrink-0 border-b border-white/10 px-5 py-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div className="min-w-0">
            {pathname !== "/lab" && (
              <div className="font-mono text-[11px] text-[#abb4a4]">
                {mission.track} / {mission.difficulty}
              </div>
            )}
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-[#f7f2e8]">
              {mission.title}
            </h1>
            {(() => {
              const { intro, points } = parseBrief(mission.brief);
              return (
                <div className="mt-3 text-sm leading-6 text-[#abb4a4]">
                  {intro && (
                    <p className="mb-2 font-medium text-[#d8ddcf]">{intro}</p>
                  )}
                  {points.length > 0 && (
                    <ul className="list-inside list-disc space-y-1.5 pl-1 text-[#abb4a4]">
                      {points.map((pt, idx) => (
                        <li key={idx} className="leading-6">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
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
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-mono text-xs text-[#abb4a4]">
                Active Scenarios (
                {mission.testCases.filter((s) => !s.hidden).length})
              </span>
              {onAddCustomScenario && (
                <Button
                  onClick={() => setIsAddScenarioOpen(true)}
                  className="h-8 rounded-none border border-[#48d8a4]/30 bg-[#48d8a4]/5 px-3 font-mono text-[11px] text-[#48d8a4] hover:bg-[#48d8a4]/10 hover:text-[#48d8a4]"
                >
                  + Add Custom Scenario
                </Button>
              )}
            </div>

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
          </div>
        )}
      </div>

      <Dialog
        open={isAddScenarioOpen}
        onOpenChange={(open) => !open && setIsAddScenarioOpen(false)}
      >
        <DialogContent className="max-w-xl rounded-none border border-white/10 bg-[#111111] p-0 text-[#f5efe6] shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:rounded-none">
          <DialogHeader className="px-6 py-5">
            <DialogTitle className="font-mono text-xl font-semibold tracking-tight text-[#f5efe6]">
              Add Custom Scenario
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-[#a0978a]">
              Add a custom test case to stress-test your agent instructions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTestCase}>
            <div className="space-y-4 px-6 py-4 font-mono text-xs">
              <div className="space-y-1.5">
                <Label
                  htmlFor="scen-context"
                  className="text-[10px] font-semibold text-[#abb4a4]"
                >
                  Simulated Context / Setup Description
                </Label>
                <Input
                  id="scen-context"
                  value={simulatedContext}
                  onChange={(e) => setSimulatedContext(e.target.value)}
                  placeholder="e.g. User wants to check status of order ORD-9931 (which exists and is shipped)"
                  className="rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-[#48d8a4]/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="scen-input"
                    className="text-[10px] font-semibold text-[#abb4a4]"
                  >
                    User Query (Input)
                  </Label>
                  <Input
                    id="scen-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. Can you check status of ORD-9931?"
                    className="rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-[#48d8a4]/50"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-[#abb4a4]">
                    Failure Type / Category
                  </Label>
                  <Select value={failureType} onValueChange={setFailureType}>
                    <SelectTrigger className="rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-white/10 bg-[#111111] font-mono text-xs text-[#f5efe6]">
                      <SelectItem value="workflow-control">
                        Workflow Control
                      </SelectItem>
                      <SelectItem value="guardrails">Guardrails</SelectItem>
                      <SelectItem value="tool-use">Tool Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="scen-behavior"
                  className="text-[10px] font-semibold text-[#abb4a4]"
                >
                  Expected Behavior / Output Description
                </Label>
                <Textarea
                  id="scen-behavior"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="e.g. Call check_order_status with order_id='ORD-9931' and report that it is shipped."
                  className="min-h-[70px] rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-[#48d8a4]/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="scen-exp-tools"
                    className="text-[10px] font-semibold text-[#abb4a4]"
                  >
                    Expected Tool Calls (comma-separated)
                  </Label>
                  <Input
                    id="scen-exp-tools"
                    value={expectedToolCalls}
                    onChange={(e) => setExpectedToolCalls(e.target.value)}
                    placeholder="e.g. check_order_status, lookup_customer"
                    className="rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-[#48d8a4]/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="scen-forb-tools"
                    className="text-[10px] font-semibold text-[#abb4a4]"
                  >
                    Forbidden Tool Calls (comma-separated)
                  </Label>
                  <Input
                    id="scen-forb-tools"
                    value={forbiddenToolCalls}
                    onChange={(e) => setForbiddenToolCalls(e.target.value)}
                    placeholder="e.g. request_refund"
                    className="rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-[#48d8a4]/50"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row justify-end gap-3 px-6 py-4 sm:space-x-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddScenarioOpen(false)}
                className="rounded-none border border-[#ff3b30] bg-[#ff3b30]/10 font-mono text-xs text-[#ff8b8b] hover:bg-[#ff3b30]/20 hover:text-[#ff8b8b]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!input.trim() || !expectedBehavior.trim()}
                className="rounded-none bg-[#48d8a4] font-mono text-sm font-bold text-[#10110f] hover:bg-[#62e2b7] disabled:bg-white/10 disabled:text-[#4a453d]"
              >
                Add Scenario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
