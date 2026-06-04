import { NextResponse } from "next/server";
import { env } from "@/env";

export async function GET() {
  try {
    // Placeholder profile for now since NextAuth/Prisma are being removed
    const profileData = {
      id: "guest",
      role: "USER",
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

    // Return dummy data if no actual user logic is present
    return NextResponse.json({
      ...profileData,
      credits: 50,
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
  return NextResponse.json({ success: true });
}
