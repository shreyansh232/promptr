import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";
import { getUserCredits } from "@/lib/credits";
import { revalidatePath } from "next/cache";

const defaultProfile = {
  level: "beginner",
  subLevel: 1,
  elo: 1000,
  problemsSolved: 0,
  streak: 0,
  expertise: "general",
  learningStyle: "visual",
  goals: [] as string[],
  credits: 50,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    // Auto-create user if missing (e.g. after DB reset)
    if (!user) {
      user = await db.user.create({
        data: {
          email: session.user.email,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
          profile: {
            create: {
              level: defaultProfile.level,
              subLevel: defaultProfile.subLevel,
              elo: defaultProfile.elo,
              problemsSolved: defaultProfile.problemsSolved,
              streak: defaultProfile.streak,
              expertise: defaultProfile.expertise,
              application: "",
              learningStyle: defaultProfile.learningStyle,
              goals: defaultProfile.goals,
              credits: defaultProfile.credits,
              lastCreditRefresh: new Date(),
            },
          },
        },
        include: { profile: true },
      });
    }

    // Auto-create profile if user exists but has no profile
    if (!user.profile) {
      const profile = await db.userProfile.create({
        data: {
          userId: user.id,
          level: defaultProfile.level,
          subLevel: defaultProfile.subLevel,
          elo: defaultProfile.elo,
          problemsSolved: defaultProfile.problemsSolved,
          streak: defaultProfile.streak,
          expertise: defaultProfile.expertise,
          application: "",
          learningStyle: defaultProfile.learningStyle,
          goals: defaultProfile.goals,
          credits: defaultProfile.credits,
          lastCreditRefresh: new Date(),
        },
      });

      return NextResponse.json({
        id: user.id,
        level: profile.level,
        subLevel: profile.subLevel ?? 1,
        elo: profile.elo ?? 1000,
        problemsSolved: profile.problemsSolved ?? 0,
        streak: profile.streak ?? 0,
        expertise: profile.expertise,
        application: profile.application ?? "",
        learningStyle: profile.learningStyle,
        goals: profile.goals ?? [],
        credits: profile.credits ?? 50,
      });
    }

    // Use the utility to get potentially refreshed credits
    const creditData = await getUserCredits(user.id);
    const profile = user.profile;

    return NextResponse.json({
      id: user.id,
      level: profile.level,
      subLevel: profile.subLevel ?? 1,
      elo: profile.elo ?? 1000,
      problemsSolved: profile.problemsSolved ?? 0,
      streak: profile.streak ?? 0,
      expertise: profile.expertise,
      application: profile.application ?? "",
      learningStyle: profile.learningStyle,
      goals: profile.goals ?? [],
      credits: creditData.credits,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      console.log("[Profile API] Unauthorized POST attempt - no session email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      console.log(`[Profile API] User not found for email: ${session.user.email}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await req.json();
    console.log(`[Profile API] Updating profile for user ${user.id} with data:`, data);

    const level =
      typeof data.level === "string" && data.level.trim()
        ? data.level.trim()
        : defaultProfile.level;
    const expertise =
      typeof data.expertise === "string" && data.expertise.trim()
        ? data.expertise.trim()
        : defaultProfile.expertise;
    const application =
      typeof data.application === "string" ? data.application.trim() : "";
    const learningStyle =
      typeof data.learningStyle === "string" && data.learningStyle.trim()
        ? data.learningStyle.trim()
        : defaultProfile.learningStyle;
    const goals = Array.isArray(data.goals)
      ? data.goals.filter(
          (goal: unknown): goal is string => typeof goal === "string",
        )
      : defaultProfile.goals;

    const profile = await db.userProfile.upsert({
      where: { userId: user.id },
      update: {
        level,
        expertise,
        application,
        learningStyle,
        goals,
      },
      create: {
        userId: user.id,
        level,
        expertise,
        application,
        learningStyle,
        goals,
        credits: defaultProfile.credits,
      },
    });

    // Ensure the dashboard and other protected pages see the fresh data
    revalidatePath("/dashboard", "page");
    revalidatePath("/profile", "page");
    revalidatePath("/", "layout"); // Revalidate home layout just in case

    console.log(
      `[Profile API] Successfully updated profile for user ${user.id}, application: "${profile.application}"`,
    );

    return NextResponse.json({
      success: true,
      data: {
        level: profile.level,
        subLevel: profile.subLevel ?? 1,
        elo: profile.elo ?? 1000,
        problemsSolved: profile.problemsSolved ?? 0,
        streak: profile.streak ?? 0,
        expertise: profile.expertise,
        application: profile.application ?? "",
        learningStyle: profile.learningStyle,
        goals: profile.goals,
        credits: profile.credits ?? 50,
      },
    });
  } catch (error) {
    console.error("[Profile API] POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
