import { auth } from "auth";
import { redirect } from "next/navigation";
import { db } from "db";
import { PUBLIC_AGENT_MISSION } from "@/data/agent-dojo";
import type { AgentProfile } from "@/types/agent-dojo";
import { MissionsWorkspace } from "../missions/_components/MissionsWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lab",
  description: "Test and stress-test your AI agent prompts against adversarial inputs and workflow constraints.",
};

export const dynamic = "force-dynamic";

export default async function LabPage() {
  const session = await auth();
  let profile: AgentProfile | null = null;

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
    }
  }

  return (
    <MissionsWorkspace
      initialMission={PUBLIC_AGENT_MISSION}
      initialProfile={profile}
      isAuthenticated={Boolean(session?.user)}
      user={session?.user}
      isLabMode={true}
    />
  );
}
