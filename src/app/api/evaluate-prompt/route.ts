import { NextResponse } from "next/server";
import { auth } from "auth";
import { env } from "@/env";
import { db } from "db";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { useCredits, CREDIT_COSTS } from "@/lib/credits";

const MAX_BODY_BYTES = 50_000; // 50 KB limit

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "User or profile not found" },
        { status: 404 },
      );
    }

    // Check and use credits
    const creditCheck = await useCredits(user.id, CREDIT_COSTS.EVALUATE_PROMPT);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You have ${creditCheck.remaining} left.`,
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
    let parsed: any;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { prompt, problemId, testCases: providedTestCases } = parsed;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    let finalTestCases = providedTestCases;
    let dbProblem = null;

    // Only attempt database lookup if problemId is a valid MongoDB ObjectId (24 char hex)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(problemId));

    if (problemId && isValidObjectId) {
      dbProblem = await db.problem.findUnique({
        where: { id: String(problemId) },
        include: { testCases: true },
      });

      if (!dbProblem) {
        return NextResponse.json(
          { error: "Problem not found" },
          { status: 404 },
        );
      }

      // Check ELO gate
      if (user.profile.elo < dbProblem.eloGate) {
        return NextResponse.json(
          {
            error: `ELO too low. You need ${dbProblem.eloGate} ELO for this problem.`,
          },
          { status: 403 },
        );
      }

      finalTestCases = dbProblem.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        description: tc.description,
      }));
    }

    if (!finalTestCases || !Array.isArray(finalTestCases)) {
      return NextResponse.json(
        { error: "Test cases are required" },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${env.BACKEND_URL}/evaluate-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, testCases: finalTestCases }),
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: response.status },
      );
    }

    const evalResult = await response.json();

    // Save submission if it's a known database problem
    let submissionId = null;
    if (problemId && isValidObjectId) {
      const submission = await db.submission.create({
        data: {
          userId: user.id,
          problemId: String(problemId),
          prompt,
          score: evalResult.overallScore,
          allPassed: evalResult.passed,
          feedback: JSON.stringify(evalResult.results),
          status: evalResult.passed ? "PASSED" : "FAILED",
        },
      });
      submissionId = submission.id;
    }

    return NextResponse.json({
      ...evalResult,
      submissionId,
      creditsRemaining: creditCheck.remaining,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    console.error("Evaluation error details:", message, stack);
    return NextResponse.json(
      { error: "Evaluation service is unavailable", details: message },
      { status: 502 },
    );
  }
}
