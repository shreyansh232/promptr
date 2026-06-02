"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, FloppyDisk as Save, Check } from "@phosphor-icons/react";
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
}

const goalOptions = [
  "Write clearer prompts",
  "Learn stronger prompt structure",
  "Get more reliable outputs",
  "Explore creative applications",
];

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number>();

  useEffect(() => {
    const animate = (currentTime: number) => {
      startTime.current ??= currentTime;

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(eased * target);

      setCount(currentCount);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
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

  const animatedSolved = useCountUp(profile.problemsSolved, 1500);
  const animatedStreak = useCountUp(profile.streak, 1200);

  const saveProfile = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      setStatusMessage("Profile saved successfully");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage("Unable to save profile");
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <Link
            href={fromLanding ? "/" : "/dashboard"}
            className="group flex items-center gap-2 text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {fromLanding ? "Home" : "Dashboard"}
          </Link>
          <Button
            onClick={saveProfile}
            disabled={isSaving}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving
              </>
            ) : (
              <>
                <Save className="mr-2 h-3.5 w-3.5" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hero Section - Editorial Layout */}
      <div className="mx-auto max-w-6xl px-8 pt-16 pb-24">
        <div className="mb-20">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
            Profile
          </div>
          <h1 className="mb-6 text-6xl font-light tracking-tight text-foreground">
            Your Progress
          </h1>
          <div className="h-px w-24 bg-primary" />
        </div>

        {/* Stats - Equal 3-Column Grid with Count-Up Animation */}
        <div className="mb-24 grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Level Progress */}
          <div className="group">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                Level Progress
              </span>
            </div>
            <div className="relative">
              <div className="text-8xl font-extralight leading-none tracking-tighter text-foreground transition-colors group-hover:text-primary">
                {profile.subLevel}
                <span className="text-3xl font-extralight text-muted-foreground/40">/5</span>
              </div>
              <div className="absolute -right-4 top-4 h-24 w-24 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-2 text-sm capitalize text-muted-foreground/60">
              {profile.level} Tier
            </div>
            <div className="mt-6 h-px w-full bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />
          </div>

          {/* Problems Solved */}
          <div className="group">
            <div className="mb-4">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                Problems Solved
              </span>
            </div>
            <div className="relative">
              <div className="text-8xl font-extralight leading-none tracking-tighter text-foreground transition-colors group-hover:text-primary">
                {animatedSolved}
              </div>
              <div className="absolute -right-4 top-4 h-24 w-24 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-2 text-sm text-muted-foreground/60">
              completed
            </div>
            <div className="mt-6 h-px w-full bg-secondary/40" />
          </div>

          {/* Streak */}
          <div className="group">
            <div className="mb-4">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                Current Streak
              </span>
            </div>
            <div className="relative">
              <div className="flex items-baseline gap-3">
                <span className="text-8xl font-extralight leading-none tracking-tighter text-foreground transition-colors group-hover:text-primary">
                  {animatedStreak}
                </span>
                <span className="text-sm text-muted-foreground/60">days</span>
              </div>
              <div className="absolute -right-4 top-4 h-24 w-24 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-2 text-sm text-muted-foreground/60">
              in a row
            </div>
            <div className="mt-6 h-px w-full bg-secondary/40" />
          </div>
        </div>

        {/* Settings - Editorial Sections */}
        <div className="space-y-20">
          {/* Section 01 - Skill Level */}
          <section>
            <div className="mb-8 flex items-baseline gap-6">
              <span className="text-xs font-medium text-primary">01</span>
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                Skill Level
              </h2>
            </div>
            <div className="max-w-2xl">
              <Select
                value={profile.level}
                onValueChange={(value) =>
                  setProfile((current) => ({ ...current, level: value }))
                }
              >
                <SelectTrigger className="h-14 rounded-none border-0 border-b border-border bg-transparent px-0 text-lg text-foreground transition-colors hover:border-border/80 focus:border-primary focus:ring-0">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent className="border-border bg-secondary text-foreground">
                  <SelectItem value="beginner" className="text-left">
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">Beginner</span>
                      <span className="text-xs text-muted-foreground/60">
                        New to prompt engineering
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate" className="text-left">
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">Intermediate</span>
                      <span className="text-xs text-muted-foreground/60">
                        Some experience, want to improve
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expert" className="text-left">
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">Expert</span>
                      <span className="text-xs text-muted-foreground/60">
                        Looking to master advanced techniques
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Section 02 - Background */}
          <section>
            <div className="mb-8 flex items-baseline gap-6">
              <span className="text-xs font-medium text-primary">02</span>
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                Background
              </h2>
            </div>
            <div className="max-w-2xl space-y-8">
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
                  Industry
                </label>
                <Input
                  value={profile.expertise}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      expertise: event.target.value,
                    }))
                  }
                  placeholder="tech, healthcare, finance, education"
                  className="h-14 rounded-none border-0 border-b border-border bg-transparent px-0 text-lg text-foreground placeholder:text-muted-foreground/40 transition-colors focus:border-primary focus:ring-0"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
                  Application
                </label>
                <Input
                  value={profile.application}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      application: event.target.value,
                    }))
                  }
                  placeholder="writing reports, coding, content creation"
                  className="h-14 rounded-none border-0 border-b border-border bg-transparent px-0 text-lg text-foreground placeholder:text-muted-foreground/40 transition-colors focus:border-primary focus:ring-0"
                />
              </div>
            </div>
          </section>

          {/* Section 03 - Goals */}
          <section>
            <div className="mb-8 flex items-baseline gap-6">
              <span className="text-xs font-medium text-primary">03</span>
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                Learning Goals
              </h2>
            </div>
            <div className="max-w-3xl space-y-3">
              {goalOptions.map((goal) => {
                const isSelected = profile.goals.includes(goal);
                return (
                  <label
                    key={goal}
                    className={`group flex cursor-pointer items-center gap-4 border-b px-0 py-4 transition-all ${
                      isSelected
                        ? "border-primary/30"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-sm border transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40 bg-transparent group-hover:border-muted-foreground/60"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        setProfile((current) => ({
                          ...current,
                          goals: e.target.checked
                            ? [...current.goals, goal]
                            : current.goals.filter((item) => item !== goal),
                        }))
                      }
                      className="sr-only"
                    />
                    <span
                      className={`text-base transition-colors ${
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {goal}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`rounded-lg border px-5 py-3 text-sm backdrop-blur-sm ${
              statusMessage.includes("successfully")
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-border bg-secondary/20 text-muted-foreground"
            }`}
          >
            {statusMessage}
          </div>
        </div>
      )}
    </div>
  );
}
