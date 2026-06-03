import Link from "next/link";
import { PromptrLogo } from "@/components/PromptrLogo";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Workflow", href: "/#workflow" },
      { label: "Public mission", href: "/#mission" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Practice",
    links: [
      { label: "Lab", href: "/lab" },
      { label: "Missions", href: "/missions" },
      { label: "Problems", href: "/problems/1" },
      { label: "Battles", href: "/battles" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/sign-up" },
      { label: "Profile", href: "/profile" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--landing-line)] bg-[var(--landing-ink)] px-4 py-10 sm:px-6 md:py-14">
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.2fr_1.8fr]">
        <div className="max-w-md">
          <PromptrLogo />
          <p className="mt-5 text-sm leading-7 text-[var(--landing-muted)]">
            An open-source prompt engineering practice lab for people who want
            their AI systems to follow instructions under pressure.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-[var(--landing-muted)]">
            <span className="border border-[var(--landing-line)] px-2.5 py-1">
              MIT licensed
            </span>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="font-mono text-xs uppercase text-[var(--landing-paper)]">
                {group.title}
              </h2>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--landing-muted)]">
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="transition-colors hover:text-[var(--landing-paper)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
