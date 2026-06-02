import { NextResponse } from "next/server";
import { auth } from "auth";
import { backendFetch, type Battle } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { battleId } = (await request.json()) as { battleId?: string };

    if (!battleId) {
      return NextResponse.json(
        { error: "Battle ID is required" },
        { status: 400 },
      );
    }

    const result = await backendFetch<{ battle: Battle }>("/battles/join", {
      method: "POST",
      body: JSON.stringify({
        battleId,
        userId: session.user.id,
        userName: session.user.name ?? "",
      }),
    });

    return NextResponse.json({ battle: result.battle });
  } catch (error) {
    console.error("Battle join error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
