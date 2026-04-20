"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="min-h-screen bg-[#0d0d0d] px-4 pb-20 pt-32 md:px-8 md:pb-28 md:pt-40">
      <div className="mx-auto max-w-5xl text-center">
        <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#c9b9a8]">
          Hands-on prompt engineering
        </div>

        <h1 className="text-5xl leading-relaxed tracking-[0.03em] text-[#fff6ee] md:text-7xl lg:text-[5.8rem]">
        Sharpen Your Prompts by Practice, Not Guesswork
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#b9b0a5] md:text-xl">
          Promptr gives users a real prompt problem, scores the draft, and
          forces a better second pass. No noisy dashboard chrome. No vague
          feedback. Just clearer prompts.
        </p>

        <div className="mt-10 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button className="rounded-full bg-[#ff8a3d] px-7 py-6 text-base text-[#111111] hover:bg-[#ff9b5b]">
              Open the workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/#features">
            <Button
              variant="outline"
              className="hover:bg-white/9 rounded-full border-white/15 bg-transparent px-7 py-6 text-base text-[#f6efe6]"
            >
              Explore the flow
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
