"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
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

const steps = ["Level", "Industry", "Application"];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    level: "",
    industry: "",
    application: "",
  });

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Save profile
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: formData.level,
          expertise: formData.industry,
          application: formData.application,
          goals: ["Write clearer prompts"],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Ensure the server-side router and cache are fresh before redirecting
      router.refresh();

      // Small delay to ensure DB persistence and cache revalidation
      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push("/dashboard");
    } catch {
      toast.error("Failed to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isNextDisabled =
    (currentStep === 0 && !formData.level) ||
    (currentStep === 1 && !formData.industry.trim()) ||
    (currentStep === 2 && !formData.application.trim());

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                What&apos;s your experience level?
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                We&apos;ll tailor problems and feedback to match your ability.
              </p>
            </div>
            <Select
              onValueChange={(v) => updateField("level", v)}
              value={formData.level}
            >
              <SelectTrigger className="h-14 rounded-2xl border-border bg-background text-base text-foreground">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent className="border-border bg-secondary text-foreground">
                <SelectItem value="beginner">
                  Beginner — New to prompt engineering
                </SelectItem>
                <SelectItem value="intermediate">
                  Intermediate — Some experience, want to improve
                </SelectItem>
                <SelectItem value="expert">
                  Expert — Looking to master advanced techniques
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                What industry do you work in?
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                We&apos;ll personalize practice problems to your field.
              </p>
            </div>
            <Input
              value={formData.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              placeholder="Examples: tech, healthcare, finance, education, marketing"
              className="h-14 rounded-2xl border-border bg-background text-base text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Where will you apply prompt engineering?
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                Tell us how you plan to use these skills in your work.
              </p>
            </div>
            <Input
              value={formData.application}
              onChange={(e) => updateField("application", e.target.value)}
              placeholder="Examples: writing reports, coding, content creation, data analysis"
              className="h-14 rounded-2xl border-border bg-background text-base text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side — branding */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-border bg-secondary/20 px-12 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-foreground">Promptr</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl leading-tight text-foreground">
            Learn prompt engineering by doing, not reading.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Practice with real problems. Get scored. Improve. Repeat.
          </p>
        </div>

        <div className="text-sm text-muted-foreground/40">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {/* Progress bar */}
          <div className="mb-10 h-1.5 w-full rounded-full bg-secondary/40">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isNextDisabled || isSaving}
              className="rounded-full bg-primary px-8 py-6 text-base text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {isSaving ? (
                "Saving..."
              ) : currentStep === steps.length - 1 ? (
                <>
                  Open workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
