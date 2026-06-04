import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PUBLIC_AGENT_MISSION } from "@/data/agent-dojo";
import type { AgentProfile } from "@/types/agent-dojo";
import { MissionsWorkspace } from "../missions/_components/MissionsWorkspace";
import type { Metadata } from "next";
import { backendFetch } from "@/lib/backend";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Test and stress-test your AI agent prompts against adversarial inputs and workflow constraints.",
};

export const dynamic = "force-dynamic";

export default async function LabPage() {
  const session = await auth();
  let profile: AgentProfile | null = null;

  interface BackendUserProfile {
    level: string;
    subLevel: number;
    problemsSolved: number;
    streak: number;
    expertise: string;
    application: string;
    goals: string[];
    builderRole?: string;
    frameworks?: string[];
    workflowFocus?: string;
    riskFocus?: string;
  }

  if (session?.user?.email) {
    try {
      const userProfile =
        await backendFetch<BackendUserProfile>("/profiles/me");

      if (!userProfile) {
        redirect("/onboarding");
      }

      profile = {
        id: session.user.id,
        level: userProfile.level,
        expertise: userProfile.expertise,
        application: userProfile.application,
        goals: userProfile.goals,
        subLevel: userProfile.subLevel,
        reliabilityScore: 0, // ELO deprecated
        missionsCompleted: userProfile.problemsSolved,
        streak: userProfile.streak,
        builderRole: userProfile.builderRole ?? "",
        frameworks: userProfile.frameworks ?? [],
        workflowFocus: userProfile.workflowFocus ?? "",
        riskFocus: userProfile.riskFocus ?? "",
      };
    } catch (error) {
      console.error("Failed to fetch profile", error);
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
