"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, FloppyDisk as Save } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileData {
  level: string;
  expertise: string;
  application: string;
  goals: string[];
  elo: number;
  subLevel: number;
  problemsSolved: number;
  streak: number;
  builderRole: string;
  frameworks: string[];
  workflowFocus: string;
  riskFocus: string;
}

const frameworkOptions = [
  "LLM Agents SDK",
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

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number>();

  useEffect(() => {
    const animate = (currentTime: number) => {
      startTime.current ??= currentTime;
      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [target, duration]);

  return count;
}

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const searchParams = useSearchParams();
  const fromLanding = searchParams.get("from") === "landing";
  const [profile, setProfile] = useState<ProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const reliabilityScore = profile.elo > 100 ? 0 : profile.elo;
  const animatedReliability = useCountUp(reliabilityScore);
  const animatedCompleted = useCountUp(profile.problemsSolved);
  const animatedStreak = useCountUp(profile.streak);

  const toggleFramework = (framework: string) => {
    setProfile((current) => ({
      ...current,
      frameworks: current.frameworks.includes(framework)
        ? current.frameworks.filter((item) => item !== framework)
        : [...current.frameworks, framework],
    }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          expertise: profile.builderRole || profile.expertise,
          application: profile.workflowFocus || profile.application,
          goals:
            profile.goals.length > 0
              ? profile.goals
              : ["Build reliable AI agent workflows"],
          learningStyle: "kinesthetic",
        }),
      });

      if (!response.ok) throw new Error("Failed to save profile");

      setStatusMessage("Agent profile saved");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage("Unable to save profile");
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080908] text-[#f7f2e8]">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#080908]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href={fromLanding ? "/" : "/missions"}
            className="group flex items-center gap-2 text-sm text-[#8f978b] transition-colors hover:text-[#f7f2e8]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {fromLanding ? "Home" : "Missions"}
          </Link>
          <Button
            onClick={saveProfile}
            disabled={isSaving}
            className="rounded-none bg-[#48d8a4] px-6 py-2.5 font-mono text-sm font-bold text-[#10110f] hover:bg-[#62e2b7] disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving" : "Save"}
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-14">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#48d8a4]">
            Progress
          </div>
          <h1 className="text-5xl font-semibold tracking-tight">
            Agent builder profile
          </h1>
          <div className="mt-6 h-px w-24 bg-[#48d8a4]" />
        </div>

        <div className="mb-16 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Stat
            label="Reliability Score"
            value={animatedReliability}
            suffix="/100"
          />
          <Stat label="Missions Completed" value={animatedCompleted} />
          <Stat label="Current Streak" value={animatedStreak} suffix=" days" />
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="border border-white/10 bg-[#10110f] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8f978b]">
              Current path
            </div>
            <div className="mt-5 text-6xl font-semibold">
              {profile.subLevel}
              <span className="text-2xl text-[#71786d]">/5</span>
            </div>
            <p className="mt-3 text-sm capitalize text-[#abb4a4]">
              {profile.level} tier
            </p>
            <p className="mt-6 text-sm leading-6 text-[#abb4a4]">
              Promptr uses your profile to generate agent missions around the
              workflows, tools, and failure modes you care about.
            </p>
          </section>

          <section className="space-y-8">
            <FieldBlock index="01" title="Agent skill level">
              <Select
                value={profile.level}
                onValueChange={(value) =>
                  setProfile((current) => ({ ...current, level: value }))
                }
              >
                <SelectTrigger className="h-14 rounded-none border border-white/10 bg-[#10110f] text-base text-[#f7f2e8] focus:border-[#48d8a4]/40 focus:outline-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#10110f] text-[#f7f2e8]">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </FieldBlock>

            <FieldBlock index="02" title="Builder context">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={profile.builderRole}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      builderRole: event.target.value,
                      expertise: event.target.value,
                    }))
                  }
                  placeholder="full-stack developer"
                  className="h-14 rounded-none border border-white/10 bg-[#10110f] text-base text-[#f7f2e8] placeholder:text-[#71786d] focus-visible:border-[#48d8a4]/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Input
                  value={profile.workflowFocus}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      workflowFocus: event.target.value,
                      application: event.target.value,
                    }))
                  }
                  placeholder="support triage workflow"
                  className="h-14 rounded-none border border-white/10 bg-[#10110f] text-base text-[#f7f2e8] placeholder:text-[#71786d] focus-visible:border-[#48d8a4]/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </FieldBlock>

            <FieldBlock index="03" title="Framework references">
              <div className="grid gap-3 md:grid-cols-2">
                {frameworkOptions.map((framework) => (
                  <CheckboxRow
                    key={framework}
                    label={framework}
                    checked={profile.frameworks.includes(framework)}
                    onChange={() => toggleFramework(framework)}
                  />
                ))}
              </div>
            </FieldBlock>

            <FieldBlock index="04" title="Risk focus">
              <div className="grid gap-3 md:grid-cols-2">
                {riskOptions.map((risk) => (
                  <button
                    key={risk}
                    type="button"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        riskFocus: risk,
                      }))
                    }
                    className={`flex items-center justify-between border px-4 py-4 text-left transition-colors ${
                      profile.riskFocus === risk
                        ? "border-[#48d8a4]/50 bg-[#48d8a4]/10 text-[#f7f2e8]"
                        : "border-white/10 bg-[#10110f] text-[#abb4a4] hover:border-white/20"
                    }`}
                  >
                    <span>{risk}</span>
                    {profile.riskFocus === risk && (
                      <Check size={16} className="text-[#48d8a4]" />
                    )}
                  </button>
                ))}
              </div>
            </FieldBlock>
          </section>
        </div>
      </main>

      {statusMessage && (
        <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="border border-white/10 bg-[#10110f] px-5 py-3 text-sm text-[#d8ddcf]">
            {statusMessage}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="border border-white/10 bg-[#10110f] p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8f978b]">
        {label}
      </div>
      <div className="mt-4 text-5xl font-semibold">
        {value}
        <span className="text-lg text-[#71786d]">{suffix}</span>
      </div>
    </div>
  );
}

function FieldBlock({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-baseline gap-4">
        <span className="font-mono text-xs text-[#48d8a4]">{index}</span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
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
