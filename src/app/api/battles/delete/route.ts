import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";

export async function DELETE(request: Request) {
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

    // Only the creator can delete, and only if still WAITING
    if (battle.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Only the creator can delete this battle" },
        { status: 403 },
      );
    }

    if (battle.status !== "WAITING") {
      return NextResponse.json(
        { error: "Cannot delete an active or completed battle" },
        { status: 400 },
      );
    }

    // Delete participants first (cascade should handle it, but be explicit for MongoDB)
    await db.battleParticipant.deleteMany({
      where: { battleId },
    });

    await db.battle.delete({
      where: { id: battleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Battle delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
