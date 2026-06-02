"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkle,
  ArrowRight,
  CircleNotch,
  Target,
  Fire,
  Play,
  Lightbulb
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import MainSidebar from "./Sidebar";

interface UserInfo {
  level: string;
  subLevel: number;
  elo: number;
  problemsSolved: number;
  streak: number;
  expertise: string;
  application: string;
  learningStyle: string;
  goals: string[];
  industry: string;
  credits: number;
  solvedProblems?: {
    userLevel: string;
    subLevel: number;
    problemTitle: string;
  }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  user_type: UserInfo;
}

interface PromptSuggestion {
  title: string;
  prompt: string;
  reasoning: string;
}

interface PromptAnalysis {
  label: string;
  score: number;
  feedback: string;
  motivation: string;
  tags: string[];
  content: string;
  learning_points: string[];
  improved_prompts: PromptSuggestion[];
  creditsRemaining?: number;
}

interface PracticeProblem {
  id: string; // Changed to string for MongoDB ObjectId
  title: string;
  difficulty: string;
  description: string;
  goal: string;
  examples: { input: string; output: string; explanation: string }[];
  testCases: { input: string; expectedOutput: string; description: string }[];
  proTips: string[];
  tags: string[];
  hint?: string;
}

interface TestCaseEvalResult {
  score: number;
  passed: boolean;
  reasoning: string;
  missing_elements: string[];
  strengths: string[];
  testCase: string;
}

interface PromptEvaluation {
  overallScore: number;
  passed: boolean;
  testCasesPassed: number;
  testCasesTotal: number;
  results: TestCaseEvalResult[];
  creditsRemaining?: number;
  submissionId?: string;
}

// No browser local storage cache. All problems persist in MongoDB.

const formatExampleInput = (input: string) => {
  if (!input) return "";
  try {
    const parsed = JSON.parse(input) as unknown;
    if (parsed && typeof parsed === "object") {
      const parsedObj = parsed as Record<string, unknown>;
      return Object.entries(parsedObj)
        .map(([key, val]) => {
          const formattedVal = Array.isArray(val)
            ? val.join(", ")
            : val && typeof val === "object"
            ? JSON.stringify(val)
            : String(val);
          return `${key}: ${formattedVal}`;
        })
        .join("\n");
    }
  } catch {
    // Return original string if not valid JSON
  }
  return input;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysis | null>(
    null,
  );
  const [promptEvaluation, setPromptEvaluation] =
    useState<PromptEvaluation | null>(null);
  const [, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeProblem, setActiveProblem] = useState<PracticeProblem | null>(
    null,
  );
  const [score, setScore] = useState<number | null>(null);
  const [, setEloResult] = useState<{
    elo: number;
    eloChange: number;
    passed: boolean;
  } | null>(null);
  const [problemIndex, setProblemIndex] = useState(1);
  const [isReporting, setIsReporting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { data: session } = useSession();
  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? "P";

  const normalizedUserInfo = useMemo(() => userInfo, [userInfo]);

  // Fetch problems — defined as useCallback so it's accessible everywhere
  const fetchProblems = useCallback(async () => {
    if (!normalizedUserInfo) return;

    // Fetch from API with timeout
    setIsGenerating(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("/api/generate-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: normalizedUserInfo.level,
          subLevel: normalizedUserInfo.subLevel,
          expertise: normalizedUserInfo.expertise,
          application: normalizedUserInfo.application,
          learning_style: normalizedUserInfo.learningStyle,
          goals: normalizedUserInfo.goals,
        }),
        signal: controller.signal,
      });

      if (!response.ok) return;

      const data = (await response.json()) as { problems?: PracticeProblem[] };
      const problems = data.problems;
      if (problems && problems.length > 0) {
        setActiveProblem(problems[0] ?? null);
      }
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      clearTimeout(timeout);
      setIsGenerating(false);
      setIsLoading(false);
    }
  }, [normalizedUserInfo]);

  // Load user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) return;

        const data = (await response.json()) as UserInfo;
        setUserInfo(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserProfile();
  }, []);

  // Fetch problems when user info is available
  useEffect(() => {
    if (normalizedUserInfo) {
      void fetchProblems();
    }
  }, [normalizedUserInfo, fetchProblems]);

  // Synchronize problemIndex with user sublevel progress
  useEffect(() => {
    if (normalizedUserInfo) {
      setProblemIndex(normalizedUserInfo.subLevel);
    }
  }, [normalizedUserInfo]);

  // Reset showHint state when problem changes
  useEffect(() => {
    setShowHint(false);
  }, [activeProblem]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !normalizedUserInfo || isTyping) return;

    const promptText = inputValue.trim();
    const newUserMessage: Message = {
      role: "user",
      content: promptText,
      user_type: normalizedUserInfo,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    if (!activeProblem) {
      setInputValue("");
    }
    setIsTyping(true);
    setScore(null);
    setEloResult(null);
    setPromptEvaluation(null);

    try {
      // If a problem is active, evaluate against test cases
      if (activeProblem) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

        const evalResponse = await fetch("/api/evaluate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            problemId: activeProblem.id,
            testCases: activeProblem.testCases,
            problemTitle: activeProblem.title,
            problemDescription: activeProblem.description,
            problemGoal: activeProblem.goal,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!evalResponse.ok) {
          const errorData = (await evalResponse.json()) as { error?: string };
          toast.error(errorData.error ?? "Failed to evaluate prompt");
          throw new Error(errorData.error ?? "Failed to evaluate prompt");
        }

        const evalData = (await evalResponse.json()) as PromptEvaluation;
        setPromptEvaluation(evalData);
        setScore(evalData.overallScore);

        // Update credits locally
        if (evalData.creditsRemaining !== undefined) {
          setUserInfo((prev) =>
            prev ? { ...prev, credits: evalData.creditsRemaining! } : null,
          );
        }

        // Update progression and save solved problem based on evaluation score
        const eloRes = await fetch("/api/user/elo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: evalData.overallScore,
            allPassed: evalData.passed,
            problemId: activeProblem.id,
            problemTitle: activeProblem.title,
            problemJson: JSON.stringify(activeProblem),
            userPrompt: promptText,
          }),
        });

        if (eloRes.ok) {
          const eloData = (await eloRes.json()) as {
            elo: number;
            eloChange: number;
            level: string;
            subLevel: number;
            problemsSolved: number;
            streak: number;
            passed: boolean;
            solvedProblems?: {
              userLevel: string;
              subLevel: number;
              problemTitle: string;
            }[];
          };
          setEloResult(eloData);
          setUserInfo((prev) =>
            prev
              ? {
                  ...prev,
                  elo: eloData.elo,
                  level: eloData.level,
                  subLevel: eloData.subLevel,
                  problemsSolved: eloData.problemsSolved,
                  streak: eloData.streak,
                  solvedProblems: eloData.solvedProblems,
                }
              : null,
          );
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: evalData.passed
              ? `Great job! Your prompt passed ${evalData.testCasesPassed}/${evalData.testCasesTotal} test cases with a score of ${evalData.overallScore}/100.`
              : `Your prompt scored ${evalData.overallScore}/100 and passed ${evalData.testCasesPassed}/${evalData.testCasesTotal} test cases. Review the feedback below to improve your prompt.`,
            user_type: normalizedUserInfo,
          },
        ]);
        return;
      }

      // Fallback: standard prompt analysis (no active problem)
      const response = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          user_type: {
            level: normalizedUserInfo.level,
            expertise: normalizedUserInfo.expertise,
            learning_style: normalizedUserInfo.learningStyle,
            goals: normalizedUserInfo.goals,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        toast.error(errorData.error ?? "Failed to analyze prompt");
        throw new Error(errorData.error ?? "Failed to fetch response");
      }

      const data = (await response.json()) as PromptAnalysis;
      setPromptAnalysis(data);

      const numericScore =
        data.score ??
        (data.label === "STRONG" ? 92 : data.label === "MODERATE" ? 68 : 44);
      setScore(numericScore);

      // ELO is only awarded for problem-solving with test cases, not casual analysis

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${data.motivation}\n\n${data.feedback}`,
          user_type: normalizedUserInfo,
        },
      ]);
    } catch (error) {
      console.error("Analysis error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not analyze that prompt right now. Try again in a moment.",
          user_type: normalizedUserInfo,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const _handleReportEvaluation = async () => {
    if (!promptEvaluation?.submissionId || isReporting) return;

    setIsReporting(true);
    try {
      const response = await fetch("/api/report-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: promptEvaluation.submissionId,
          reason: "User flagged the AI grading as inaccurate.",
        }),
      });

      if (response.ok) {
        toast.success("Feedback submitted. Thank you!");
      } else {
        toast.error("Failed to submit feedback.");
      }
    } catch {
      toast.error("Failed to submit feedback.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleNextProblem = async () => {
    if (!normalizedUserInfo) return;

    // Clear all current state
    setPromptAnalysis(null);
    setPromptEvaluation(null);
    setScore(null);
    setEloResult(null);
    setMessages([]);
    setProblemIndex((prev) => prev + 1);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: normalizedUserInfo.level,
          subLevel: normalizedUserInfo.subLevel,
          expertise: normalizedUserInfo.expertise,
          application: normalizedUserInfo.application,
          learning_style: normalizedUserInfo.learningStyle,
          goals: normalizedUserInfo.goals,
          seed: Date.now(), // Add randomness to avoid duplicate AI responses
        }),
      });

      if (!response.ok) {
        toast.error("Failed to generate a new problem. Please try again.");
        return;
      }

      const data = (await response.json()) as { problems?: PracticeProblem[] };
      const problems = data.problems;
      if (problems && problems.length > 0) {
        setActiveProblem(problems[0] ?? null);
      }
    } catch (error) {
      console.error("Error fetching next problem:", error);
      toast.error("Something went wrong while generating the next challenge.");
    } finally {
      setIsGenerating(false);
    }
  };

  const passed =
    promptEvaluation !== null
      ? promptEvaluation.testCasesPassed === promptEvaluation.testCasesTotal
      : score !== null && score >= 90;

  // Loading state — profile not loaded or generating problem
  if (!activeProblem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center text-center">
          {/* Simple, clean circle spinner */}
          <div className="relative mb-6 h-12 w-12">
            <CircleNotch className="h-12 w-12 animate-spin text-primary" />
          </div>
          <div className="text-xl font-semibold tracking-tight text-foreground">
            {isGenerating
              ? "Crafting your challenge..."
              : "Loading your challenge..."}
          </div>
          <div className="mt-2 text-sm text-muted-foreground/60">
            {isGenerating
              ? "Personalizing a problem for your level"
              : "Setting up your workspace"}
          </div>
        </div>
      </div>
    );
  }

  const example = activeProblem.examples[0];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left: Sidebar */}
      <MainSidebar
        userLevel={normalizedUserInfo?.level}
        subLevel={normalizedUserInfo?.subLevel}
        activeProblemTitle={activeProblem?.title}
        solvedProblems={normalizedUserInfo?.solvedProblems}
        isExpanded={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content area — top padding reserves space for the fixed top bar */}
      <div
        className="flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-in-out"
        style={{ paddingTop: "48px" }}
      >
        {/* Top bar - viewport-spanning so its center is always the viewport
            center, invariant to sidebar width. */}
        <div
          className="fixed top-0 right-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background px-6 transition-[left] duration-300 ease-in-out md:px-8"
          style={{ left: sidebarOpen ? "260px" : "68px" }}
        >
          <div className="flex items-center gap-6">
            {normalizedUserInfo && (
              <>
                {/* Level */}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-semibold uppercase text-foreground">
                    {normalizedUserInfo.level}
                  </span>
                </div>

                {/* Problem Progress */}
                <div className="flex items-center gap-2 border-l border-border pl-6">
                  <Target className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground">
                    Problem{" "}
                    <span className="font-bold text-foreground">
                      {problemIndex}
                    </span>
                    <span className="text-muted-foreground/60">/5</span>
                  </span>
                </div>

                {/* Hint Button */}
                {activeProblem.hint && (
                  <div className="flex items-center gap-2 border-l border-border pl-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHint((prev) => !prev)}
                      className={`h-7 gap-1.5 px-2.5 text-xs font-semibold transition-colors ${
                        showHint
                          ? "text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-primary" weight="regular" />
                      <span>Hint</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Submit actions are rendered as a separate viewport-fixed element below */}

          <div className="flex items-center gap-5">
            {/* Streak Status */}
            {normalizedUserInfo && (
              <div className="flex items-center gap-1.5">
                <Fire
                  size={18}
                  weight={normalizedUserInfo.streak > 0 ? "fill" : "regular"}
                  className={normalizedUserInfo.streak > 0 ? "text-[#ff8a3d]" : "text-muted-foreground/30"}
                />
                <span
                  className={`font-mono text-sm font-bold ${
                    normalizedUserInfo.streak > 0 ? "text-[#ff8a3d]" : "text-muted-foreground/45"
                  }`}
                >
                  {normalizedUserInfo.streak}
                </span>
              </div>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-background transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {session?.user?.image ? (
                    <Image
                      className="h-full w-full object-cover"
                      alt="user image"
                      src={session.user.image}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <span className="text-xs font-bold text-foreground uppercase">
                      {userInitial}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-border bg-[#141414] text-foreground shadow-lg shadow-black/80"
              >
                <DropdownMenuItem className="cursor-pointer hover:bg-secondary focus:bg-secondary">
                  <Link href="/profile?from=dashboard" className="w-full">
                    View profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Viewport-centered submit actions — fixed to 50vw so sidebar
            open/close doesn't shift it */}
        <div
          className="fixed top-0 z-40 flex h-12 items-center gap-2 pointer-events-none"
          style={{ left: "50vw", transform: "translateX(-50%)" }}
        >
          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              onClick={() => void handleSendMessage()}
              disabled={isTyping || !inputValue.trim()}
              className="h-[30px] rounded-[4px] bg-primary/90 px-3 text-sm font-semibold text-[#111] hover:bg-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isTyping ? (
                <>
                  <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                  Evaluating…
                </>
              ) : (
                <>
                  <Play weight="fill" className="h-3.5 w-3.5" />
                  Submit
                </>
              )}
            </Button>
            {passed && (
              <Button
                onClick={() => void handleNextProblem()}
                className="h-[30px] rounded-[4px] border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
              >
                Next Problem
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Two-column layout: Problem | Editor */}
        <div className="flex min-w-0 flex-1 overflow-hidden">
          {/* Center: Problem Description Panel */}
          <div className="flex min-w-0 flex-1 flex-col border-r border-border">
            <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6">
              {/* Problem header - Technical style */}
              <div className="mb-6 border-b border-border/50 pb-6">
                <h2 className="text-2xl font-semibold leading-tight text-foreground">
                  {activeProblem.title}
                </h2>
                {activeProblem.tags && activeProblem.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {activeProblem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-sm border border-border/60 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] lowercase tracking-wide text-muted-foreground/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Problem Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  Problem Description
                </h3>
                <div className="whitespace-pre-line text-base leading-7 text-muted-foreground">
                  {activeProblem.description}
                </div>
              </div>

              {/* Goal */}
              {activeProblem.goal && (
                <div className="mb-6 rounded border border-primary/30 bg-primary/[0.03] p-3 shadow-sm shadow-primary/5">
                  <div className="mb-2 text-sm font-semibold text-primary">
                    Your Goal
                  </div>
                  <p className="text-sm leading-6 text-foreground">
                    {activeProblem.goal}
                  </p>
                </div>
              )}

              {/* Hint Display (inline above example, light orange text) */}
              {activeProblem.hint && showHint && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-sm leading-relaxed text-primary/80 whitespace-pre-line">
                    {activeProblem.hint}
                  </p>
                </div>
              )}

              {/* Example */}
              {example && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-foreground">
                    Example {activeProblem.examples.length > 1 ? "1" : ""}
                  </h3>
                  <div className="rounded border border-border bg-card p-5 shadow-sm shadow-black/45">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground/60">
                          Input
                        </div>
                        <div className="mt-1.5 rounded border border-border/40 bg-background px-4 py-3 text-sm text-foreground whitespace-pre-wrap">
                          {formatExampleInput(example.input)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground/60">
                          Expected Output
                        </div>
                        <div className="mt-1.5 rounded border border-border/40 bg-background px-4 py-3 text-sm text-foreground whitespace-pre-wrap">
                          {example.output}
                        </div>
                      </div>
                      {example.explanation && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground/60">
                          <span className="shrink-0">💡</span>
                          <span>{example.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}



              {/* Pro Tips */}
              {activeProblem.proTips?.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-foreground">
                    Pro Tips
                  </h3>
                  <div>
                    <div className="space-y-2">
                      {activeProblem.proTips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-md px-4 py-3 text-sm text-muted-foreground"
                        >
                          <span className="shrink-0 text-primary">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right: Prompt Editor + Analysis Panel */}
          <div className="flex w-[600px] shrink-0 flex-col h-full overflow-hidden bg-[#0e0e0e]">
            {/* Editor Workspace Panel */}
            <div className="h-[46%] min-h-[300px] flex flex-col border-b border-border bg-[#111111]">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Editor
                  </span>
                </div>
                <div>
                  {promptAnalysis?.improved_prompts?.[0] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-md border border-border bg-secondary/30 px-2.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:bg-secondary hover:text-foreground"
                      onClick={() =>
                        setInputValue(
                          promptAnalysis.improved_prompts?.[0]?.prompt ??
                            "",
                        )
                      }
                    >
                      <Sparkle className="mr-1 h-2.5 w-2.5 text-primary" />
                      Apply Suggestion
                    </Button>
                  )}
                </div>
              </div>

              {/* Textarea container */}
              <div className="flex-1 min-h-0 w-full overflow-hidden bg-[#0a0a0a]">
                <Textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Write your prompt here..."
                  className="h-full w-full rounded-none resize-none bg-transparent p-5 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      void handleSendMessage();
                    }
                  }}
                />
              </div>
            </div>

            {/* Execution Console Panel */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-y-auto no-scrollbar">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-[#0a0a0a]/95 backdrop-blur px-5 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Execution Console
                  </span>
                </div>
                {promptEvaluation && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold">
                    {promptEvaluation.testCasesPassed}/{promptEvaluation.testCasesTotal} Scenarios Passed
                  </span>
                )}
              </div>

              {/* Console Body */}
              <div className="flex-1 p-5 space-y-5">
                {/* 1. IDLE STATE */}
                {score === null && !isTyping && (
                  <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground/60">
                    <Sparkle className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-semibold text-foreground/80">Console Ready</p>
                    <p className="text-xs text-muted-foreground/50 mt-1 max-w-[280px]">
                      Write your prompt above and click Submit to evaluate it.
                    </p>
                  </div>
                )}

                {/* 2. RUNNING STATE */}
                {isTyping && (
                  <div className="flex flex-col items-center justify-center text-center py-10 text-primary/80">
                    <CircleNotch className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-sm font-semibold text-foreground/80">Evaluating your prompt...</p>
                    <p className="text-xs text-muted-foreground/50 mt-1 max-w-[280px]">
                      Running your draft against evaluation scenarios. This might take a few seconds.
                    </p>
                  </div>
                )}

                {/* 3. EVALUATION RESULTS SUMMARY */}
                {score !== null && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Score Summary Panel */}
                    <div className={`rounded border p-4 bg-card ${passed ? "border-primary/20 shadow-sm shadow-primary/5" : "border-border"}`}>
                      <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${passed ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                          <span className={`font-sans text-[10px] font-bold uppercase tracking-wider ${passed ? "text-primary" : "text-muted-foreground"}`}>
                            {passed ? "Passed" : "Needs Work"}
                          </span>
                        </div>
                        <span className="font-sans text-[9px] text-muted-foreground/60 uppercase">
                          {activeProblem.testCases.length} Scenarios
                        </span>
                      </div>

                      <div className="flex items-center gap-8">
                        <div>
                          <div className="font-sans text-[9px] uppercase tracking-wider text-muted-foreground/60">
                            Result Score
                          </div>
                          <div className={`font-sans text-xl font-bold mt-0.5 ${passed ? "text-primary" : "text-muted-foreground"}`}>
                            {score}
                            <span className="text-[11px] font-normal text-muted-foreground/40">/100</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Test cases list & debugging compiler log panels */}
                    <div className="space-y-2">
                      <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">
                        Evaluation Scenarios
                      </div>
                      {activeProblem.testCases.map((tc, idx) => {
                        const result = promptEvaluation?.results[idx];
                        const isTestCasePassed = result?.passed ?? false;

                        return (
                          <div
                            key={idx}
                            className="rounded border border-border bg-card overflow-hidden"
                          >
                            {/* Scenario Header */}
                            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/30 bg-[#141414]">
                              <div className="flex items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${isTestCasePassed ? "bg-primary" : "bg-red-400"}`} />
                                <span className="font-sans text-xs text-muted-foreground">
                                  {tc.description || `Scenario ${idx + 1}`}
                                </span>
                              </div>
                              <span className={`font-mono text-xs font-bold ${isTestCasePassed ? "text-primary" : "text-red-400"}`}>
                                {result ? `${result.score}%` : "--"}
                              </span>
                            </div>

                            {/* Compiler-style logs inside scenario details (only if failed) */}
                            {result && !isTestCasePassed && (
                              <div className="p-4 font-sans text-[13px] leading-relaxed text-muted-foreground bg-[#0d0d0d]">
                                {result.missing_elements && result.missing_elements.length > 0 && (
                                  <div className="text-red-400 font-semibold text-xs uppercase tracking-wider">
                                    Fixes Needed:
                                    <ul className="list-disc pl-4 mt-1.5 space-y-1 font-normal text-muted-foreground/90 lowercase text-[12px]">
                                      {result.missing_elements.slice(0, 4).map((el, i) => (
                                        <li key={i}>{el}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Coach tips */}
                    {promptAnalysis?.learning_points && promptAnalysis.learning_points.length > 0 && (
                      <div className="rounded border border-border bg-card">
                        <div className="border-b border-border/50 px-4 py-2 bg-[#141414]">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-foreground">
                            Coach Tips
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          {promptAnalysis.learning_points
                            .slice(0, 4)
                            .map((point, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 border-l-2 border-primary/45 bg-[#111111] px-3 py-2 animate-in fade-in"
                              >
                                <span className="font-mono text-[11px] text-foreground">
                                  {point}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
