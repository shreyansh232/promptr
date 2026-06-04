import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CURRICULUM_MISSIONS } from "@/data/missions";
import type { AgentProfile } from "@/types/agent-dojo";
import { MissionsWorkspace } from "./_components/MissionsWorkspace";
import type { Metadata } from "next";
import { backendFetch } from "@/lib/backend";

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
    try {
      const userProfile = await backendFetch<any>("/profiles/me");

      if (!userProfile) {
        redirect("/onboarding");
      }

      profile = {
        id: session.user.id,
        level: userProfile.level,
        expertise: userProfile.expertise,
        application: userProfile.application,
        goals: userProfile.goals,
        learningStyle: userProfile.learningStyle,
        subLevel: userProfile.subLevel,
        reliabilityScore: 0, // ELO deprecated
        missionsCompleted: userProfile.problemsSolved,
        streak: userProfile.streak,
        builderRole: userProfile.builderRole,
        frameworks: userProfile.frameworks,
        workflowFocus: userProfile.workflowFocus,
        riskFocus: userProfile.riskFocus,
      };

      const nextIndex = Math.min(userProfile.problemsSolved ?? 0, 24);
      initialMission = (CURRICULUM_MISSIONS[nextIndex] ??
        CURRICULUM_MISSIONS[0])!;
    } catch (error) {
      console.error("Failed to fetch profile", error);
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
