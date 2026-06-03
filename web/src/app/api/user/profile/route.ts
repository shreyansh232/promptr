import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "@/lib/prisma";
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
          id: user.id,
          role: user.role,
          level: user.profile.level,
          expertise: user.profile.expertise,
          application: user.profile.application,
          learningStyle: user.profile.learningStyle,
          goals: user.profile.goals,
          elo: user.profile.elo,
          reliabilityScore: user.profile.elo > 100 ? 0 : user.profile.elo,
          subLevel: user.profile.subLevel,
          problemsSolved: user.profile.problemsSolved,
          missionsCompleted: user.profile.problemsSolved,
          streak: user.profile.streak,
          builderRole: user.profile.builderRole,
          frameworks: user.profile.frameworks,
          workflowFocus: user.profile.workflowFocus,
          riskFocus: user.profile.riskFocus,
        }
      : {
          id: user.id,
          role: user.role,
          level: "beginner",
          expertise: "",
          application: "",
          learningStyle: "",
          goals: [],
          elo: 1000,
          reliabilityScore: 0,
          subLevel: 1,
          problemsSolved: 0,
          missionsCompleted: 0,
          streak: 0,
          builderRole: "",
          frameworks: [],
          workflowFocus: "",
          riskFocus: "",
        };

    interface SolvedProblem {
      userLevel: string;
      subLevel: number;
      problemTitle: string;
    }

    interface BackendProfile {
      credits: number;
    }

    let solvedProblems: SolvedProblem[] = [];
    let credits = 0;

    try {
      // Fetch profile from backend to get credits
      const backendProfileRes = await fetch(
        `${env.BACKEND_URL}/profiles/${user.id}`,
        { cache: "no-store" },
      );
      if (backendProfileRes.ok) {
        const backendProfile = (await backendProfileRes.json()) as BackendProfile;
        credits = backendProfile.credits;
      }

      // Fetch solved problems
      const solvedRes = await fetch(
        `${env.BACKEND_URL}/profiles/${user.id}/solved-problems`,
        { cache: "no-store" },
      );
      if (solvedRes.ok) {
        solvedProblems = (await solvedRes.json()) as SolvedProblem[];
      }
    } catch (err) {
      console.error("Failed to fetch backend data in GET profile:", err);
    }

    return NextResponse.json({
      ...profileData,
      credits,
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
      learningStyle?: string;
      builderRole?: string;
      frameworks?: string[];
      workflowFocus?: string;
      riskFocus?: string;
    };

    const updatedProfile = await db.userProfile.upsert({
      where: { userId: user.id },
      update: {
        level: data.level,
        expertise: data.expertise,
        application: data.application,
        learningStyle: data.learningStyle ?? "",
        goals: data.goals ?? [],
        builderRole: data.builderRole ?? "",
        frameworks: data.frameworks ?? [],
        workflowFocus: data.workflowFocus ?? "",
        riskFocus: data.riskFocus ?? "",
      },
      create: {
        userId: user.id,
        level: data.level,
        expertise: data.expertise,
        application: data.application,
        learningStyle: data.learningStyle ?? "",
        goals: data.goals ?? [],
        builderRole: data.builderRole ?? "",
        frameworks: data.frameworks ?? [],
        workflowFocus: data.workflowFocus ?? "",
        riskFocus: data.riskFocus ?? "",
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
