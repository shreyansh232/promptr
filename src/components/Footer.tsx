import Link from "next/link";

const footerLinks = [
  { label: "Features", href: "/#features" },
  { label: "FAQ", href: "/#faq" },
  { label: "Practice", href: "/problems/1" },
  { label: "Dashboard", href: "/dashboard" },
];

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#0d0d0d] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#f0a067]">
            Promptr
          </div>
          <h3 className="mt-4 text-3xl text-[#fff5eb]">
            Prompt engineering, stripped to the useful parts.
          </h3>
          <p className="mt-4 text-sm leading-7 text-[#b8b0a5]">
            Draft the prompt, inspect the weak points, and make the next
            revision with intent.
          </p>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-[#b8b0a5]">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-[#fff5eb]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
