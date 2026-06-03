import { NextResponse } from "next/server";
import { auth } from "auth";
import { env } from "@/env";
import { db } from "db";
import { fetchWithTimeout } from "@/lib/utils";

const MAX_BODY_BYTES = 20_000; // 20 KB limit for agent prompt descriptions

export async function GET() {
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

    const customScenarios = await db.customScenario.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customScenarios });
  } catch (error) {
    console.error("Error fetching custom scenarios:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }

    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }

    let parsed: { agentDescription?: string; tools?: string };
    try {
      parsed = JSON.parse(bodyText) as {
        agentDescription?: string;
        tools?: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { agentDescription, tools } = parsed;
    if (!agentDescription) {
      return NextResponse.json(
        { error: "Missing agentDescription" },
        { status: 400 },
      );
    }

    // Call FastAPI backend to generate the scenarios
    const backendResponse = await fetchWithTimeout(
      `${env.BACKEND_URL}/generate-custom-scenario`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentDescription,
          tools: tools ?? "",
        }),
        cache: "no-store",
      },
      60000,
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: "Failed to generate custom scenario from AI" },
        { status: backendResponse.status },
      );
    }

    const problem = (await backendResponse.json()) as {
      title: string;
      difficulty: string;
      description: string;
      goal: string;
      examples: unknown[];
      testCases: unknown[];
      proTips?: string[];
      tags?: string[];
      hint?: string;
    };

    // Save custom scenario to database
    const savedScenario = await db.customScenario.create({
      data: {
        userId: user.id,
        title: problem.title || "Custom Agent Scenario",
        difficulty: problem.difficulty || "Intermediate",
        description: problem.description || "",
        goal: problem.goal || "",
        agentDescription,
        tools: tools ?? "",
        examples: JSON.stringify(problem.examples || []),
        testCases: JSON.stringify(problem.testCases || []),
        proTips: problem.proTips ?? [],
        tags: problem.tags ?? [],
        hint: problem.hint ?? "",
      },
    });

    return NextResponse.json({ customScenario: savedScenario });
  } catch (error) {
    console.error("Error generating custom scenario:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
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

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing custom scenario ID" },
        { status: 400 },
      );
    }

    // Verify ownership before deleting
    const scenario = await db.customScenario.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 },
      );
    }

    if (scenario.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.customScenario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom scenario:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
