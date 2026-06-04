"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "@phosphor-icons/react";
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

const frameworkOptions = [
  "OpenAI Agents SDK",
  "LangGraph",
  "CrewAI",
  "Generic tool calling",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    goal: "",
    frameworks: [] as string[],
  });

  const [touched, setTouched] = useState({
    role: false,
    goal: false,
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

  const handleSubmit = async () => {
    // Mark all required fields as touched
    setTouched({ role: true, goal: true });

    // Validate inputs
    if (!formData.role.trim() || !formData.goal) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: formData.goal.includes("harden")
            ? "expert"
            : formData.goal.includes("guardrails")
              ? "intermediate"
              : "beginner",
          expertise: formData.role,
          application: formData.goal,
          goals: [formData.role, formData.goal],
          builderRole: formData.role,
          frameworks: formData.frameworks,
          workflowFocus: formData.goal,
          riskFocus: formData.goal.includes("guardrails")
            ? "Prompt injection"
            : "General",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      setIsSubmitted(true);
    } catch {
      toast.error("Failed to save your agent profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const roleError = touched.role && !formData.role.trim();
  const goalError = touched.goal && !formData.goal;

  return (
    <div className="flex min-h-screen bg-[#080908] text-[#f7f2e8]">
      {/* Left panel: Info */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-white/10 bg-[#0d0f0c] px-12 py-10 lg:flex">
        <div className="text-lg font-semibold">Promptr</div>

        <div className="max-w-md">
          <div className="mb-5 inline-flex border border-[#48d8a4]/30 bg-[#48d8a4]/10 px-3 py-1.5 font-mono text-[11px] text-[#6be0b9]">
            Workspace profile
          </div>
          <h1 className="text-5xl font-semibold leading-tight">
            {isSubmitted
              ? "Welcome to Promptr."
              : "Set up your developer profile."}
          </h1>
          <p className="mt-5 text-base leading-7 text-[#abb4a4]">
            {isSubmitted
              ? "Your profile has been saved. You're ready to start writing, testing, and hardening your agent instructions."
              : "Tell us a bit about your role and goals so we can understand your developer needs and get your workspace ready."}
          </p>
        </div>

        <div className="font-mono text-xs text-[#71786d]">
          Initial calibration
        </div>
      </div>

      {/* Right panel: Form / Choice */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        {isSubmitted ? (
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Calibration complete!</h2>
              <p className="mt-2 text-sm text-[#abb4a4]">
                Choose where you would like to start:
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => {
                  router.refresh();
                  router.push("/lab");
                }}
                className="w-full rounded-none bg-[#48d8a4] py-6 font-mono text-xs text-[#10110f] hover:bg-[#62e2b7]"
              >
                Go to Lab (Sandbox)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                onClick={() => {
                  router.refresh();
                  router.push("/missions");
                }}
                variant="outline"
                className="w-full rounded-none border border-[#48d8a4]/30 bg-[#48d8a4]/5 py-6 font-mono text-xs text-[#48d8a4] hover:bg-[#48d8a4]/10 hover:text-[#f7f2e8]"
              >
                Go to Missions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-2xl font-semibold">Profile details</h2>
              <p className="mt-2 text-sm text-[#abb4a4]">
                Complete your profile details to configure the workspace.
              </p>
            </div>

            <div className="space-y-6">
              {/* Field 1: Role */}
              <div className="space-y-2">
                <label className="font-mono text-sm text-[#8f978b]">
                  What is your role?
                  <sup
                    className={`ml-0.5 transition-colors ${
                      roleError ? "font-bold text-red-500" : "text-[#8f978b]"
                    }`}
                    title="Required"
                  >
                    *
                  </sup>
                </label>
                <Input
                  value={formData.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, role: true }))}
                  placeholder="e.g. AI Engineer, Software Developer, Researcher"
                  className={`h-12 rounded-none border bg-[#10110f] text-sm text-[#f7f2e8] placeholder:text-[#555d52] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                    roleError
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-white/10 focus-visible:border-[#48d8a4]/40"
                  }`}
                />
                {roleError && (
                  <p className="mt-1 text-xs text-red-400">Role is required.</p>
                )}
              </div>

              {/* Field 2: Goal */}
              <div className="space-y-2">
                <label className="font-mono text-sm text-[#8f978b]">
                  What is your primary goal?
                  <sup
                    className={`ml-0.5 transition-colors ${
                      goalError ? "font-bold text-red-500" : "text-[#8f978b]"
                    }`}
                    title="Required"
                  >
                    *
                  </sup>
                </label>
                <Select
                  onValueChange={(value) => {
                    updateField("goal", value);
                    setTouched((prev) => ({ ...prev, goal: true }));
                  }}
                  value={formData.goal}
                >
                  <SelectTrigger
                    className={`h-12 rounded-none border bg-[#10110f] text-sm text-[#f7f2e8] focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                      goalError
                        ? "border-red-500 focus:border-red-500"
                        : "border-white/10 focus:border-[#48d8a4]/40"
                    }`}
                  >
                    <SelectValue placeholder="Select your primary goal" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#10110f] text-[#f7f2e8]">
                    <SelectItem value="Learn agent prompt basics and tool calling">
                      Learn agent prompt basics and tool calling
                    </SelectItem>
                    <SelectItem value="Test prompts against adversarial inputs and guardrails">
                      Test prompts against adversarial inputs and guardrails
                    </SelectItem>
                    <SelectItem value="Evaluate and harden production-grade workflows">
                      Evaluate and harden production-grade workflows
                    </SelectItem>
                    <SelectItem value="Explore and practice general prompting challenges">
                      Explore and practice general prompting challenges
                    </SelectItem>
                  </SelectContent>
                </Select>
                {goalError && (
                  <p className="mt-1 text-xs text-red-400">
                    Primary goal is required.
                  </p>
                )}
              </div>

              {/* Field 3: AI Stack (Optional) */}
              <div className="space-y-2">
                <div className="flex flex-col">
                  <label className="font-mono text-sm text-[#8f978b]">
                    Primary AI Stack / Framework (Optional)
                  </label>
                  <span className="mt-0.5 text-[11px] text-[#71786d]">
                    Select the frameworks you build with, if any.
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                  {frameworkOptions.map((framework) => {
                    const checked = formData.frameworks.includes(framework);
                    return (
                      <button
                        key={framework}
                        type="button"
                        onClick={() => toggleFramework(framework)}
                        className={`flex items-center gap-3 border px-3 py-3 text-left transition-colors ${
                          checked
                            ? "border-[#48d8a4]/50 bg-[#48d8a4]/5 text-[#f7f2e8]"
                            : "border-white/10 bg-[#10110f] text-[#abb4a4] hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                            checked
                              ? "border-[#48d8a4] bg-[#48d8a4]"
                              : "border-white/20 bg-transparent"
                          }`}
                        >
                          {checked && (
                            <Check size={11} className="text-[#10110f]" />
                          )}
                        </span>
                        <span className="text-xs">{framework}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-8">
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full rounded-none bg-[#48d8a4] py-6 font-mono text-xs text-[#10110f] hover:bg-[#62e2b7] disabled:opacity-40"
              >
                {isSaving ? "Saving..." : "Submit"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
