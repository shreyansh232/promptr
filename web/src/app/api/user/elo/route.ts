import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { env } from "@/env";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const limit = checkRateLimit(
      `elo:${session.user.email}`,
      RATE_LIMITS.elo.maxRequests,
      RATE_LIMITS.elo.windowMs,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((limit.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      score: number;
      allPassed?: boolean;
      problemId?: string;
      problemTitle?: string;
      problemJson?: string;
      userPrompt?: string;
    };
    const { score, allPassed, problemTitle, problemJson, userPrompt } = body;

    if (typeof score !== "number") {
      return NextResponse.json({ error: "Score required" }, { status: 400 });
    }

    const profile = await db.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // If all test cases passed, it's a clear win. Otherwise use score >= 90 as fallback.
    const passed = allPassed === true || score >= 90;

    let newLevel = profile.level ?? "beginner";
    let newSubLevel = profile.subLevel ?? 1;

    if (passed) {
      // Save solved problem to backend
      try {
        await fetch(`${env.BACKEND_URL}/profiles/${user.id}/solved-problems`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userLevel: profile.level ?? "beginner",
            subLevel: profile.subLevel ?? 1,
            problemTitle: problemTitle ?? "Problem",
            problemJson: problemJson ?? "{}",
            userPrompt: userPrompt ?? "",
          }),
        });
      } catch (err) {
        console.error("Failed to save solved problem in backend:", err);
      }

      if (newSubLevel < 5) {
        newSubLevel += 1;
      } else {
        newSubLevel = 1;
        if (newLevel === "beginner") {
          newLevel = "intermediate";
        } else if (newLevel === "intermediate") {
          newLevel = "expert";
        } else {
          newLevel = "expert";
          newSubLevel = 5; // Capped at expert subLevel 5
        }
      }
    }

    const newProblemsSolved = passed
      ? (profile.problemsSolved ?? 0) + 1
      : (profile.problemsSolved ?? 0);
    const newStreak = passed ? (profile.streak ?? 0) + 1 : 0;

    await db.userProfile.update({
      where: { userId: user.id },
      data: {
        level: newLevel,
        subLevel: newSubLevel,
        problemsSolved: newProblemsSolved,
        streak: newStreak,
      },
    });

    interface SolvedProblem {
      userLevel: string;
      subLevel: number;
      problemTitle: string;
    }

    let solvedProblems: SolvedProblem[] = [];
    try {
      const solvedRes = await fetch(
        `${env.BACKEND_URL}/profiles/${user.id}/solved-problems`,
        { cache: "no-store" },
      );
      if (solvedRes.ok) {
        solvedProblems = (await solvedRes.json()) as SolvedProblem[];
      }
    } catch (err) {
      console.error("Failed to fetch solved problems in backend:", err);
    }

    return NextResponse.json({
      elo: 1000,
      eloChange: 0,
      level: newLevel,
      subLevel: newSubLevel,
      problemsSolved: newProblemsSolved,
      streak: newStreak,
      passed,
      alreadySolved: false,
      solvedProblems,
    });
  } catch (error) {
    console.error("Progression Update Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
