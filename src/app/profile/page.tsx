"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Save, Trophy, Target, Zap } from "lucide-react";
import Link from "next/link";
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
  learningStyle: string;
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

const defaultProfile: ProfileData = {
  level: "beginner",
  expertise: "general",
  learningStyle: "visual",
  goals: [],
  elo: 1000,
  subLevel: 1,
  problemsSolved: 0,
  streak: 0,
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = (await response.json()) as ProfileData;
          setProfile({
            level:
              data.level === "advanced"
                ? "expert"
                : (data.level ?? defaultProfile.level),
            expertise: data.expertise ?? defaultProfile.expertise,
            learningStyle: data.learningStyle ?? defaultProfile.learningStyle,
            goals: data.goals ?? [],
            elo: data.elo ?? 1000,
            subLevel: data.subLevel ?? 1,
            problemsSolved: data.problemsSolved ?? 0,
            streak: data.streak ?? 0,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

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

      setStatusMessage("Profile saved");
    } catch {
      setStatusMessage("Unable to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="text-sm text-[#6a6255]">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 py-24 md:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-[#a0978a] hover:bg-white/5 hover:text-[#f5efe6]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-semibold text-[#f5efe6]">Profile</h1>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center gap-2 text-[#a0978a]">
              <Trophy className="h-4 w-4 text-[#ff8a3d]" />
              <span className="text-xs uppercase tracking-wider">Rating</span>
            </div>
            <div className="mt-2 text-3xl font-bold text-[#ff8a3d]">
              {profile.elo}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center gap-2 text-[#a0978a]">
              <Target className="h-4 w-4 text-[#ff8a3d]" />
              <span className="text-xs uppercase tracking-wider">Solved</span>
            </div>
            <div className="mt-2 text-3xl font-bold text-[#f5efe6]">
              {profile.problemsSolved}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center gap-2 text-[#a0978a]">
              <Zap className="h-4 w-4 text-[#ff8a3d]" />
              <span className="text-xs uppercase tracking-wider">Streak</span>
            </div>
            <div className="mt-2 text-3xl font-bold text-[#f5efe6]">
              {profile.streak}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6 rounded-xl border border-white/10 bg-[#111111] p-6 md:p-8">
          <div className="space-y-2">
            <label className="text-sm text-[#a0978a]">Level</label>
            <Select
              value={profile.level}
              onValueChange={(value) =>
                setProfile((current) => ({ ...current, level: value }))
              }
            >
              <SelectTrigger className="h-12 rounded-xl border-white/10 bg-[#0d0d0d] text-[#f5efe6]">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#1a1a1a] text-[#f5efe6]">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#a0978a]">Industry</label>
            <Input
              value={profile.expertise}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  expertise: event.target.value,
                }))
              }
              placeholder="Examples: tech, healthcare, finance, education"
              className="h-12 rounded-xl border-white/10 bg-[#0d0d0d] text-[#f5efe6] placeholder:text-[#4a453d]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#a0978a]">Learning Style</label>
            <Select
              value={profile.learningStyle}
              onValueChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  learningStyle: value,
                }))
              }
            >
              <SelectTrigger className="h-12 rounded-xl border-white/10 bg-[#0d0d0d] text-[#f5efe6]">
                <SelectValue placeholder="Select your learning style" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#1a1a1a] text-[#f5efe6]">
                <SelectItem value="visual">Visual</SelectItem>
                <SelectItem value="auditory">Auditory</SelectItem>
                <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-[#a0978a]">Goals</label>
            {goalOptions.map((goal) => (
              <label
                key={goal}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-[#d9d1c7] transition hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={profile.goals.includes(goal)}
                  onChange={(e) =>
                    setProfile((current) => ({
                      ...current,
                      goals: e.target.checked
                        ? [...current.goals, goal]
                        : current.goals.filter((item) => item !== goal),
                    }))
                  }
                  className="h-4 w-4 accent-[#ff8a3d]"
                />
                {goal}
              </label>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              onClick={saveProfile}
              disabled={isSaving}
              className="rounded-full bg-[#ff8a3d] px-6 text-[#111111] hover:bg-[#ff9b5b]"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
            {statusMessage && (
              <p className="text-sm text-[#a0978a]">{statusMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
