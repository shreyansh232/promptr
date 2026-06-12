"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { List, X, GithubLogo, Star, User, SignOut } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/config/navigation";

interface SessionProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
  } | null;
}

export function MobileMenu({ session }: SessionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="lg:hidden">
      {/* Hamburger Toggle Button */}
      <button
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
        className="flex h-10 w-10 items-center justify-center border border-[var(--landing-line)] bg-[var(--landing-ink)]/50 text-[var(--landing-paper)] hover:border-[var(--landing-signal)]/45 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
      >
        <List size={22} />
      </button>

      {/* Drawer Overlay & Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />

            {/* Sidebar content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="bg-[var(--landing-ink)] border-l border-[var(--landing-line)] fixed bottom-0 right-0 top-0 z-50 flex h-full w-4/5 max-w-sm flex-col p-6 text-[var(--landing-paper)] shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[var(--landing-line)]">
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--landing-muted)]">
                  Menu
                </span>
                <button
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center border border-[var(--landing-line)] text-[var(--landing-paper)] hover:border-[var(--landing-signal)]/45 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-5 py-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="font-mono text-sm uppercase tracking-wider text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-paper)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Action Blocks (GitHub Star & Session status) */}
              <div className="mt-auto flex flex-col gap-4 border-t border-[var(--landing-line)] pt-6">
                {/* GitHub link */}
                <a
                  href="https://github.com/shreyansh232/promptr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 border border-[var(--landing-line)] font-mono text-xs text-[var(--landing-muted)] transition-colors hover:border-[var(--landing-signal)]/45 hover:text-[var(--landing-paper)]"
                >
                  <GithubLogo size={18} aria-hidden="true" />
                  Star on GitHub
                  <Star
                    size={14}
                    weight="fill"
                    className="text-[var(--landing-signal)]"
                    aria-hidden="true"
                  />
                </a>

                {/* Session controls */}
                {!session?.user ? (
                  <Button
                    asChild
                    onClick={closeMenu}
                    className="h-11 rounded-none bg-[var(--landing-signal)] font-mono text-xs uppercase tracking-[0.1em] text-[var(--landing-ink)] shadow-none hover:bg-[var(--landing-signal-strong)]"
                  >
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3 rounded-[4px] border border-[var(--landing-line)] bg-white/[0.02] p-3">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt="avatar"
                          width={36}
                          height={36}
                          unoptimized
                          className="h-9 w-9 rounded-full object-cover border border-[var(--landing-line)]"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 font-semibold text-[#f5efe6]">
                          {session.user.name?.slice(0, 2).toUpperCase() ?? "P"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[var(--landing-paper)]">
                          {session.user.name ?? "Developer"}
                        </p>
                        <p className="truncate text-[10px] text-[var(--landing-muted)]">
                          {session.user.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/profile?from=landing"
                      onClick={closeMenu}
                      className="flex h-10 w-full items-center justify-center gap-2 border border-[var(--landing-line)] bg-white/[0.01] font-mono text-xs uppercase tracking-wider text-[var(--landing-muted)] hover:bg-[#48d8a4]/10 hover:text-[#6be0b9]"
                    >
                      <User size={14} className="text-[#48d8a4]" />
                      <span>View Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        closeMenu();
                        void logout();
                      }}
                      className="flex h-10 w-full items-center justify-center gap-2 border border-[#ff7777]/30 bg-[#ff5a5a]/5 font-mono text-xs uppercase tracking-wider text-[#ff7777] hover:bg-[#ff5a5a]/10 hover:text-[#ff9b9b]"
                    >
                      <SignOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileMenu;
