"use client";

import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0d0d0d] px-4 pb-20 pt-32 md:px-8 md:pb-28 md:pt-40">
      {/* Ambient glow behind headline */}
      <div className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 h-[420px] w-[640px] rounded-full bg-[#ff8a3d]/[0.04] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Pill badge */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#c9b9a8] backdrop-blur-sm">
          <Sparkle weight="fill" className="h-3 w-3 text-[#ff8a3d]" />
          Hands-on prompt engineering
        </div>

        {/* Headline — letter-spacing + word-spacing for readability */}
        <h1
          className="font-display text-4xl font-semibold leading-[1.18] text-[#fff6ee] sm:text-5xl md:text-6xl lg:text-[4.2rem] lg:leading-[1.12]"
          style={{ letterSpacing: "-0.01em", wordSpacing: "0.04em" }}
        >
          Improve Your AI Efficiency
          <br className="hidden sm:block" />
          {" "}by Learning to{" "}
          <span className="relative inline-block">
            <span className="relative z-10">Prompt Right</span>
            {/* Accent underline on key phrase */}
            <span className="absolute bottom-1 left-0 -z-0 h-[6px] w-full rounded-full bg-[#ff8a3d]/25" />
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="mx-auto mt-8 max-w-2xl text-[1.05rem] leading-[1.75] text-[#b0a799] md:text-lg md:leading-[1.8]"
          style={{ letterSpacing: "0.01em" }}
        >
          Practice with real prompt challenges. Get instant AI-powered scoring,
          actionable feedback, and improved suggestions — then level up
          with personalized problems that grow with you.
        </p>

        {/* CTA buttons */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard">
            <Button className="group rounded-full bg-[#ff8a3d] px-8 py-6 text-[15px] font-semibold text-[#111111] shadow-lg shadow-[#ff8a3d]/10 transition-all hover:bg-[#ff9b5b] hover:shadow-xl hover:shadow-[#ff8a3d]/15">
              Start practicing
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/#features">
            <Button
              variant="outline"
              className="rounded-full border-white/12 bg-transparent px-8 py-6 text-[15px] font-medium text-[#f0e8de] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              See how it works
            </Button>
          </Link>
        </div>

        {/* Social proof nudge */}
        <p className="mt-10 text-[13px] tracking-wide text-[#706a60]">
          Free &amp; open source · No account required to try
        </p>
      </div>
    </section>
  );
}
