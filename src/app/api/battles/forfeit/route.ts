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
      return NextResponse.json({ error: "Missing battleId" }, { status: 400 });
    }

    const battle = await db.battle.findUnique({
      where: { id: battleId },
      include: { participants: true },
    });

    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    // Only the creator can forfeit
    if (battle.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Only the creator can forfeit this battle" },
        { status: 403 },
      );
    }

    // Can only forfeit active battles
    if (battle.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Can only forfeit active battles" },
        { status: 400 },
      );
    }

    // Get participants
    const creatorParticipant = battle.participants.find(
      (p) => p.userId === battle.createdBy,
    );
    const opponentParticipant = battle.participants.find(
      (p) => p.userId !== battle.createdBy,
    );

    if (!creatorParticipant || !opponentParticipant) {
      return NextResponse.json(
        { error: "Invalid battle state" },
        { status: 400 },
      );
    }

    // Mark creator as forfeit/loss, opponent as win
    await db.battleParticipant.update({
      where: { id: creatorParticipant.id },
      data: {
        result: "LOSS",
        score: 0,
        eloChange: -15,
      },
    });

    await db.battleParticipant.update({
      where: { id: opponentParticipant.id },
      data: {
        result: "WIN",
        score: 100,
        eloChange: 30,
      },
    });

    // Update battle status
    await db.battle.update({
      where: { id: battleId },
      data: { status: "COMPLETED" },
    });

    // Update ELO ratings
    await db.userProfile.updateMany({
      where: { userId: battle.createdBy },
      data: { elo: { decrement: 15 } },
    });

    await db.userProfile.updateMany({
      where: { userId: opponentParticipant.userId },
      data: { elo: { increment: 30 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Battle forfeit error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
