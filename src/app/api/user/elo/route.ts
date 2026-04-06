import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const SUB_LEVELS_PER_TIER = 5;
const ELO_PER_WIN = 25;
const ELO_PER_LOSS = -10;

const TIER_ELO_RANGES: Record<string, { min: number; max: number }> = {
  beginner: { min: 0, max: 1199 },
  intermediate: { min: 1200, max: 1499 },
  expert: { min: 1500, max: 99999 },
};

function getSubLevel(elo: number): {
  level: string;
  sub: number;
  progress: number;
} {
  let tier = "beginner";
  if (elo >= 1500) tier = "expert";
  else if (elo >= 1200) tier = "intermediate";

  const range = TIER_ELO_RANGES[tier]!;
  const tierProgress = elo - range.min;
  const tierSpan = range.max - range.min + 1;
  const sub = Math.min(
    Math.floor((tierProgress / tierSpan) * SUB_LEVELS_PER_TIER) + 1,
    SUB_LEVELS_PER_TIER,
  );
  const progress =
    ((tierProgress % (tierSpan / SUB_LEVELS_PER_TIER)) /
      (tierSpan / SUB_LEVELS_PER_TIER)) *
    100;

  return { level: tier, sub, progress: Math.round(progress) };
}

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

    const { score, allPassed, problemId } = await req.json();
    if (typeof score !== "number") {
      return NextResponse.json({ error: "Score required" }, { status: 400 });
    }

    const profile = await db.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if this problem was already solved by this user
    let alreadySolved = false;
    if (problemId) {
      const existingSuccess = await db.submission.findFirst({
        where: {
          userId: user.id,
          problemId: problemId,
          status: "PASSED",
        },
      });
      if (existingSuccess) {
        alreadySolved = true;
      }
    }

    // If all test cases passed, it's a clear win. Otherwise use score >= 90 as fallback.
    const passed = allPassed === true || score >= 90;
    
    // Only grant ELO if the problem wasn't already solved
    const eloChange = (passed && !alreadySolved) ? ELO_PER_WIN : (passed ? 0 : ELO_PER_LOSS);
    
    const newElo = Math.max(100, (profile.elo ?? 1000) + eloChange);
    const newProblemsSolved = (passed && !alreadySolved)
      ? (profile.problemsSolved ?? 0) + 1
      : (profile.problemsSolved ?? 0);
    const newStreak = passed ? (profile.streak ?? 0) + 1 : 0;

    const { level, sub } = getSubLevel(newElo);

    await db.userProfile.update({
      where: { userId: user.id },
      data: {
        elo: newElo,
        level,
        subLevel: sub,
        problemsSolved: newProblemsSolved,
        streak: newStreak,
      },
    });

    return NextResponse.json({
      elo: newElo,
      eloChange,
      level,
      subLevel: sub,
      problemsSolved: newProblemsSolved,
      streak: newStreak,
      passed,
      alreadySolved,
    });
  } catch (error) {
    console.error("ELO Update Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
