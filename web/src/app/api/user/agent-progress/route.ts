import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "auth";
import { db } from "@/lib/prisma";
import { env } from "@/env";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const progressSchema = z.object({
  missionId: z.string().min(1),
  missionTitle: z.string().min(1),
  missionJson: z.string().min(1),
  userInstructions: z.string().min(1),
  reliabilityScore: z.number().min(0).max(100),
  passed: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkRateLimit(
      `agent-progress:${session.user.email}`,
      RATE_LIMITS.elo.maxRequests,
      RATE_LIMITS.elo.windowMs,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const parsed = progressSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user?.profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = user.profile;
    const passed = parsed.data.passed;
    let newLevel = profile.level ?? "beginner";
    let newSubLevel = profile.subLevel ?? 1;

    if (passed) {
      try {
        await db.completedAgentMission.upsert({
          where: {
            userId_missionId: {
              userId: user.id,
              missionId: parsed.data.missionId,
            },
          },
          update: {
            userLevel: profile.level ?? "beginner",
            subLevel: profile.subLevel ?? 1,
            missionTitle: parsed.data.missionTitle,
            missionJson: parsed.data.missionJson,
            userInstructions: parsed.data.userInstructions,
            reliabilityScore: parsed.data.reliabilityScore,
            passed,
          },
          create: {
            userId: user.id,
            userLevel: profile.level ?? "beginner",
            subLevel: profile.subLevel ?? 1,
            missionId: parsed.data.missionId,
            missionTitle: parsed.data.missionTitle,
            missionJson: parsed.data.missionJson,
            userInstructions: parsed.data.userInstructions,
            reliabilityScore: parsed.data.reliabilityScore,
            passed,
          },
        });
      } catch (error) {
        console.error(
          "Failed to save completed agent mission via Prisma:",
          error,
        );
      }

      try {
        await fetch(`${env.BACKEND_URL}/agent-missions/completed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userLevel: profile.level ?? "beginner",
            subLevel: profile.subLevel ?? 1,
            missionId: parsed.data.missionId,
            missionTitle: parsed.data.missionTitle,
            missionJson: parsed.data.missionJson,
            userInstructions: parsed.data.userInstructions,
            reliabilityScore: parsed.data.reliabilityScore,
            passed,
          }),
        });
      } catch (error) {
        console.error(
          "Failed to save completed agent mission via backend fetch:",
          error,
        );
      }

      if (newSubLevel < 5) {
        newSubLevel += 1;
      } else if (newLevel === "beginner") {
        newLevel = "intermediate";
        newSubLevel = 1;
      } else if (newLevel === "intermediate") {
        newLevel = "expert";
        newSubLevel = 1;
      } else {
        newLevel = "expert";
        newSubLevel = 5;
      }
    }

    const missionsCompleted = passed
      ? (profile.problemsSolved ?? 0) + 1
      : (profile.problemsSolved ?? 0);
    const streak = passed ? (profile.streak ?? 0) + 1 : 0;

    await db.userProfile.update({
      where: { userId: user.id },
      data: {
        level: newLevel,
        subLevel: newSubLevel,
        problemsSolved: missionsCompleted,
        streak,
        elo: parsed.data.reliabilityScore,
      },
    });

    return NextResponse.json({
      reliabilityScore: parsed.data.reliabilityScore,
      level: newLevel,
      subLevel: newSubLevel,
      missionsCompleted,
      streak,
      passed,
    });
  } catch (error) {
    console.error("Agent progress update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
