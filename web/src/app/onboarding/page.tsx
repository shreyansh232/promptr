"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

const steps = ["Level", "Builder", "Stack", "Risk"];
const frameworkOptions = [
  "OpenAI Agents SDK",
  "LangGraph",
  "CrewAI",
  "Generic tool calling",
];
const riskOptions = [
  "Tool misuse",
  "Prompt injection",
  "Privacy leaks",
  "Human escalation",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    level: "",
    builderRole: "",
    workflowFocus: "",
    frameworks: [] as string[],
    riskFocus: "",
  });

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFramework = (framework: string) => {
    setFormData((prev) => ({
      ...prev,
      frameworks: prev.frameworks.includes(framework)
        ? prev.frameworks.filter((item) => item !== framework)
        : [...prev.frameworks, framework],
    }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: formData.level,
          expertise: formData.builderRole,
          application: formData.workflowFocus,
          goals: [
            `Build reliable ${formData.workflowFocus || "agent"} workflows`,
            `Improve ${formData.riskFocus || "agent safety"} handling`,
          ],
          learningStyle: "kinesthetic",
          builderRole: formData.builderRole,
          frameworks: formData.frameworks,
          workflowFocus: formData.workflowFocus,
          riskFocus: formData.riskFocus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      router.refresh();
      router.push("/");
    } catch {
      toast.error("Failed to save your agent profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isNextDisabled =
    (currentStep === 0 && !formData.level) ||
    (currentStep === 1 &&
      (!formData.builderRole.trim() || !formData.workflowFocus.trim())) ||
    (currentStep === 2 && formData.frameworks.length === 0) ||
    (currentStep === 3 && !formData.riskFocus);

  return (
    <div className="flex min-h-screen bg-[#080908] text-[#f7f2e8]">
      <div className="hidden w-1/2 flex-col justify-between border-r border-white/10 bg-[#0d0f0c] px-12 py-10 lg:flex">
        <div className="text-lg font-semibold">Promptr</div>

        <div className="max-w-md">
          <div className="mb-5 inline-flex border border-[#48d8a4]/30 bg-[#48d8a4]/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6be0b9]">
            Agent profile
          </div>
          <h1 className="text-5xl font-semibold leading-tight">
            Calibrate your Playground missions.
          </h1>
          <p className="mt-5 text-base leading-7 text-[#abb4a4]">
            Promptr will tune missions around your agent stack, workflows, and
            highest-risk failure modes.
          </p>
        </div>

        <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#71786d]">
          Step {currentStep + 1} / {steps.length}
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 h-1.5 w-full bg-white/10">
            <div
              className="h-1.5 bg-[#48d8a4] transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  How experienced are you with agents?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#abb4a4]">
                  This controls mission complexity and how much scaffolding you
                  get.
                </p>
              </div>
              <Select
                onValueChange={(value) => updateField("level", value)}
                value={formData.level}
              >
                <SelectTrigger className="h-14 rounded-none border border-white/10 bg-[#10110f] text-base text-[#f7f2e8] focus:border-[#48d8a4]/40 focus:outline-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#10110f] text-[#f7f2e8]">
                  <SelectItem value="beginner">
                    Beginner - learning agent basics
                  </SelectItem>
                  <SelectItem value="intermediate">
                    Intermediate - building tool workflows
                  </SelectItem>
                  <SelectItem value="expert">
                    Expert - hardening production agents
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  What kind of agent are you building?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#abb4a4]">
                  Be concrete: support automation, coding agent, sales ops,
                  research workflow.
                </p>
              </div>
              <Input
                value={formData.builderRole}
                onChange={(event) =>
                  updateField("builderRole", event.target.value)
                }
                placeholder="Example: full-stack developer"
                className="h-14 rounded-none border border-white/10 bg-[#10110f] text-base text-[#f7f2e8] placeholder:text-[#71786d] focus-visible:border-[#48d8a4]/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Input
                value={formData.workflowFocus}
                onChange={(event) =>
                  updateField("workflowFocus", event.target.value)
                }
                placeholder="Example: support triage workflow"
                className="h-14 rounded-none border border-white/10 bg-[#10110f] text-base text-[#f7f2e8] placeholder:text-[#71786d] focus-visible:border-[#48d8a4]/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  Which stack should examples reference?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#abb4a4]">
                  Promptr stays framework-agnostic but can use familiar terms.
                </p>
              </div>
              <div className="space-y-3">
                {frameworkOptions.map((framework) => (
                  <CheckboxRow
                    key={framework}
                    label={framework}
                    checked={formData.frameworks.includes(framework)}
                    onChange={() => toggleFramework(framework)}
                  />
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  What failure mode matters most?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#abb4a4]">
                  Missions will bias toward the risk you most need to control.
                </p>
              </div>
              <div className="space-y-3">
                {riskOptions.map((risk) => (
                  <button
                    key={risk}
                    type="button"
                    onClick={() => updateField("riskFocus", risk)}
                    className={`flex w-full items-center justify-between border px-4 py-4 text-left transition-colors ${
                      formData.riskFocus === risk
                        ? "border-[#48d8a4]/50 bg-[#48d8a4]/10 text-[#f7f2e8]"
                        : "border-white/10 bg-[#10110f] text-[#abb4a4] hover:border-white/20"
                    }`}
                  >
                    <span>{risk}</span>
                    {formData.riskFocus === risk && (
                      <Check size={16} className="text-[#48d8a4]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="rounded-none text-[#8f978b] hover:bg-white/5 hover:text-[#f7f2e8] disabled:opacity-30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isNextDisabled || isSaving}
              className="rounded-none bg-[#48d8a4] px-6 py-6 font-mono text-xs uppercase tracking-[0.12em] text-[#10110f] hover:bg-[#62e2b7] disabled:opacity-40"
            >
              {isSaving
                ? "Saving"
                : currentStep === steps.length - 1
                  ? "Open Playground"
                  : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 border border-white/10 bg-[#10110f] px-4 py-4 text-[#abb4a4] transition-colors hover:border-white/20">
      <span
        className={`flex h-5 w-5 items-center justify-center border ${
          checked
            ? "border-[#48d8a4] bg-[#48d8a4]"
            : "border-white/20 bg-transparent"
        }`}
      >
        {checked && <Check size={13} className="text-[#10110f]" />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className={checked ? "text-[#f7f2e8]" : undefined}>{label}</span>
    </label>
  );
}
