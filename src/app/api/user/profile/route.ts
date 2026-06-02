import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";
import { env } from "@/env";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return profile from MongoDB
    const profileData = user.profile
      ? {
          level: user.profile.level,
          expertise: user.profile.expertise,
          application: user.profile.application,
          learningStyle: user.profile.learningStyle,
          goals: user.profile.goals,
          elo: user.profile.elo,
          subLevel: user.profile.subLevel,
          problemsSolved: user.profile.problemsSolved,
          streak: user.profile.streak,
        }
      : {
          level: "beginner",
          expertise: "",
          application: "",
          learningStyle: "",
          goals: [],
          elo: 1000,
          subLevel: 1,
          problemsSolved: 0,
          streak: 0,
        };

    interface SolvedProblem {
      userLevel: string;
      subLevel: number;
      problemTitle: string;
    }

    let solvedProblems: SolvedProblem[] = [];
    try {
      const solvedRes = await fetch(
        `${env.BACKEND_URL}/profiles/${user.id}/solved-problems`,
        { cache: "no-store" },
      );
      if (solvedRes.ok) {
        solvedProblems = (await solvedRes.json()) as SolvedProblem[];
      }
    } catch (err) {
      console.error("Failed to fetch solved problems in GET profile:", err);
    }

    return NextResponse.json({
      ...profileData,
      solvedProblems,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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

    const data = (await req.json()) as {
      level: string;
      expertise: string;
      application: string;
      goals: string[];
    };

    const updatedProfile = await db.userProfile.upsert({
      where: { userId: user.id },
      update: {
        level: data.level,
        expertise: data.expertise,
        application: data.application,
        goals: data.goals ?? [],
      },
      create: {
        userId: user.id,
        level: data.level,
        expertise: data.expertise,
        application: data.application,
        goals: data.goals ?? [],
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    console.error("[Profile API] POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
