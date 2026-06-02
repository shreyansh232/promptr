import { NextResponse } from "next/server";
import { auth } from "auth";
import { env } from "@/env";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { fetchWithTimeout } from "@/lib/utils";
import type { TestCaseEvaluationResult } from "@/lib/backend";

interface EvaluationRequestBody {
  prompt: string;
  problemId?: string;
  testCases?: { input: string; expectedOutput: string; description: string }[];
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check and use credits
    const creditCheck = await deductCredits(
      session.user.id,
      CREDIT_COSTS.EVALUATE_PROMPT,
    );
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You have ${creditCheck.remaining} credits left.`,
        },
        { status: 403 },
      );
    }

    // Rate limit check
    const limit = checkRateLimit(
      `evaluate:${session.user.email}`,
      RATE_LIMITS.analyzePrompt.maxRequests,
      RATE_LIMITS.analyzePrompt.windowMs,
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

    const bodyText = await request.text();
    let parsed: EvaluationRequestBody;
    try {
      parsed = JSON.parse(bodyText) as EvaluationRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { prompt, testCases: providedTestCases } = parsed;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    if (
      !providedTestCases ||
      !Array.isArray(providedTestCases) ||
      providedTestCases.length === 0
    ) {
      return NextResponse.json(
        { error: "Test cases are required" },
        { status: 400 },
      );
    }

    const response = await fetchWithTimeout(
      `${env.BACKEND_URL}/evaluate-prompt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, testCases: providedTestCases }),
        cache: "no-store",
      },
      120000,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: response.status },
      );
    }

    const evalResult = (await response.json()) as TestCaseEvaluationResult;

    return NextResponse.json({
      ...evalResult,
      creditsRemaining: creditCheck.remaining,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Evaluation service is unavailable" },
      { status: 502 },
    );
  }
}
