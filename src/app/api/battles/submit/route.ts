import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";
import { env } from "@/env";

const ELO_BATTLE_GAIN = 30;
const ELO_BATTLE_LOSS = 15;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return NextResponse.json({ error: "User or profile not found" }, { status: 404 });
    }

    const { battleId, prompt } = await request.json();

    if (!battleId || !prompt) {
      return NextResponse.json({ error: "Battle ID and prompt are required" }, { status: 400 });
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

    if (battle.status !== "ACTIVE" && battle.status !== "WAITING") {
      return NextResponse.json({ error: "Battle is not active" }, { status: 400 });
    }

    const participant = battle.participants.find(p => p.userId === user.id);
    if (!participant) {
      return NextResponse.json({ error: "You are not a participant in this battle" }, { status: 403 });
    }

    if (participant.prompt) {
      return NextResponse.json({ error: "You have already submitted a prompt" }, { status: 400 });
    }

    // Update participant with prompt
    const updatedParticipant = await db.battleParticipant.update({
      where: { id: participant.id },
      data: {
        prompt,
        tokenCount: prompt.split(/\s+/).filter(Boolean).length,
        submittedAt: new Date(),
      },
    });

    // Check if both have submitted
    const allParticipants = await db.battleParticipant.findMany({
      where: { battleId },
      include: { user: { include: { profile: true } } },
    });

    const submissions = allParticipants.filter(p => p.prompt);
    
    // We expect 2 participants for a battle
    if (submissions.length >= 2) {
      // Both submitted, evaluate!
      const testCases = battle.testCases as any[];
      
      // Call FastAPI backend for evaluation
      const evalResponse = await fetch(`${env.BACKEND_URL}/evaluate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: submissions[0].prompt,
          testCases,
        }),
      });

      const eval1 = await evalResponse.json();

      const evalResponse2 = await fetch(`${env.BACKEND_URL}/evaluate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: submissions[1].prompt,
          testCases,
        }),
      });

      const eval2 = await evalResponse2.json();

      // Determine winner
      const s1 = eval1.overallScore;
      const s2 = eval2.overallScore;
      
      let p1_result: "WIN" | "LOSS" | "DRAW";
      let p2_result: "WIN" | "LOSS" | "DRAW";
      let p1_elo = 0;
      let p2_elo = 0;

      if (s1 > s2) {
        p1_result = "WIN"; p2_result = "LOSS";
        p1_elo = ELO_BATTLE_GAIN; p2_elo = -ELO_BATTLE_LOSS;
      } else if (s2 > s1) {
        p1_result = "LOSS"; p2_result = "WIN";
        p1_elo = -ELO_BATTLE_LOSS; p2_elo = ELO_BATTLE_GAIN;
      } else {
        // Tiebreaker: fewer tokens
        const t1 = submissions[0].tokenCount || 0;
        const t2 = submissions[1].tokenCount || 0;
        if (t1 < t2) {
          p1_result = "WIN"; p2_result = "LOSS";
          p1_elo = ELO_BATTLE_GAIN; p2_elo = -ELO_BATTLE_LOSS;
        } else if (t2 < t1) {
          p1_result = "LOSS"; p2_result = "WIN";
          p1_elo = -ELO_BATTLE_LOSS; p2_elo = ELO_BATTLE_GAIN;
        } else {
          p1_result = "DRAW"; p2_result = "DRAW";
          p1_elo = 5; p2_elo = 5;
        }
      }

      // Update participants and battle
      await db.battleParticipant.update({
        where: { id: submissions[0].id },
        data: { score: s1, passed: eval1.passed, result: p1_result, eloChange: p1_elo },
      });

      await db.battleParticipant.update({
        where: { id: submissions[1].id },
        data: { score: s2, passed: eval2.passed, result: p2_result, eloChange: p2_elo },
      });

      // Update user ELOs
      await db.userProfile.update({
        where: { userId: submissions[0].userId },
        data: { elo: { increment: p1_elo } },
      });

      await db.userProfile.update({
        where: { userId: submissions[1].userId },
        data: { elo: { increment: p2_elo } },
      });

      const updatedBattle = await db.battle.update({
        where: { id: battleId },
        data: { status: "COMPLETED" },
        include: {
          participants: {
            include: { user: { select: { name: true } } },
          },
        },
      });

      const formattedParticipants = updatedBattle.participants.map(p => ({
        ...p,
        userName: p.user.name,
      }));

      return NextResponse.json({
        status: "completed",
        battle: { ...updatedBattle, participants: formattedParticipants },
      });
    }

    return NextResponse.json({ status: "submitted" });
  } catch (error) {
    console.error("Battle submit error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
