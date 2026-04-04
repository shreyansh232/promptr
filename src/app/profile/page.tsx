"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserProfile {
  level: string;
  expertise: string;
  learningStyle: string;
  goals: string[];
}

const goalOptions = [
  "Improve writing skills",
  "Learn advanced techniques",
  "Increase efficiency",
  "Explore creative applications",
];

const defaultProfile: UserProfile = {
  level: "beginner",
  expertise: "general",
  learningStyle: "visual",
  goals: [],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = (await response.json()) as UserProfile;
          setProfile({
            level: data.level ?? defaultProfile.level,
            expertise: data.expertise ?? defaultProfile.expertise,
            learningStyle: data.learningStyle ?? defaultProfile.learningStyle,
            goals: data.goals ?? [],
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
    } catch (error) {
      setStatusMessage("Unable to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-24 text-white">
      <div className="mx-auto max-w-3xl">
        <Card className="border-second/40 bg-black/60">
          <CardHeader>
            <CardTitle className="text-3xl">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <p className="text-sm text-gray-300">Loading profile...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={profile.level}
                    onValueChange={(value) =>
                      setProfile((current) => ({ ...current, level: value }))
                    }
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertise">Expertise</Label>
                  <Input
                    id="expertise"
                    value={profile.expertise}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        expertise: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning-style">Learning Style</Label>
                  <Select
                    value={profile.learningStyle}
                    onValueChange={(value) =>
                      setProfile((current) => ({
                        ...current,
                        learningStyle: value,
                      }))
                    }
                  >
                    <SelectTrigger id="learning-style">
                      <SelectValue placeholder="Select your learning style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual">Visual</SelectItem>
                      <SelectItem value="auditory">Auditory</SelectItem>
                      <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Goals</Label>
                  {goalOptions.map((goal) => (
                    <label key={goal} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={profile.goals.includes(goal)}
                        onCheckedChange={(checked) =>
                          setProfile((current) => ({
                            ...current,
                            goals: checked
                              ? [...current.goals, goal]
                              : current.goals.filter((item) => item !== goal),
                          }))
                        }
                      />
                      <span>{goal}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <Button onClick={saveProfile} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                  {statusMessage && (
                    <p className="text-sm text-gray-300">{statusMessage}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
