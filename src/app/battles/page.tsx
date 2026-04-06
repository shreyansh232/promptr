"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Swords,
  Plus,
  Users,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import MainSidebar from "../dashboard/_components/Sidebar";
import { toast } from "react-hot-toast";

interface BattleTestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface Battle {
  id: string;
  title: string;
  description: string;
  goal: string;
  testCases: BattleTestCase[];
  status: "WAITING" | "ACTIVE" | "COMPLETED";
  createdBy: string;
  opponentId: string | null;
  participants: BattleParticipant[];
  createdAt: string;
  updatedAt: string;
}

interface BattleParticipant {
  userId: string;
  userName?: string;
  prompt?: string;
  tokenCount?: number;
  score?: number;
  passed?: boolean;
  result?: "WIN" | "LOSS" | "DRAW";
  eloChange?: number;
  submittedAt?: string;
}

type View = "lobby" | "create" | "waiting" | "battle" | "results";

/* ── Animation variants ─────────────────────────────────────────── */

const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97 },
};

/* ── Particle burst for "opponent found" celebration ────────────── */

function ParticleBurst() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (360 / 20) * i,
    distance: 60 + Math.random() * 80,
    size: 3 + Math.random() * 4,
    color: ["#ff8a3d", "#ff6b35", "#ffd700", "#ff4444", "#44ff88"][
      Math.floor(Math.random() * 5)
    ],
  }));

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.distance;
        const y = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              left: "50%",
              top: "50%",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
              x,
              y,
              opacity: 0,
              scale: 1,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */

export default function BattlesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>("lobby");
  const [battles, setBattles] = useState<Battle[]>([]);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [battleResults, setBattleResults] = useState<{
    winner: BattleParticipant | null;
    loser: BattleParticipant | null;
    isDraw: boolean;
  } | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch current user ID from API
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.id ?? null);
        }
      } catch {
        // ignore
      }
    }
    void fetchUser();
  }, []);

  // Create battle form
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    goal: "",
  });

  const fetchBattles = useCallback(async () => {
    try {
      const res = await fetch("/api/battles/list");
      if (res.ok) {
        const data = await res.json();
        setBattles(data.battles || []);

        // If we are in waiting/battle view, update the active battle from the list
        if (activeBattle) {
          const updated = (data.battles as Battle[]).find(
            (b) => b.id === activeBattle.id,
          );
          if (updated) {
            const prevStatus = activeBattle.status;
            setActiveBattle(updated);

            // Trigger celebration when opponent joins
            if (
              view === "waiting" &&
              prevStatus === "WAITING" &&
              updated.status === "ACTIVE"
            ) {
              setShowBurst(true);
              setTimeout(() => setShowBurst(false), 1200);
              toast.success("An opponent has joined! Battle is now ACTIVE.");
              setTimeout(() => setView("battle"), 1500);
            }

            if (
              updated.status === "COMPLETED" &&
              view !== "results" &&
              (view === "waiting" || view === "battle")
            ) {
              const participants = updated.participants || [];
              const winner =
                participants.find((p) => p.result === "WIN") || null;
              const loser =
                participants.find((p) => p.result === "LOSS") || null;
              const isDraw = participants.some((p) => p.result === "DRAW");
              setBattleResults({ winner, loser, isDraw });
              setView("results");
              toast.success("Battle completed! View results.");
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, [activeBattle, view]);

  useEffect(() => {
    void fetchBattles();

    // Set up polling for lobby and waiting states
    pollInterval.current = setInterval(() => {
      void fetchBattles();
    }, 5000);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [fetchBattles]);

  const handleCreateBattle = async () => {
    if (!createForm.title.trim() || !createForm.description.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Generate dynamic goal and test cases first
      const genRes = await fetch("/api/battles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
        }),
      });

      if (!genRes.ok) {
        throw new Error("Failed to generate battle content");
      }

      const genData = await genRes.json();

      // 2. Create the battle with generated content
      const res = await fetch("/api/battles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          goal: genData.goal,
          testCases: genData.testCases,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveBattle(data.battle);
        setView("waiting");
        toast.success("Battle created! Waiting for an opponent...");
        void fetchBattles();
      }
    } catch (error) {
      console.error("Create battle error:", error);
      toast.error("Failed to create battle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinBattle = async (battleId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/battles/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveBattle(data.battle);
        setView("battle");
        toast.success("Joined the battle! Good luck.");
        void fetchBattles();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to join battle.");
      }
    } catch {
      toast.error("Failed to join battle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBattle = async (battleId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/battles/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId }),
      });

      if (res.ok) {
        toast.success("Battle deleted.");
        if (activeBattle?.id === battleId) {
          setActiveBattle(null);
          setView("lobby");
        }
        void fetchBattles();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete battle.");
      }
    } catch {
      toast.error("Failed to delete battle.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleForfeitBattle = (battleId: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-[#f5efe6]">
            Forfeit this battle? You'll lose 15 ELO and your opponent will win.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full border border-white/10 text-xs text-[#a0978a] hover:bg-white/5 hover:text-[#f5efe6]"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-full bg-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/30"
              onClick={async () => {
                toast.dismiss(t.id);
                await performForfeit(battleId);
              }}
            >
              Forfeit
            </Button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: "top-center",
        style: {
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "16px",
          borderRadius: "12px",
        },
      },
    );
  };

  const performForfeit = async (battleId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/battles/forfeit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleId }),
      });

      if (res.ok) {
        toast.success("Battle forfeited.");
        void fetchBattles();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to forfeit battle.");
      }
    } catch {
      toast.error("Failed to forfeit battle.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitPrompt = async () => {
    if (!promptInput.trim() || !activeBattle) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/battles/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: activeBattle.id,
          prompt: promptInput.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "completed") {
          setActiveBattle(data.battle);
          // Determine results
          const participants = data.battle.participants || [];
          const winner =
            participants.find((p: BattleParticipant) => p.result === "WIN") ||
            null;
          const loser =
            participants.find((p: BattleParticipant) => p.result === "LOSS") ||
            null;
          const isDraw = participants.some(
            (p: BattleParticipant) => p.result === "DRAW",
          );
          setBattleResults({ winner, loser, isDraw });
          setView("results");
          toast.success("Battle evaluation complete!");
        } else {
          setView("waiting");
          toast.success("Prompt submitted! Waiting for opponent to finish...");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit prompt.");
      }
    } catch {
      toast.error("Failed to submit prompt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToLobby = () => {
    setView("lobby");
    setActiveBattle(null);
    setPromptInput("");
    setBattleResults(null);
    setCreateForm({ title: "", description: "", goal: "" });
  };

  const waitingBattles = battles.filter((b) => b.status === "WAITING");
  const activeBattles = battles.filter((b) => b.status === "ACTIVE");
  const completedBattles = battles.filter((b) => b.status === "COMPLETED");

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
      <MainSidebar
        userLevel={undefined}
        isExpanded={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-[#ff8a3d]" />
              <h1 className="text-lg font-semibold text-[#f5efe6]">
                Prompt Battles
              </h1>
            </div>
          </div>
          {view !== "lobby" && (
            <Button
              variant="ghost"
              onClick={resetToLobby}
              className="rounded-full text-[#a0978a] hover:bg-white/5 hover:text-[#f5efe6]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lobby
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <AnimatePresence mode="wait">
            {/* ── Lobby View ──────────────────────────────────── */}
            {view === "lobby" && (
              <motion.div
                key="lobby"
                className="mx-auto max-w-4xl space-y-8"
                {...pageTransition}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#f5efe6]">
                      Battle Lobby
                    </h2>
                    <p className="mt-1 text-sm text-[#a0978a]">
                      Create a battle or join an existing one.
                    </p>
                  </div>
                  <Button
                    onClick={() => setView("create")}
                    className="rounded-full bg-[#ff8a3d] px-5 text-sm text-[#111111] hover:bg-[#ff9b5b]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Battle
                  </Button>
                </div>

                {/* How to Play */}
                <motion.div
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]"
                  initial={false}
                >
                  <button
                    onClick={() => setShowHowToPlay(!showHowToPlay)}
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="text-sm font-medium text-[#f5efe6]">
                      How to Play
                    </span>
                    {showHowToPlay ? (
                      <ChevronUp className="h-4 w-4 text-[#6a6255]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#6a6255]" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showHowToPlay && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/10 px-5 py-4">
                          <p className="text-sm leading-6 text-[#a0978a]">
                            Two players write prompts for the same objective. An
                            AI evaluator scores each prompt — the better one
                            wins.
                          </p>

                          <div className="mt-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff8a3d]/15 text-[10px] font-bold text-[#ff8a3d]">
                                1
                              </span>
                              <p className="text-sm text-[#a0978a]">
                                <span className="text-[#f5efe6]">
                                  Create or join
                                </span>{" "}
                                a battle from the lobby
                              </p>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff8a3d]/15 text-[10px] font-bold text-[#ff8a3d]">
                                2
                              </span>
                              <p className="text-sm text-[#a0978a]">
                                <span className="text-[#f5efe6]">
                                  Write your prompt
                                </span>{" "}
                                for the given objective
                              </p>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff8a3d]/15 text-[10px] font-bold text-[#ff8a3d]">
                                3
                              </span>
                              <p className="text-sm text-[#a0978a]">
                                <span className="text-[#f5efe6]">
                                  AI evaluates
                                </span>{" "}
                                both prompts — higher score wins
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-6 text-xs text-[#6a6255]">
                            <span>
                              Win <span className="text-emerald-400">+30</span>
                            </span>
                            <span>
                              Loss <span className="text-red-400">-15</span>
                            </span>
                            <span>
                              Draw <span className="text-amber-400">+5</span>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Waiting for opponent */}
                {waitingBattles.length > 0 && (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                  >
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#6a6255]">
                      <Clock className="h-4 w-4" />
                      Waiting for Opponent
                    </h3>
                    <div className="space-y-3">
                      {waitingBattles.map((battle) => {
                        const isCreator = battle.createdBy === currentUserId;
                        return (
                          <motion.div
                            key={battle.id}
                            variants={cardVariant}
                            className="rounded-xl border border-white/10 bg-[#111111] p-5 transition-colors hover:border-white/20"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-base font-medium text-[#f5efe6]">
                                  {battle.title}
                                </h4>
                                <p className="mt-1 text-sm text-[#a0978a]">
                                  {battle.description}
                                </p>
                                <p className="mt-1 text-xs text-[#4a453d]">
                                  Created by{" "}
                                  {battle.participants[0]?.userName ||
                                    "Unknown"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isCreator && (
                                  <Button
                                    onClick={() =>
                                      handleDeleteBattle(battle.id)
                                    }
                                    disabled={isDeleting}
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {!isCreator && (
                                  <Button
                                    onClick={() => handleJoinBattle(battle.id)}
                                    disabled={isSubmitting}
                                    className="rounded-full bg-[#ff8a3d] px-4 text-sm text-[#111111] hover:bg-[#ff9b5b]"
                                  >
                                    <Swords className="mr-2 h-4 w-4" />
                                    Join
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Active battles */}
                {activeBattles.length > 0 && (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                  >
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#6a6255]">
                      <Users className="h-4 w-4" />
                      Active Battles
                    </h3>
                    <div className="space-y-3">
                      {activeBattles.map((battle) => {
                        const isCreator = battle.createdBy === currentUserId;
                        return (
                          <motion.div
                            key={battle.id}
                            variants={cardVariant}
                            className="rounded-xl border border-white/10 bg-[#111111] p-5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-base font-medium text-[#f5efe6]">
                                  {battle.title}
                                </h4>
                                <p className="mt-1 text-sm text-[#a0978a]">
                                  {battle.description}
                                </p>
                                <div className="mt-2 flex gap-2">
                                  {battle.participants.map((p) => (
                                    <span
                                      key={p.userId}
                                      className="text-[10px] text-[#6a6255]"
                                    >
                                      {p.userName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                                  In Progress
                                </span>
                                {isCreator && (
                                  <Button
                                    onClick={() =>
                                      handleForfeitBattle(battle.id)
                                    }
                                    disabled={isDeleting}
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                                  >
                                    Forfeit
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Completed battles */}
                {completedBattles.length > 0 && (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                  >
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#6a6255]">
                      <Trophy className="h-4 w-4" />
                      Completed
                    </h3>
                    <div className="space-y-3">
                      {completedBattles.map((battle) => {
                        const winner = battle.participants?.find(
                          (p) => p.result === "WIN",
                        );
                        return (
                          <motion.div
                            key={battle.id}
                            variants={cardVariant}
                            className="rounded-xl border border-white/10 bg-[#111111] p-5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-base font-medium text-[#f5efe6]">
                                  {battle.title}
                                </h4>
                                <p className="mt-1 text-sm text-[#a0978a]">
                                  {battle.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                                  {winner?.userName
                                    ? `Winner: ${winner.userName}`
                                    : "Draw"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {battles.length === 0 && (
                  <motion.div
                    className="py-16 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Swords className="mx-auto h-12 w-12 text-[#6a6255]" />
                    <h3 className="mt-4 text-lg font-medium text-[#f5efe6]">
                      No battles yet
                    </h3>
                    <p className="mt-2 text-sm text-[#a0978a]">
                      Create the first battle and challenge others.
                    </p>
                    <Button
                      onClick={() => setView("create")}
                      className="mt-6 rounded-full bg-[#ff8a3d] px-6 text-sm text-[#111111] hover:bg-[#ff9b5b]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Battle
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Create Battle View ──────────────────────────── */}
            {view === "create" && (
              <motion.div
                key="create"
                className="mx-auto max-w-2xl space-y-6"
                {...pageTransition}
              >
                <div>
                  <h2 className="text-2xl font-semibold text-[#f5efe6]">
                    Create a Battle
                  </h2>
                  <p className="mt-1 text-sm text-[#a0978a]">
                    Set the objective and wait for an opponent.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#f5efe6]">
                      Battle Title
                    </label>
                    <Input
                      value={createForm.title}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="e.g., Code Commenter Challenge"
                      className="rounded-xl border-white/10 bg-[#111111] text-[#f5efe6] placeholder:text-[#4a453d]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#f5efe6]">
                      Description
                    </label>
                    <Textarea
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the objective..."
                      className="min-h-[100px] rounded-xl border-white/10 bg-[#111111] text-[#f5efe6] placeholder:text-[#4a453d]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#f5efe6]">
                      Goal (optional)
                    </label>
                    <Input
                      value={createForm.goal}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, goal: e.target.value }))
                      }
                      placeholder="What does success look like?"
                      className="rounded-xl border-white/10 bg-[#111111] text-[#f5efe6] placeholder:text-[#4a453d]"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateBattle}
                    disabled={
                      isSubmitting ||
                      !createForm.title.trim() ||
                      !createForm.description.trim()
                    }
                    className="rounded-full bg-[#ff8a3d] px-6 text-sm text-[#111111] hover:bg-[#ff9b5b]"
                  >
                    {isSubmitting ? "Creating..." : "Create & Wait"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={resetToLobby}
                    className="rounded-full text-[#a0978a] hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Waiting View ────────────────────────────────── */}
            {view === "waiting" && activeBattle && (
              <motion.div
                key="waiting"
                className="relative mx-auto max-w-2xl space-y-6"
                {...pageTransition}
              >
                {/* Particle burst celebration */}
                {showBurst && <ParticleBurst />}

                <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-amber-400/50" />
                    </div>
                    <h2 className="text-xl font-semibold text-[#f5efe6]">
                      {activeBattle.participants.length === 1
                        ? "Waiting for opponent..."
                        : "Waiting for opponent to submit..."}
                    </h2>
                  </div>
                  <p className="mt-3 text-sm text-[#a0978a]">
                    {activeBattle.participants.length === 1
                      ? "Share the battle title or wait for someone to join from the lobby."
                      : "Your opponent has joined and is writing their prompt."}
                  </p>

                  <div className="mt-4 rounded-lg border border-white/10 bg-[#0d0d0d] p-4">
                    <h3 className="text-sm font-medium text-[#f5efe6]">
                      {activeBattle.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#a0978a]">
                      {activeBattle.description}
                    </p>
                  </div>

                  {/* Animated opponent placeholder */}
                  {activeBattle.participants.length === 1 && (
                    <motion.div
                      className="flex flex-col items-center gap-2 py-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <p className="text-xs text-[#6a6255]">
                        Waiting for someone to join...
                      </p>
                    </motion.div>
                  )}

                  {/* Opponent joined indicator */}
                  {activeBattle.participants.length >= 2 && (
                    <motion.div
                      className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">
                        Opponent joined! Battle starting...
                      </span>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ff8a3d]" />
                </div>

                {/* Cancel button for creator */}
                {activeBattle.createdBy === currentUserId && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteBattle(activeBattle.id)}
                      disabled={isDeleting}
                      className="rounded-full text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel Battle
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Battle View ─────────────────────────────────── */}
            {view === "battle" && activeBattle && (
              <motion.div
                key="battle"
                className="mx-auto max-w-3xl space-y-6"
                {...pageTransition}
              >
                {/* Battle objective */}
                <div className="rounded-xl border border-[#ff8a3d]/20 bg-[#ff8a3d]/5 p-6">
                  <div className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-[#ff8a3d]" />
                    <h2 className="text-xl font-semibold text-[#f5efe6]">
                      {activeBattle.title}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#a0978a]">
                    {activeBattle.description}
                  </p>
                  {activeBattle.goal && (
                    <div className="mt-3 rounded-lg border border-[#ff8a3d]/20 bg-[#ff8a3d]/10 p-3">
                      <span className="text-xs font-medium text-[#ff8a3d]">
                        Goal:{" "}
                      </span>
                      <span className="text-xs text-[#f5efe6]">
                        {activeBattle.goal}
                      </span>
                    </div>
                  )}
                </div>

                {/* Test cases preview */}
                {activeBattle.testCases.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-[#6a6255]">
                      Test Cases ({activeBattle.testCases.length})
                    </h3>
                    <div className="space-y-3">
                      {activeBattle.testCases.map((tc, idx) => (
                        <motion.div
                          key={idx}
                          className="rounded-xl border border-white/10 bg-[#111111] p-4"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <div className="mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#ff8a3d]">
                              Test Case {idx + 1}
                            </span>
                            <div className="mt-1 text-xs text-[#6a6255]">
                              {tc.description}
                            </div>
                          </div>
                          <div className="rounded-lg bg-[#0d0d0d] px-3 py-2 text-xs text-[#d9d1c7]">
                            {tc.input}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#f5efe6]">
                    Write your prompt
                  </label>
                  <Textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Write the best prompt you can..."
                    className="max-h-[400px] min-h-[200px] resize-y rounded-xl border-white/10 bg-[#111111] px-5 py-4 text-base leading-7 text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-[#4a453d]">
                      ~{promptInput.split(/\s+/).filter(Boolean).length} words
                    </p>
                    <Button
                      onClick={handleSubmitPrompt}
                      disabled={isSubmitting || !promptInput.trim()}
                      className="rounded-full bg-[#ff8a3d] px-6 text-sm text-[#111111] hover:bg-[#ff9b5b]"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Prompt"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Results View ────────────────────────────────── */}
            {view === "results" && activeBattle && battleResults && (
              <motion.div
                key="results"
                className="mx-auto max-w-3xl space-y-6"
                {...pageTransition}
              >
                {/* Winner announcement */}
                <motion.div
                  className={`rounded-xl border p-6 text-center ${
                    battleResults.isDraw
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                  }`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 12,
                      delay: 0.2,
                    }}
                  >
                    <Trophy
                      className={`mx-auto h-10 w-10 ${
                        battleResults.isDraw
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    />
                  </motion.div>
                  <h2 className="mt-3 text-2xl font-bold text-[#f5efe6]">
                    {battleResults.isDraw
                      ? "It's a Draw!"
                      : `${battleResults.winner?.userName || "Player"} Wins!`}
                  </h2>
                  {!battleResults.isDraw && battleResults.winner && (
                    <p className="mt-1 text-sm text-[#a0978a]">
                      Score: {battleResults.winner.score}/100 ·{" "}
                      {battleResults.winner.tokenCount} tokens
                    </p>
                  )}
                </motion.div>

                {/* Both prompts comparison */}
                <div className="grid gap-4 md:grid-cols-2">
                  {activeBattle.participants.map((p, idx) => (
                    <motion.div
                      key={idx}
                      className={`rounded-xl border p-5 ${
                        p.result === "WIN"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : p.result === "LOSS"
                            ? "border-red-500/30 bg-red-500/5"
                            : "border-amber-500/30 bg-amber-500/5"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.15 }}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#f5efe6]">
                          {p.userName || `Player ${idx + 1}`}
                        </span>
                        {p.result === "WIN" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : p.result === "LOSS" ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : (
                          <span className="text-xs text-amber-400">Draw</span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs text-[#a0978a]">
                        <div>
                          <span className="font-medium text-[#6a6255]">
                            Score:{" "}
                          </span>
                          {p.score ?? "N/A"}/100
                        </div>
                        <div>
                          <span className="font-medium text-[#6a6255]">
                            Tokens:{" "}
                          </span>
                          {p.tokenCount ?? "N/A"}
                        </div>
                        {p.eloChange && (
                          <div>
                            <span className="font-medium text-[#6a6255]">
                              ELO:{" "}
                            </span>
                            <span
                              className={
                                p.eloChange > 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }
                            >
                              {p.eloChange > 0 ? "+" : ""}
                              {p.eloChange}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 rounded-lg bg-[#0d0d0d] p-3 text-xs text-[#d9d1c7]">
                        {p.prompt}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={resetToLobby}
                    className="rounded-full bg-[#ff8a3d] px-6 text-sm text-[#111111] hover:bg-[#ff9b5b]"
                  >
                    Back to Lobby
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
