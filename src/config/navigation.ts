export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Missions", href: "/missions" },
  { label: "Lab", href: "/lab" },
  { label: "FAQ", href: "/#faq" },
];

export const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Missions", href: "/missions" },
    { label: "Lab", href: "/lab" },
  ],
  resources: [
    { label: "FAQ", href: "/#faq" },
    { label: "Documentation", href: "/#workflow" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};
