import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";
import { env } from "@/env";
import { PUBLIC_AGENT_MISSION } from "@/data/agent-dojo";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { fetchWithTimeout } from "@/lib/utils";
import type { AgentMission } from "@/types/agent-dojo";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ mission: PUBLIC_AGENT_MISSION });
    }

    const limit = checkRateLimit(
      `agent-mission:${session.user.email}`,
      RATE_LIMITS.generateProblems.maxRequests,
      RATE_LIMITS.generateProblems.windowMs,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = user.profile;
    const response = await fetchWithTimeout(
      `${env.BACKEND_URL}/agent-missions/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          level: profile?.level ?? "beginner",
          expertise: profile?.expertise ?? "developer",
          application: profile?.application ?? "",
          learning_style: profile?.learningStyle ?? "",
          goals: profile?.goals ?? ["Build reliable agents"],
          subLevel: profile?.subLevel ?? 1,
          builderRole: profile?.builderRole ?? "",
          frameworks: profile?.frameworks ?? [],
          workflowFocus: profile?.workflowFocus ?? "",
          riskFocus: profile?.riskFocus ?? "",
        }),
        cache: "no-store",
      },
      60000,
    );

    if (!response.ok) {
      return NextResponse.json(
        { mission: PUBLIC_AGENT_MISSION },
        { status: 200 },
      );
    }

    const data = (await response.json()) as { mission?: AgentMission };
    return NextResponse.json({ mission: data.mission ?? PUBLIC_AGENT_MISSION });
  } catch (error) {
    console.error("Agent mission generation error:", error);
    return NextResponse.json({ mission: PUBLIC_AGENT_MISSION });
  }
}
