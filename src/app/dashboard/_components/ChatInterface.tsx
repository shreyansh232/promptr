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
import MainSidebar from "./Sidebar";

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
}

type PracticeProblem = {
  id: number;
  title: string;
  difficulty: string;
  description: string;
  goal: string;
  examples: { input: string; output: string; explanation: string }[];
  testCases: { input: string; expectedOutput: string; description: string }[];
  proTips: string[];
};

const PASS_THRESHOLD = 90;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

    const newUserMessage: Message = {
      role: "user",
      content: inputValue.trim(),
      user_type: normalizedUserInfo,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);
    setScore(null);
    setEloResult(null);

    try {
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

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = (await response.json()) as PromptAnalysis;
      setPromptAnalysis(data);

      // Use real score from API, fallback to label-based estimation
      const numericScore =
        data.score ??
        (data.label === "STRONG" ? 92 : data.label === "MODERATE" ? 68 : 44);
      setScore(numericScore);

      // Update ELO
      const eloRes = await fetch("/api/user/elo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: numericScore }),
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

  const handleNextProblem = async () => {
    if (!normalizedUserInfo) return;
    setPromptAnalysis(null);
    setScore(null);
    setEloResult(null);
    setMessages([]);
    setProblemIndex((prev) => prev + 1);

    // Try cache first
    const cached = consumeCachedProblem(normalizedUserInfo);
    if (cached) {
      setActiveProblem(cached);
      return;
    }

    // Fetch new problems from API
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: normalizedUserInfo.level,
          expertise: normalizedUserInfo.expertise,
          learning_style: normalizedUserInfo.learningStyle,
          goals: normalizedUserInfo.goals,
        }),
      });

      if (!response.ok) return;
      const data = await response.json();
      if (data.problems?.length > 0) {
        saveProblemsToCache(data.problems, normalizedUserInfo);
        setActiveProblem(data.problems[0] ?? null);
      }
    } catch (error) {
      console.error("Error fetching next problem:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const passed = score !== null && score >= PASS_THRESHOLD;

  // Loading state — profile not loaded or generating problem
  if (!activeProblem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[#ff8a3d] border-t-[#ff8a3d]" />
            <div
              className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-[#ff8a3d]/50"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
            <div className="absolute inset-4 animate-pulse rounded-full bg-[#ff8a3d]/20" />
          </div>
          <div className="mt-6 text-lg font-medium text-[#f5efe6]">
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
            <div className="flex-1 overflow-y-auto px-6 py-6">
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
                {/* Score result */}
                {score !== null && eloResult && (
                  <div
                    className={`mb-6 rounded-xl border p-5 ${
                      passed
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {passed ? (
                          <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                        ) : (
                          <XCircleIcon className="h-6 w-6 text-red-400" />
                        )}
                        <div>
                          <div
                            className={`text-xl font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {passed ? "Accepted" : "Not Accepted"}
                          </div>
                          <div className="text-sm text-[#a0978a]">
                            Score: {score}/100 · Pass threshold:{" "}
                            {PASS_THRESHOLD}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${eloResult.eloChange > 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {eloResult.eloChange > 0 ? "+" : ""}
                          {eloResult.eloChange}
                        </div>
                        <div className="text-xs text-[#6a6255]">
                          ELO → {eloResult.elo}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        onClick={() => void handleNextProblem()}
                        className="rounded-full bg-[#ff8a3d] px-5 text-sm text-[#111111] hover:bg-[#ff9b5b]"
                      >
                        Next Problem
                      </Button>
                      {!passed && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setPromptAnalysis(null);
                            setScore(null);
                            setEloResult(null);
                            setMessages([]);
                          }}
                          className="rounded-full border border-white/10 text-[#a0978a] hover:bg-white/10"
                        >
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Prompt input */}
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-base text-[#a0978a]">
                      Write your prompt draft below.
                    </div>
                    {promptAnalysis?.improved_prompts?.[0] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-white/10 text-[#a0978a] hover:bg-white/10 hover:text-[#f5efe6]"
                        onClick={() =>
                          setInputValue(
                            promptAnalysis.improved_prompts?.[0]?.prompt ?? "",
                          )
                        }
                      >
                        <SparklesIcon className="mr-1.5 h-3.5 w-3.5" />
                        Use suggestion
                      </Button>
                    )}
                  </div>

                  <Textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Write your prompt here..."
                    className="min-h-[200px] rounded-xl border-white/10 bg-[#111111] px-5 py-4 text-base leading-7 text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-0 focus-visible:ring-offset-0"
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        (event.metaKey || event.ctrlKey)
                      ) {
                        void handleSendMessage();
                      }
                    }}
                  />

                  <div className="mt-4 flex items-center justify-between">
                    <p>
                    </p>
                    <Button
                      onClick={() => void handleSendMessage()}
                      disabled={isTyping || !inputValue.trim()}
                      className="rounded-full bg-[#ff8a3d] px-6 text-base text-[#111111] hover:bg-[#ff9b5b]"
                    >
                      <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                      {isTyping ? "Analyzing..." : "Submit"}
                    </Button>
                  </div>
                </div>

                {/* Analysis results */}
                {promptAnalysis && (
                  <div className="space-y-6">
                    {/* Coach feedback */}
                    <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
                      <div className="text-lg font-medium text-[#f5efe6]">
                        Coach Feedback
                      </div>
                      <p className="mt-3 text-base leading-7 text-[#a0978a]">
                        {promptAnalysis.feedback}
                      </p>
                      <p className="mt-3 text-base leading-7 text-[#d9d1c7]">
                        {promptAnalysis.motivation}
                      </p>
                      {promptAnalysis.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {promptAnalysis.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-[#6a6255]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Learning points + rewrites */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                        <div className="mb-3 flex items-center gap-2 text-[#f5efe6]">
                          <BookOpenIcon className="h-4 w-4" />
                          <span className="text-base font-medium">
                            What to tweak next
                          </span>
                        </div>
                        <div className="space-y-2">
                          {promptAnalysis.learning_points.map((point) => (
                            <div
                              key={point}
                              className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 text-base text-[#a0978a]"
                            >
                              {point}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                        <div className="mb-3 flex items-center gap-2 text-[#f5efe6]">
                          <LightBulbIcon className="h-4 w-4" />
                          <span className="text-base font-medium">
                            Suggested rewrites
                          </span>
                        </div>
                        <div className="space-y-2">
                          {promptAnalysis.improved_prompts?.map(
                            (suggestion) => (
                              <button
                                key={suggestion.title}
                                onClick={() => setInputValue(suggestion.prompt)}
                                className="w-full rounded-lg border border-white/5 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06]"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-medium text-[#f5efe6]">
                                    {suggestion.title}
                                  </span>
                                  <DocumentDuplicateIcon className="h-4 w-4 text-[#6a6255]" />
                                </div>
                                <p className="mt-2 text-sm leading-6 text-[#a0978a]">
                                  {suggestion.prompt}
                                </p>
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
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
