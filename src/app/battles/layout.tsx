import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battles",
  description:
    "Pitch your prompts against other prompt engineers in real-time battles. See whose prompt is more reliable and robust.",
};

export default function BattlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
