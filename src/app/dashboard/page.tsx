import ChatInterface from "./_components/ChatInterface";
import { auth } from "auth";
import { redirect } from "next/navigation";
import { db } from "db";

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

  if (
    !user ||
    !user?.profile ||
    !user?.profile?.expertise ||
    user?.profile?.expertise === "general"
  ) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <ChatInterface />
    </div>
  );
};

export default MainPage;
