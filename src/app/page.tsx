import { Header } from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0d0d0d]" id="home">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
