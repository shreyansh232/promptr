import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";

interface AuthShellProps {
  mode: "sign-in" | "sign-up";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({
  mode,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  const isSignIn = mode === "sign-in";

  return (
    <div className="min-h-screen bg-[#080908] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-none border border-white/10 bg-[#10110f] lg:grid-cols-[1fr_1.1fr]">
        <section className="relative hidden flex-col justify-between px-8 py-10 lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-3 font-mono text-sm text-[#8f978b] transition-colors hover:text-[#f7f2e8]"
          >
            Promptr
          </Link>

          <div className="max-w-sm">
            <h1 className="text-4xl font-semibold leading-[1.1] text-[#f7f2e8]">
              Write better prompts, one revision at a time.
            </h1>
            <p className="mt-4 text-base leading-7 text-[#8f978b]">
              Practice with real problems. Get clear feedback. Ship sharper
              prompts.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0b0c0a] px-6 py-8 text-[#f7f2e8] md:px-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-10">
          <div className="mx-auto flex h-full max-w-md flex-col justify-between">
            <div>
              <h2 className="mt-6 text-3xl font-semibold leading-tight text-[#f7f2e8]">
                {title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#8f978b]">
                {subtitle}
              </p>
            </div>

            <div className="mt-8">{children}</div>

            <div className="mt-8 flex items-center justify-between rounded-none border border-white/10 bg-[#10110f] px-4 py-4 text-sm text-[#8f978b]">
              <span>
                {isSignIn
                  ? "Need an account first?"
                  : "Already have an account?"}
              </span>
              <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#b7ff5a] hover:text-[#cbff82]"
              >
                {isSignIn ? "Sign up" : "Sign in"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
