import { NextResponse } from "next/server";
import { db } from "db";
import { BattleStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as BattleStatus | null;

    const battles = await db.battle.findMany({
      where: status ? { status } : {},
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Flatten participants and format for frontend
    const formattedBattles = battles.map((battle) => ({
      ...battle,
      participants: battle.participants.map((p) => ({
        ...p,
        userName: p.user.name,
      })),
    }));

    return NextResponse.json({ battles: formattedBattles });
  } catch (error) {
    console.error("Battle list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
