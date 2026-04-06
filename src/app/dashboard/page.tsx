import ChatInterface from "./_components/ChatInterface";
import { auth } from "auth";
import { redirect } from "next/navigation";
import { db } from "db";

export const dynamic = "force-dynamic";

const MainPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check if user has completed onboarding
  const user = await db.user.findUnique({
    where: { email: session.user.email as string },
    include: { profile: true },
  });

  const onboardingStatus = {
    hasUser: !!user,
    hasProfile: !!user?.profile,
    application: user?.profile?.application,
    expertise: user?.profile?.expertise,
    level: user?.profile?.level,
  };

  console.log(`[Dashboard] Checking onboarding for ${session.user.email}:`, onboardingStatus);

  // Redirect if profile is missing or user hasn't set an application area
  // We use application as the sentinel because it's a mandatory field in onboarding
  if (!user || !user.profile || user.profile.application === "") {
    console.log(`[Dashboard] Redirecting ${session.user.email} to onboarding. Reason:`, 
      !user ? "No user found" : !user.profile ? "No profile found" : "Empty application area");
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <ChatInterface />
    </div>
  );
};

export default MainPage;
