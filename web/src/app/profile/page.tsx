import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { backendFetch } from "@/lib/backend";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  let profile = null;
  try {
    profile = await backendFetch<any>("/profiles/me");
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
    elo: 1000, // ELO is deprecated, kept for frontend compat if needed temporarily
    subLevel: profile.subLevel ?? 1,
    problemsSolved: profile.problemsSolved ?? 0,
    streak: profile.streak ?? 0,
    builderRole: profile.builderRole ?? profile.expertise ?? "",
    frameworks: profile.frameworks ?? [],
    workflowFocus: profile.workflowFocus ?? profile.application ?? "",
    riskFocus: profile.riskFocus ?? "",
  };

  return <ProfileForm initialData={profileData} />;
}
