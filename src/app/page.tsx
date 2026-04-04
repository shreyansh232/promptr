import { Header } from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import GradientBackground from "@/components/ui/gradient-background";

export default function LandingPage() {
  return (
    <div className="flex max-h-screen w-full flex-col text-gray-100" id="home">
      <Header />
      <main className="flex-1">
        <div className="py-2">
          <GradientBackground>
            <MaxWidthWrapper>
              <HeroSection />
            </MaxWidthWrapper>
          </GradientBackground>
        </div>
        
        {/* <div className="py-16 bg-gray-900">
          <MaxWidthWrapper>
            <StatsSection />
          </MaxWidthWrapper>
        </div> */}

        <div id="features">
          <MaxWidthWrapper>
            <FeaturesSection />
          </MaxWidthWrapper>
        </div>

        {/* <div className="py-16 bg-gray-900">
          <MaxWidthWrapper>
            <HowItWorksSection />
          </MaxWidthWrapper>
        </div> */}
{/* 
        <div className="py-20">
          <MaxWidthWrapper>
            <TestimonialsSection />
          </MaxWidthWrapper>
        </div> */}
{/* 
        <div className="py-16 bg-black">
          <MaxWidthWrapper>
            <PricingSection />
          </MaxWidthWrapper>
        </div> */}
{/* 
        <div className="py-20">
          <MaxWidthWrapper>
            <CTASection />
          </MaxWidthWrapper>
        </div> */}
      </main>
      <Footer />
    </div>
  );
}
