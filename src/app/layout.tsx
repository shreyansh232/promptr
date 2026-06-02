import "@/styles/globals.css";
import { type Metadata } from "next";
import GradientBackground from "@/components/ui/gradient-background";
import { SessionProvider } from "next-auth/react";
import { auth } from "auth";
import { Toaster } from "react-hot-toast";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Promptr",
  description: "Learn from best",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en" className="dark">
      <body className={`${sans.variable} ${mono.variable} bg-background text-foreground`}>
        <SessionProvider session={session}>
          <GradientBackground>{children}</GradientBackground>
          <Toaster />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
