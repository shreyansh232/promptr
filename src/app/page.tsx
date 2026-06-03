import { AgentLanding } from "@/components/marketing/AgentLanding";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { auth } from "auth";

export default async function LandingPage() {
  const session = await auth();
  return (
    <div
      className="landing-theme min-h-screen bg-[var(--landing-ink)] text-[var(--landing-paper)]"
      id="home"
    >
      <Header />
      <AgentLanding isAuthenticated={!!session?.user} />
      <Footer />
    </div>
  );
}
