import { auth } from "auth";
import { redirect } from "next/navigation";
import { db } from "db";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const profileData = {
    level: user.profile?.level ?? "beginner",
    expertise: user.profile?.expertise ?? "",
    application: user.profile?.application ?? "",
    goals: user.profile?.goals ?? [],
    elo: user.profile?.elo ?? 1000,
    subLevel: user.profile?.subLevel ?? 1,
    problemsSolved: user.profile?.problemsSolved ?? 0,
    streak: user.profile?.streak ?? 0,
  };

  return <ProfileForm initialData={profileData} />;
}
