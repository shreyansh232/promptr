import { auth } from "auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CURRICULUM_MISSIONS } from "@/data/missions";
import type { AgentProfile } from "@/types/agent-dojo";
import { MissionsWorkspace } from "./_components/MissionsWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missions",
  description:
    "Level up your prompt engineering skills with 25 progressive agent instruction challenges.",
};

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const session = await auth();
  let profile: AgentProfile | null = null;
  let initialMission = CURRICULUM_MISSIONS[0]!;

  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (user && !user.profile) {
      redirect("/onboarding");
    }

    if (user?.profile) {
      profile = {
        id: user.id,
        level: user.profile.level,
        expertise: user.profile.expertise,
        application: user.profile.application,
        goals: user.profile.goals,
        learningStyle: user.profile.learningStyle,
        subLevel: user.profile.subLevel,
        reliabilityScore: user.profile.elo > 100 ? 0 : user.profile.elo,
        missionsCompleted: user.profile.problemsSolved,
        streak: user.profile.streak,
        builderRole: user.profile.builderRole,
        frameworks: user.profile.frameworks,
        workflowFocus: user.profile.workflowFocus,
        riskFocus: user.profile.riskFocus,
      };

      const nextIndex = Math.min(user.profile.problemsSolved ?? 0, 24);
      initialMission = (CURRICULUM_MISSIONS[nextIndex] ??
        CURRICULUM_MISSIONS[0])!;
    }
  }

  return (
    <MissionsWorkspace
      initialMission={initialMission}
      initialProfile={profile}
      isAuthenticated={Boolean(session?.user)}
      user={session?.user}
    />
  );
}
