import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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
    <div className="min-h-screen bg-[#0d0d0d] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] lg:grid-cols-[1fr_1.1fr]">
        <section className="relative hidden flex-col justify-between px-8 py-10 lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm text-[#a0978a] transition-colors hover:text-[#f5efe6]"
          >
            Promptr
          </Link>

          <div className="max-w-sm">
            <h1 className="text-4xl leading-[0.95] text-[#f5efe6]">
              Write better prompts, one revision at a time.
            </h1>
            <p className="mt-4 text-base leading-7 text-[#6a6255]">
              Practice with real problems. Get clear feedback. Ship sharper
              prompts.
            </p>
          </div>
        </section>

        <section className="bg-[#171717] px-6 py-8 text-[#f7f2ea] md:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto flex h-full max-w-md flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[#a0978a]">
                {isSignIn ? "Welcome back" : "Create your account"}
              </div>
              <h2 className="mt-6 text-4xl leading-tight text-[#fff6ee]">
                {title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#a0978a]">
                {subtitle}
              </p>
            </div>

            <div className="mt-8">{children}</div>

            <div className="mt-8 flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-[#a0978a]">
              <span>
                {isSignIn
                  ? "Need an account first?"
                  : "Already have an account?"}
              </span>
              <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="inline-flex items-center gap-2 text-[#ff8a3d] hover:text-[#ff9b5b]"
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
