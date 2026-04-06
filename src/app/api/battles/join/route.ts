import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { battleId } = await request.json();

    if (!battleId) {
      return NextResponse.json({ error: "Battle ID is required" }, { status: 400 });
    }

    const battle = await db.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: true,
      },
    });

    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    if (battle.status !== "WAITING") {
      return NextResponse.json({ error: "Battle is not open for joining" }, { status: 400 });
    }

    if (battle.createdBy === user.id) {
      return NextResponse.json({ error: "You cannot join your own battle" }, { status: 400 });
    }

    const updatedBattle = await db.battle.update({
      where: { id: battleId },
      data: {
        status: "ACTIVE",
        opponentId: user.id,
        participants: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ battle: updatedBattle });
  } catch (error) {
    console.error("Battle join error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
