import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "auth";
import { env } from "@/env";
import { PUBLIC_AGENT_MISSION } from "@/data/agent-dojo";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { fetchWithTimeout } from "@/lib/utils";
import type { AgentEvaluation } from "@/types/agent-dojo";

const bodySchema = z.object({
  instructions: z.string().trim().min(10).max(20_000),
  mission: z.record(z.unknown()),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const missionId =
      typeof parsed.data.mission.id === "string" ? parsed.data.mission.id : "";

    if (!session?.user?.id && missionId !== PUBLIC_AGENT_MISSION.id) {
      return NextResponse.json(
        { error: "Sign in to evaluate generated missions" },
        { status: 401 },
      );
    }

    const rateKey = session?.user?.email
      ? `agent-eval:${session.user.email}`
      : `agent-eval-public:${request.headers.get("x-forwarded-for") ?? "local"}`;
    const limit = checkRateLimit(
      rateKey,
      session?.user?.email ? RATE_LIMITS.analyzePrompt.maxRequests : 5,
      RATE_LIMITS.analyzePrompt.windowMs,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    let creditsRemaining: number | undefined;
    if (session?.user?.id) {
      const creditCheck = await deductCredits(
        session.user.id,
        CREDIT_COSTS.EVALUATE_PROMPT,
      );
      if (!creditCheck.allowed) {
        return NextResponse.json(
          {
            error:
              session.user.role === "admin"
                ? "Admin account error. Please contact support."
                : `Insufficient credits. You have ${creditCheck.remaining} credits left.`,
          },
          { status: 403 },
        );
      }
      creditsRemaining = creditCheck.remaining;
    }

    const response = await fetchWithTimeout(
      `${env.BACKEND_URL}/agent-instructions/evaluate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        cache: "no-store",
      },
      120000,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Agent evaluation service is unavailable" },
        { status: response.status },
      );
    }

    const data = (await response.json()) as AgentEvaluation;
    return NextResponse.json({ ...data, creditsRemaining });
  } catch (error) {
    console.error("Agent evaluation error:", error);
    return NextResponse.json(
      { error: "Agent evaluation service is unavailable" },
      { status: 502 },
    );
  }
}
