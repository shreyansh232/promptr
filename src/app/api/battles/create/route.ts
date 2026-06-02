import { NextResponse } from "next/server";
import { auth } from "auth";
import { backendFetch, type Battle, type CreateBattleRequest } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateBattleRequest;

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await backendFetch<{ battleId: string; battle: Battle }>(
      "/battles/create",
      {
        method: "POST",
        body: JSON.stringify({
          title: body.title,
          description: body.description,
          goal: body.goal,
          testCases: body.testCases ?? [],
          createdBy: session.user.id,
          createdByName: session.user.name ?? "",
        }),
      },
    );

    return NextResponse.json({ battle: result.battle });
  } catch (error) {
    console.error("Battle creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
