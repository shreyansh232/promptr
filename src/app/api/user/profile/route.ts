import { NextResponse } from "next/server";
import { auth } from "auth";
import { db } from "db";

const defaultProfile = {
  level: "beginner",
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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = user.profile ?? defaultProfile;

    return NextResponse.json({
      level: profile.level,
      expertise: profile.expertise,
      learningStyle: profile.learningStyle,
      goals: profile.goals ?? [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
      ? data.goals.filter((goal: unknown): goal is string => typeof goal === "string")
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
        expertise: profile.expertise,
        learningStyle: profile.learningStyle,
        goals: profile.goals,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
