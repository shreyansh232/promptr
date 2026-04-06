import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "auth";
import { UserMenu } from "@/components/UserMenu";

export async function Header() {
  const session = await auth();
  return (
    <header className="fixed inset-x-0 top-6 z-50 px-4">
      <div className="bg-[#121212]/88 mx-auto flex w-full max-w-4xl items-center justify-between rounded-full border border-white/10 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <div>
            <span className="block text-base font-semibold text-[#f5efe6]">
              Promptr
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href="/#features">Features</NavLink>
          <NavLink href="/#faq">FAQ</NavLink>
          <NavLink href="/battles">Battles</NavLink>
          <NavLink href="/dashboard">Practice</NavLink>
        </nav>

        <div className="flex items-center space-x-3">
          {!session?.user ? (
            <>
              <Link href="/sign-in" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="rounded-full border border-transparent px-5 text-[#cfc7bc] hover:bg-white/10 hover:text-[#fff4ea]"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-full bg-[#ff8a3d] px-5 text-[#111111] hover:bg-[#ff9b5b]">
                  Start learning
                </Button>
              </Link>
            </>
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
      className="text-sm font-medium text-[#aaa297] transition-colors duration-200 hover:text-[#fff4ea]"
    >
      {children}
    </Link>
  );
}

export default Header;
