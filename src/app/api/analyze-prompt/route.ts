import { NextResponse } from "next/server";
import { auth } from "auth";
import { env } from "@/env";
import { db } from "db";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { fetchWithTimeout } from "@/lib/utils";

const MAX_BODY_BYTES = 50_000; // 50 KB limit

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rate limit check
    const limit = checkRateLimit(
      `analyze:${session.user.email}`,
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

    // Check and use credits
    const creditCheck = await deductCredits(
      user.id,
      CREDIT_COSTS.ANALYZE_PROMPT,
    );
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You have ${creditCheck.remaining} left.`,
        },
        { status: 403 },
      );
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }

    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }

    // Validate JSON structure
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("messages" in parsed) ||
      !("user_type" in parsed)
    ) {
      return NextResponse.json(
        { error: "Missing required fields: messages, user_type" },
        { status: 400 },
      );
    }

    const parsedData = parsed as Record<string, unknown>;
    if (!Array.isArray(parsedData.messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 },
      );
    }

    if (parsedData.messages.length === 0) {
      return NextResponse.json(
        { error: "messages must not be empty" },
        { status: 400 },
      );
    }

    for (const msg of parsedData.messages) {
      if (
        typeof msg !== "object" ||
        msg === null ||
        !("role" in msg) ||
        !("content" in msg) ||
        typeof (msg as Record<string, unknown>).content !== "string"
      ) {
        return NextResponse.json(
          {
            error: "Each message must have role (string) and content (string)",
          },
          { status: 400 },
        );
      }
    }

    const response = await fetchWithTimeout(
      `${env.BACKEND_URL}/analyze-prompt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
      },
      30000,
    );

    const backendData = (await response.json()) as Record<string, unknown>;

    return NextResponse.json(backendData, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Backend service is unavailable" },
      { status: 502 },
    );
  }
}
