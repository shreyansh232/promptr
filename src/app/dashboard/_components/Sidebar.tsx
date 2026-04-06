"use client";

import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Swords } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface MainSidebarProps {
  userLevel?: string | null;
  isExpanded: boolean;
  onToggle: () => void;
}

interface UserStats {
  elo: number;
  subLevel: number;
  problemsSolved: number;
  streak: number;
  credits: number;
}

const levels = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Task, context, output",
    eloRange: "0–1199",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Constraints & structure",
    eloRange: "1200–1499",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Robustness & evaluation",
    eloRange: "1500+",
  },
];

const levelOrder = ["beginner", "intermediate", "expert"];

function getLevelIndex(level: string): number {
  const normalized = level === "advanced" ? "expert" : level;
  return levelOrder.indexOf(normalized ?? "beginner");
}

export default function MainSidebar({
  userLevel,
  isExpanded,
  onToggle,
}: MainSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? "P";
  const currentIndex = getLevelIndex(userLevel ?? "beginner");
  const [stats, setStats] = useState<UserStats>({
    elo: 1000,
    subLevel: 1,
    problemsSolved: 0,
    streak: 0,
    credits: 50,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) return;
        const data = await res.json();
        setStats({
          elo: data.elo ?? 1000,
          subLevel: data.subLevel ?? 1,
          problemsSolved: data.problemsSolved ?? 0,
          streak: data.streak ?? 0,
          credits: data.credits ?? 50,
        });
      } catch {
        // ignore
      }
    };
    void fetchStats();
  }, []);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] flex-col border-r border-white/10 bg-[#0d0d0d] transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isExpanded
            ? "translate-x-0"
            : "-translate-x-full lg:w-[60px] lg:translate-x-0"
        }`}
      >
        {/* Header with toggle */}
        <div className="flex items-center justify-between px-4 py-4">
          {isExpanded && (
            <Link href="/" className="text-sm font-semibold text-[#f5efe6]">
              Promptr
            </Link>
          )}
          <button
            onClick={onToggle}
            className="ml-auto rounded-md p-1.5 text-[#6a6255] hover:bg-white/5 hover:text-[#a0978a]"
          >
            {isExpanded ? (
              <ChevronLeftIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Levels */}
        {isExpanded && (
          <div className="flex-1 px-4 py-2">
            <div className="mb-3 px-2 text-[10px] uppercase tracking-[0.28em] text-[#4a453d]">
              Progression
            </div>
            <div className="space-y-1">
              {levels.map((level, index) => {
                const isUnlocked = index <= currentIndex;
                const isActive = index === currentIndex;

                return (
                  <div
                    key={level.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      isActive
                        ? "bg-white/5 text-[#f5efe6]"
                        : isUnlocked
                          ? "text-[#6a6255]"
                          : "text-[#3a3530]"
                    }`}
                  >
                    {isUnlocked ? (
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-[#ff8a3d]" : "bg-[#4a453d]"
                        }`}
                      />
                    ) : (
                      <LockClosedIcon className="h-3 w-3" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{level.label}</span>
                        <span className="text-[10px] text-[#4a453d]">
                          {level.eloRange}
                        </span>
                      </div>
                      {isUnlocked && (
                        <div className="text-[10px] text-[#4a453d]">
                          {level.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        {isExpanded && (
          <div className="space-y-1 px-4 py-2">
            {pathname !== "/dashboard" && (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#f5efe6] transition hover:bg-white/10"
              >
                <div className="h-4 w-4 rounded-full bg-[#ff8a3d]/20 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
                </div>
                Practice Mode
              </Link>
            )}
            {pathname !== "/battles" && (
              <Link
                href="/battles"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#f5efe6] transition hover:bg-white/10"
              >
                <Swords className="h-4 w-4 text-[#ff8a3d]" />
                Prompt Battles
              </Link>
            )}
          </div>
        )}

        {/* User */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            {isExpanded && (
              <>
                <Avatar className="h-8 w-8 shrink-0 border border-white/10 bg-white/5">
                  <AvatarImage src="" alt="User Avatar" />
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#f5efe6]">
                    {userInitial}
                  </span>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="truncate text-xs font-medium text-[#f5efe6]">
                      {session?.user?.name ?? "Prompt learner"}
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-[#ff8a3d]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#ff8a3d]">
                      <span>⚡️</span>
                      <span>{stats.credits}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6a6255]">
                    {stats.problemsSolved} solved · {stats.streak} streak
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className="h-7 w-7 shrink-0 rounded-full text-[#4a453d] hover:bg-white/10 hover:text-[#f5efe6]"
                >
                  <ArrowRightStartOnRectangleIcon className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
