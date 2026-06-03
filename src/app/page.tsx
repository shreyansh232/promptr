import { AgentLanding } from "@/components/AgentLanding";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
