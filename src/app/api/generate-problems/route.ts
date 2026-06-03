import { NextResponse } from "next/server";
import { auth } from "auth";
import { env } from "@/env";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { db } from "@/lib/prisma";
import { fetchWithTimeout } from "@/lib/utils";

const MAX_BODY_BYTES = 10_000; // 10 KB limit (user type is small)

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user from DB
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rate limit check
    const limit = checkRateLimit(
      `generate:${session.user.email}`,
      RATE_LIMITS.generateProblems.maxRequests,
      RATE_LIMITS.generateProblems.windowMs,
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

    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const parsedData = parsed as Record<string, unknown>;
    const requiredFields = ["level", "expertise", "goals"];
    for (const field of requiredFields) {
      if (!(field in parsedData)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    if (
      typeof parsedData.level !== "string" ||
      typeof parsedData.expertise !== "string"
    ) {
      return NextResponse.json(
        { error: "level and expertise must be strings" },
        { status: 400 },
      );
    }

    if (!Array.isArray(parsedData.goals)) {
      return NextResponse.json(
        { error: "goals must be an array" },
        { status: 400 },
      );
    }

    const response = await fetchWithTimeout(
      `${env.BACKEND_URL}/generate-problems`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          level: parsedData.level,
          expertise: parsedData.expertise,
          application: parsedData.application ?? "",
          learning_style:
            (parsedData.learning_style as string | undefined) ?? "",
          goals: parsedData.goals,
          subLevel: parsedData.subLevel ?? 1,
        }),
        cache: "no-store",
      },
      60000,
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
