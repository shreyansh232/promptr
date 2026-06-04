import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { backendFetch } from "@/lib/backend";

export const dynamic = "force-dynamic";

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
  reliabilityScore?: number;
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  let profile: BackendUserProfile | null = null;
  try {
    profile = await backendFetch<BackendUserProfile>("/profiles/me");
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    redirect("/sign-in");
  }

  if (!profile) {
    redirect("/sign-in");
  }

  const profileData = {
    level: profile.level ?? "beginner",
    expertise: profile.expertise ?? "",
    application: profile.application ?? "",
    goals: profile.goals ?? [],
    subLevel: profile.subLevel ?? 1,
    problemsSolved: profile.problemsSolved ?? 0,
    streak: profile.streak ?? 0,
    builderRole: profile.builderRole ?? profile.expertise ?? "",
    frameworks: profile.frameworks ?? [],
    workflowFocus: profile.workflowFocus ?? profile.application ?? "",
    riskFocus: profile.riskFocus ?? "",
    reliabilityScore: profile.reliabilityScore ?? 0,
  };

  return <ProfileForm initialData={profileData} />;
}
