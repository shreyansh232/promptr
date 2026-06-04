import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendFetch, BackendError } from "@/lib/backend";

interface BackendProfile {
  id: string;
  userId: string;
  level: string;
  subLevel: number;
  problemsSolved: number;
  streak: number;
  expertise: string;
  application: string;
  goals: string[];
  credits?: number;
  builderRole?: string;
  frameworks?: string[];
  workflowFocus?: string;
  riskFocus?: string;
  role?: string;
  reliabilityScore?: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await backendFetch<BackendProfile>("/profiles/me");
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileData = {
      id: profile.userId,
      role: profile.role ?? "USER",
      level: profile.level ?? "beginner",
      expertise: profile.expertise ?? "",
      application: profile.application ?? "",
      goals: profile.goals ?? [],
      reliabilityScore: profile.reliabilityScore ?? 0,
      subLevel: profile.subLevel ?? 1,
      problemsSolved: profile.problemsSolved ?? 0,
      missionsCompleted: profile.problemsSolved ?? 0,
      streak: profile.streak ?? 0,
      builderRole: profile.builderRole ?? profile.expertise ?? "",
      frameworks: profile.frameworks ?? [],
      workflowFocus: profile.workflowFocus ?? profile.application ?? "",
      riskFocus: profile.riskFocus ?? "",
      credits:
        profile.role?.toLowerCase() === "admin" ? 999 : (profile.credits ?? 50),
      solvedProblems: [],
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Profile GET error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const status = error instanceof BackendError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyText = await request.text();
    let bodyJson: Record<string, unknown> = {};
    try {
      bodyJson = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Inject userId from session to satisfy backend validation
    bodyJson.userId = session.user.id;

    const data = await backendFetch<unknown>("/profiles/", {
      method: "POST",
      body: JSON.stringify(bodyJson),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Profile POST error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const status = error instanceof BackendError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
