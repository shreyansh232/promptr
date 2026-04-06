"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface UserInfo {
  level: string;
  subLevel: number;
  elo: number;
  problemsSolved: number;
  streak: number;
  expertise: string;
  learningStyle: string;
  goals: string[];
  industry: string;
  application: string;
}

interface UserInputModalProps {
  isOpen: boolean;
  onClose: (data: UserInfo) => void;
}

const steps = ["Level", "Industry", "Application", "Learning Style", "Goals"];
const goals = [
  "Write clearer prompts",
  "Learn stronger prompt structure",
  "Get more reliable outputs",
  "Explore creative applications",
];
const learningStyles: Array<{ value: string; label: string }> = [
  { value: "visual", label: "Show examples and side-by-side rewrites" },
  { value: "auditory", label: "Explain the reasoning in plain language" },
  { value: "kinesthetic", label: "Give drills and practice moves" },
];

export default function UserInputModal({
  isOpen,
  onClose,
}: UserInputModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    level: "",
    subLevel: 1,
    elo: 1000,
    problemsSolved: 0,
    streak: 0,
    expertise: "",
    learningStyle: "",
    goals: [],
    industry: "",
    application: "",
  });

  const updateUserInfo = (key: keyof UserInfo, value: string | string[]) => {
    setUserInfo((current) => ({ ...current, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    onClose(userInfo);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-[#f5efe6]">
                Pick your coaching level
              </div>
              <p className="mt-2 text-sm leading-6 text-[#a0978a]">
                The coach will tailor problems and explanations to your current
                ability.
              </p>
            </div>
            <Select
              onValueChange={(value) => updateUserInfo("level", value)}
              value={userInfo.level}
            >
              <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-[#0d0d0d] text-[#f5efe6]">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#1a1a1a] text-[#f5efe6]">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-[#f5efe6]">
                What industry do you work in?
              </div>
              <p className="mt-2 text-sm leading-6 text-[#a0978a]">
                We'll personalize practice problems to your field.
              </p>
            </div>
            <Input
              value={userInfo.industry}
              onChange={(event) =>
                updateUserInfo("industry", event.target.value)
              }
              placeholder="Examples: tech, healthcare, finance, education, marketing"
              className="h-12 rounded-2xl border-white/10 bg-[#0d0d0d] text-[#f5efe6] placeholder:text-[#4a453d]"
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-[#f5efe6]">
                Where will you apply prompt engineering?
              </div>
              <p className="mt-2 text-sm leading-6 text-[#a0978a]">
                Tell us how you plan to use these skills in your work.
              </p>
            </div>
            <Input
              value={userInfo.application}
              onChange={(event) =>
                updateUserInfo("application", event.target.value)
              }
              placeholder="Examples: writing reports, coding, content creation, data analysis"
              className="h-12 rounded-2xl border-white/10 bg-[#0d0d0d] text-[#f5efe6] placeholder:text-[#4a453d]"
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-[#f5efe6]">
              How do you like to learn?
            </div>
            <RadioGroup
              onValueChange={(value) => updateUserInfo("learningStyle", value)}
              value={userInfo.learningStyle}
              className="space-y-3"
            >
              {learningStyles.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-3"
                >
                  <RadioGroupItem value={value} id={value} />
                  <span className="text-sm text-[#d9d1c7]">{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-[#f5efe6]">
              Choose the outcomes you care about
            </div>
            <div className="space-y-3">
              {goals.map((goal) => (
                <label
                  key={goal}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-3"
                >
                  <Checkbox
                    id={goal}
                    checked={userInfo.goals.includes(goal)}
                    onCheckedChange={(checked) =>
                      updateUserInfo(
                        "goals",
                        checked
                          ? [...userInfo.goals, goal]
                          : userInfo.goals.filter((item) => item !== goal),
                      )
                    }
                  />
                  <Label htmlFor={goal} className="text-sm text-[#d9d1c7]">
                    {goal}
                  </Label>
                </label>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled =
    (currentStep === 0 && !userInfo.level) ||
    (currentStep === 1 && !userInfo.industry.trim()) ||
    (currentStep === 2 && !userInfo.application.trim()) ||
    (currentStep === 3 && !userInfo.learningStyle) ||
    (currentStep === 4 && userInfo.goals.length === 0);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl rounded-[2rem] border border-white/10 bg-[#111111] p-0 text-[#f5efe6] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <DialogHeader className="border-b border-white/10 px-8 py-7">
          <div className="mb-3 inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[#a0978a]">
            Setup
          </div>
          <DialogTitle className="text-3xl tracking-tight text-[#f5efe6]">
            Personalize your experience
          </DialogTitle>
          <DialogDescription className="mt-2 text-base leading-7 text-[#a0978a]">
            Step {currentStep + 1} of {steps.length}:{" "}
            {steps[currentStep] ?? steps[0]}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-8">
          <div className="mb-6 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-[#ff8a3d]"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-row justify-between border-t border-white/10 px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
            disabled={currentStep === 0}
            className="rounded-2xl border border-white/10 bg-white/5 text-[#a0978a] hover:bg-white/10 hover:text-[#f5efe6]"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="rounded-2xl bg-[#ff8a3d] px-6 text-[#111111] hover:bg-[#ff9b5b]"
          >
            {currentStep === steps.length - 1 ? "Open workspace" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
