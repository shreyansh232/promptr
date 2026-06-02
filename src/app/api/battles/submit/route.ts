import { NextResponse } from "next/server";
import { auth } from "auth";
import { backendFetch, type Battle, type SubmitPromptRequest } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as SubmitPromptRequest;

    if (!body.battleId || !body.prompt) {
      return NextResponse.json(
        { error: "Battle ID and prompt are required" },
        { status: 400 },
      );
    }

    const result = await backendFetch<{
      status: string;
      battle?: Battle;
      results?: unknown[];
    }>("/battles/submit", {
      method: "POST",
      body: JSON.stringify({
        battleId: body.battleId,
        prompt: body.prompt,
      }),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Battle submit error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
