"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XCircleIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { ArrowRight, Loader2 } from "lucide-react";
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

const PROBLEM_CACHE_KEY = "promptr_problems";
const PROBLEM_CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

interface CachedProblems {
  problems: PracticeProblem[];
  profileHash: string;
  timestamp: number;
  currentIndex: number;
}

function getProfileHash(info: UserInfo): string {
  return `${info.level}-${info.expertise}-${info.learningStyle}-${info.goals.join(",")}`;
}

function getCachedProblems(info: UserInfo): PracticeProblem[] | null {
  try {
    const raw = localStorage.getItem(PROBLEM_CACHE_KEY);
    if (!raw) return null;

    const cached: CachedProblems = JSON.parse(raw);
    const isExpired = Date.now() - cached.timestamp > PROBLEM_CACHE_TTL;
    const isStaleProfile = cached.profileHash !== getProfileHash(info);

    if (isExpired || isStaleProfile) {
      localStorage.removeItem(PROBLEM_CACHE_KEY);
      return null;
    }

    if (cached.problems?.length > 0) {
      return cached.problems;
    }

    return null;
  } catch {
    return null;
  }
}

function saveProblemsToCache(problems: PracticeProblem[], info: UserInfo) {
  try {
    const cached: CachedProblems = {
      problems,
      profileHash: getProfileHash(info),
      timestamp: Date.now(),
      currentIndex: 0,
    };
    localStorage.setItem(PROBLEM_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // ignore
  }
}

function consumeCachedProblem(info: UserInfo): PracticeProblem | null {
  try {
    const raw = localStorage.getItem(PROBLEM_CACHE_KEY);
    if (!raw) return null;

    const cached: CachedProblems = JSON.parse(raw);
    const nextIndex = cached.currentIndex + 1;

    if (nextIndex >= cached.problems.length) {
      localStorage.removeItem(PROBLEM_CACHE_KEY);
      return null;
    }

    const problem = cached.problems[nextIndex] ?? null;
    cached.currentIndex = nextIndex;
    localStorage.setItem(PROBLEM_CACHE_KEY, JSON.stringify(cached));
    return problem;
  } catch {
    return null;
  }
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-red-400",
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
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeProblem, setActiveProblem] = useState<PracticeProblem | null>(
    null,
  );
  const [score, setScore] = useState<number | null>(null);
  const [eloResult, setEloResult] = useState<{
    elo: number;
    eloChange: number;
    passed: boolean;
  } | null>(null);
  const [problemIndex, setProblemIndex] = useState(1);
  const [isReporting, setIsReporting] = useState(false);

  const { data: session } = useSession();
  const userInitial = session?.user?.name?.[0];
  const router = useRouter();

  const normalizedUserInfo = useMemo(() => userInfo, [userInfo]);

  // Fetch problems — defined as useCallback so it's accessible everywhere
  const fetchProblems = useCallback(async () => {
    if (!normalizedUserInfo) return;

    // Try cache first
    const cached = getCachedProblems(normalizedUserInfo);
    if (cached) {
      setActiveProblem(cached[0] ?? null);
      setIsLoading(false);
      setIsGenerating(false);
      return;
    }

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
          expertise: normalizedUserInfo.expertise,
          application: normalizedUserInfo.application,
          learning_style: normalizedUserInfo.learningStyle,
          goals: normalizedUserInfo.goals,
        }),
        signal: controller.signal,
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.problems?.length > 0) {
        saveProblemsToCache(data.problems, normalizedUserInfo);
        setActiveProblem(data.problems[0] ?? null);
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !normalizedUserInfo || isTyping) return;

    const promptText = inputValue.trim();
    const newUserMessage: Message = {
      role: "user",
      content: promptText,
      user_type: normalizedUserInfo,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
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
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!evalResponse.ok) {
          const errorData = await evalResponse.json();
          toast.error(errorData.error || "Failed to evaluate prompt");
          throw new Error(errorData.error || "Failed to evaluate prompt");
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

        // Update ELO based on evaluation score
        const eloRes = await fetch("/api/user/elo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: evalData.overallScore,
            allPassed: evalData.testCasesPassed === evalData.testCasesTotal,
            problemId: activeProblem.id,
          }),
        });

        if (eloRes.ok) {
          const eloData = await eloRes.json();
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
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to analyze prompt");
        throw new Error(errorData.error || "Failed to fetch response");
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

  const handleReportEvaluation = async () => {
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

    // Force clear problem cache to get a NEW one from AI
    localStorage.removeItem(PROBLEM_CACHE_KEY);

    try {
      const response = await fetch("/api/generate-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: normalizedUserInfo.level,
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

      const data = await response.json();
      if (data.problems?.length > 0) {
        saveProblemsToCache(data.problems, normalizedUserInfo);
        setActiveProblem(data.problems[0] ?? null);
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
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="flex flex-col items-center text-center">
          {/* Simple, clean circle spinner */}
          <div className="relative mb-6 h-12 w-12">
            <Loader2 className="h-12 w-12 animate-spin text-[#ff8a3d]" />
          </div>
          <div className="text-xl font-semibold tracking-tight text-[#f5efe6]">
            {isGenerating
              ? "Crafting your challenge..."
              : "Loading your challenge..."}
          </div>
          <div className="mt-2 text-sm text-[#6a6255]">
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
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
      {/* Left: Sidebar */}
      <MainSidebar
        userLevel={normalizedUserInfo?.level}
        isExpanded={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar - spans full width from sidebar to right edge */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3 md:px-8">
          <div className="flex items-center gap-4">
            {normalizedUserInfo && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="text-sm font-bold text-[#ff8a3d]">
                    {normalizedUserInfo.elo}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#6a6255]">
                    Rating
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="text-sm font-semibold text-[#f5efe6]">
                    {normalizedUserInfo.level.charAt(0).toUpperCase() +
                      normalizedUserInfo.level.slice(1)}
                  </span>
                  <span className="text-xs text-[#6a6255]">
                    Problem {problemIndex}/5
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#ff8a3d]/10 px-3 py-1.5">
                  <span className="text-sm font-bold text-[#ff8a3d]">
                    ⚡️ {normalizedUserInfo.credits}
                  </span>
                </div>
                {normalizedUserInfo.streak > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <span className="text-sm text-[#ff8a3d]">🔥</span>
                    <span className="text-sm text-[#f5efe6]">
                      {normalizedUserInfo.streak}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/10 bg-white/5 p-0 hover:bg-white/10"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt="User Avatar" />
                    <span className="flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-[#f5efe6]">
                      {userInitial?.toUpperCase()}
                    </span>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-white/10 bg-[#1a1a1a]"
              >
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="text-[#f5efe6] hover:bg-white/10"
                >
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-400 hover:bg-white/10"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Two-column layout: Problem | Editor */}
        <div className="flex min-w-0 flex-1 overflow-hidden">
          {/* Center: Problem Description Panel */}
          <div className="flex min-w-0 flex-1 flex-col border-r border-white/10">
            <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6">
              {/* Problem header */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-[#6a6255]">
                    Problem
                  </div>
                  <div
                    className={`text-sm font-semibold ${DIFFICULTY_COLORS[activeProblem.difficulty] ?? "text-[#6a6255]"}`}
                  >
                    {activeProblem.difficulty}
                  </div>
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#f5efe6]">
                  {activeProblem.title}
                </h2>
              </div>

              {/* Problem Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-[#f5efe6]">
                  Problem Description
                </h3>
                <div className="whitespace-pre-line text-base leading-7 text-[#a0978a]">
                  {activeProblem.description}
                </div>
              </div>

              {/* Goal */}
              {activeProblem.goal && (
                <div className="mb-6 rounded-xl border border-[#ff8a3d]/20 bg-[#ff8a3d]/5 p-5">
                  <div className="mb-2 text-sm font-semibold text-[#ff8a3d]">
                    Your Goal
                  </div>
                  <p className="text-sm leading-6 text-[#f5efe6]">
                    {activeProblem.goal}
                  </p>
                </div>
              )}

              {/* Example */}
              {example && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-[#f5efe6]">
                    Example {activeProblem.examples.length > 1 ? "1" : ""}
                  </h3>
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[#6a6255]">
                          Input
                        </div>
                        <div className="mt-1 rounded-lg bg-[#0d0d0d] px-4 py-3 text-sm text-[#d9d1c7]">
                          {example.input}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[#6a6255]">
                          Expected Output
                        </div>
                        <div className="mt-1 rounded-lg bg-[#0d0d0d] px-4 py-3 text-sm text-[#d9d1c7]">
                          {example.output}
                        </div>
                      </div>
                      {example.explanation && (
                        <div className="flex items-start gap-2 text-sm text-[#6a6255]">
                          <span className="shrink-0">💡</span>
                          <span>{example.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Test Cases */}
              {activeProblem.testCases?.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-[#f5efe6]">
                    Test Cases
                  </h3>
                  <div className="space-y-3">
                    {activeProblem.testCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-[#111111] p-5"
                      >
                        <div className="mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#ff8a3d]">
                            Test Case {idx + 1}
                          </span>
                          <div className="mt-1 text-xs text-[#6a6255]">
                            {tc.description}
                          </div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3">
                          <div className="text-xs uppercase tracking-wider text-[#6a6255]">
                            Input
                          </div>
                          <p className="mt-2 text-sm text-[#d9d1c7]">
                            {tc.input}
                          </p>
                        </div>
                        {tc.expectedOutput && (
                          <div className="mt-3 rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3">
                            <div className="text-xs uppercase tracking-wider text-[#6a6255]">
                              Expected Output
                            </div>
                            <p className="mt-2 text-sm text-[#d9d1c7]">
                              {tc.expectedOutput}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Tips */}
              {activeProblem.proTips?.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-[#f5efe6]">
                    Pro Tips
                  </h3>
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                    <div className="space-y-2">
                      {activeProblem.proTips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-[#a0978a]"
                        >
                          <span className="shrink-0 text-[#ff8a3d]">•</span>
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
          <div className="flex w-[600px] shrink-0 flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-5">
                {/* Prompt input */}
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-medium uppercase tracking-wider text-[#6a6255]">
                      Editor
                    </div>
                    <div className="flex gap-2">
                      {promptAnalysis?.improved_prompts?.[0] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-[#a0978a] hover:bg-white/10 hover:text-[#f5efe6]"
                          onClick={() =>
                            setInputValue(
                              promptAnalysis.improved_prompts?.[0]?.prompt ??
                                "",
                            )
                          }
                        >
                          <SparklesIcon className="mr-1.5 h-3 w-3" />
                          Apply Suggestion
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="group relative">
                    <Textarea
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      placeholder="Enter your prompt draft..."
                      className="min-h-[220px] resize-none rounded-xl border-white/10 bg-[#0d0d0d] font-mono text-base leading-relaxed text-[#f5efe6] placeholder:text-[#3a352d] focus-visible:ring-1 focus-visible:ring-[#ff8a3d]/30"
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          (event.metaKey || event.ctrlKey)
                        ) {
                          void handleSendMessage();
                        }
                      }}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#4a453d]">
                        ⌘ + Enter to run
                      </span>
                      <Button
                        onClick={() => void handleSendMessage()}
                        disabled={isTyping || !inputValue.trim()}
                        className="h-10 rounded-lg bg-[#ff8a3d] px-5 text-sm font-semibold text-[#111111] transition-all hover:bg-[#ff9b5b] hover:shadow-[0_0_20px_rgba(255,138,61,0.2)] disabled:opacity-50"
                      >
                        {isTyping ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Running...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <PaperAirplaneIcon className="h-4 w-4" />
                            <span>Run Tests</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Score & ELO Result */}
                {score !== null && (
                  <div
                    className={`mb-8 flex items-center justify-between rounded-xl border p-5 ${
                      passed
                        ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                        : "border-red-500/20 bg-red-500/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                          passed
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {score}
                      </div>
                      <div>
                        <div
                          className={`text-sm font-bold uppercase tracking-widest ${
                            passed ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {passed ? "Accepted" : "Needs Tweak"}
                        </div>
                        <div className="text-xs text-[#6a6255]">
                          Overall score from {activeProblem.testCases.length}{" "}
                          scenarios
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div
                          className={`font-mono text-lg font-bold ${
                            (eloResult?.eloChange ?? 0) >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {eloResult ? (
                            <>
                              {eloResult.eloChange >= 0 ? "+" : ""}
                              {eloResult.eloChange}
                            </>
                          ) : (
                            "--"
                          )}
                        </div>
                        <div className="text-[10px] uppercase tracking-tighter text-[#6a6255]">
                          ELO RATING
                        </div>
                      </div>
                      <Button
                        onClick={() => void handleNextProblem()}
                        className={`h-10 rounded-lg px-6 text-xs font-bold transition-all ${
                          passed
                            ? "bg-[#ff8a3d] text-[#111111] hover:bg-[#ff9b5b] hover:shadow-[0_0_20px_rgba(255,138,61,0.2)]"
                            : "bg-white/5 text-[#f5efe6] hover:bg-white/10"
                        }`}
                      >
                        Next Problem
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Visual Test Runner */}
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-medium uppercase tracking-wider text-[#6a6255]">
                      Test Execution
                    </div>
                    {promptEvaluation && (
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#ff8a3d]">
                        {promptEvaluation.testCasesPassed}/
                        {promptEvaluation.testCasesTotal} Passed
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {activeProblem.testCases.map((tc, idx) => {
                      const result = promptEvaluation?.results[idx];
                      const isPending = isTyping;

                      return (
                        <div
                          key={idx}
                          className="group rounded-xl border border-white/5 bg-[#111111]/50 p-4 transition-all hover:border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-[#ff8a3d]" />
                              ) : result ? (
                                result.passed ? (
                                  <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                                ) : (
                                  <XCircleIcon className="h-5 w-5 text-red-400" />
                                )
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-white/10" />
                              )}
                              <span className="font-mono text-sm text-[#a0978a]">
                                {tc.description || `Scenario ${idx + 1}`}
                              </span>
                            </div>
                            {!isPending && result && (
                              <span
                                className={`font-mono text-xs font-bold ${
                                  result.passed
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {result.score}%
                              </span>
                            )}
                          </div>

                          {result && !result.passed && (
                            <div className="mt-3 border-t border-white/5 pt-3">
                              <p className="text-xs leading-relaxed text-[#6a6255]">
                                {result.reasoning}
                              </p>
                              {result.missing_elements.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {result.missing_elements.map((el, i) => (
                                    <span
                                      key={i}
                                      className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400/80"
                                    >
                                      Missing: {el}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actionable Feedback (formerly coach feedback) */}
                {(promptAnalysis || promptEvaluation) && (
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <LightBulbIcon className="h-4 w-4 text-[#ff8a3d]" />
                      <span className="text-sm font-bold uppercase tracking-wider text-[#f5efe6]">
                        Quick Tweak
                      </span>
                    </div>

                    <p className="text-sm leading-7 text-[#a0978a]">
                      {promptAnalysis?.feedback ||
                        "Focus on the missing elements highlighted in the failed test cases to improve your score."}
                    </p>

                    {promptAnalysis?.learning_points && (
                      <div className="mt-4 space-y-2">
                        {promptAnalysis.learning_points
                          .slice(0, 2)
                          .map((point, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-lg bg-white/[0.03] p-3"
                            >
                              <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff8a3d]/40" />
                              <span className="text-xs text-[#d9d1c7]">
                                {point}
                              </span>
                            </div>
                          ))}
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
