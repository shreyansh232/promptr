import React from "react";
import Link from "next/link";
import { GithubLogo, Star } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { auth } from "auth";
import { UserMenu } from "./UserMenu";
import { PromptrLogo } from "./PromptrLogo";

import { navLinks } from "@/config/navigation";

export async function Header() {
  const session = await auth();
  return (
    <header className="bg-[var(--landing-ink)]/90 fixed inset-x-0 top-0 z-50 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link
          href="/"
          aria-label="Promptr home"
          className="flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
        >
          <PromptrLogo />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://github.com/shreyansh232/promptr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:border-[var(--landing-signal)]/45 hidden h-9 items-center gap-2 border border-[var(--landing-line)] px-3 font-mono text-xs text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-paper)] sm:inline-flex"
          >
            <GithubLogo size={16} aria-hidden="true" />
            Star on GitHub
            <Star
              size={14}
              weight="fill"
              className="text-[var(--landing-signal)]"
              aria-hidden="true"
            />
          </a>
          {!session?.user ? (
            <Button
              asChild
              className="h-10 rounded-none bg-[var(--landing-signal)] px-4 font-mono text-xs uppercase tracking-[0.1em] text-[var(--landing-ink)] shadow-none hover:bg-[var(--landing-signal-strong)]"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          ) : (
            <UserMenu name={session?.user?.name} image={session?.user?.image} />
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[var(--landing-muted)] transition-colors duration-200 hover:text-[var(--landing-paper)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
    >
      {children}
    </Link>
  );
}

export default Header;
