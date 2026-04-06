import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";

const defaultProfile = {
  level: "beginner",
  subLevel: 1,
  elo: 1000,
  problemsSolved: 0,
  streak: 0,
  expertise: "general",
  learningStyle: "visual",
  goals: [] as string[],
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
              learningStyle: defaultProfile.learningStyle,
              goals: defaultProfile.goals,
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
          learningStyle: defaultProfile.learningStyle,
          goals: defaultProfile.goals,
        },
      });

      return NextResponse.json({
        level: profile.level,
        subLevel: profile.subLevel ?? 1,
        elo: profile.elo ?? 1000,
        problemsSolved: profile.problemsSolved ?? 0,
        streak: profile.streak ?? 0,
        expertise: profile.expertise,
        learningStyle: profile.learningStyle,
        goals: profile.goals ?? [],
      });
    }

    const profile = user.profile;

    return NextResponse.json({
      level: profile.level,
      subLevel: profile.subLevel ?? 1,
      elo: profile.elo ?? 1000,
      problemsSolved: profile.problemsSolved ?? 0,
      streak: profile.streak ?? 0,
      expertise: profile.expertise,
      learningStyle: profile.learningStyle,
      goals: profile.goals ?? [],
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
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

    const data = await req.json();
    const level =
      typeof data.level === "string" && data.level.trim()
        ? data.level.trim()
        : defaultProfile.level;
    const expertise =
      typeof data.expertise === "string" && data.expertise.trim()
        ? data.expertise.trim()
        : defaultProfile.expertise;
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
        learningStyle,
        goals,
      },
      create: {
        userId: user.id,
        level,
        expertise,
        learningStyle,
        goals,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        level: profile.level,
        subLevel: profile.subLevel ?? 1,
        elo: profile.elo ?? 1000,
        problemsSolved: profile.problemsSolved ?? 0,
        streak: profile.streak ?? 0,
        expertise: profile.expertise,
        learningStyle: profile.learningStyle,
        goals: profile.goals,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
