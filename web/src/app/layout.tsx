import "@/styles/globals.css";
import { type Metadata } from "next";
import GradientBackground from "@/components/ui/gradient-background";
import { SessionProvider } from "@/components/SessionProvider";
import { auth } from "@/lib/auth";
import { Toaster } from "react-hot-toast";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { QueryProvider } from "@/components/providers/query-provider";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://promptrai.vercel.app"),
  title: {
    default: "Promptr – Test Your AI Agent Prompts",
    template: "%s | Promptr",
  },
  description:
    "Evaluate your AI agent prompts before they break in production. Run adversarial scenario tests, get a reliability score, and receive a targeted rewrite — in seconds.",
  alternates: {
    canonical: "./",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Promptr",
  },
  openGraph: {
    title: "Promptr – Test Your AI Agent Prompts",
    description:
      "Evaluate your AI agent prompts before they break in production. Run adversarial scenario tests, get a reliability score, and receive a targeted rewrite — in seconds.",
    url: "https://promptrai.vercel.app",
    siteName: "Promptr",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://promptrai.vercel.app/landing-preview.png",
        width: 2800,
        height: 1669,
        alt: "Promptr – Test and evaluate your AI agent prompts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promptr – Test Your AI Agent Prompts",
    description:
      "Evaluate your AI agent prompts before they break in production. Run adversarial scenario tests, get a reliability score, and receive a targeted rewrite — in seconds.",
    images: ["https://promptrai.vercel.app/landing-preview.png"],
  },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en" className="dark">
      <body
        className={`${sans.variable} ${mono.variable} bg-background text-foreground`}
      >
        <SessionProvider session={session}>
          <QueryProvider>
            <GradientBackground>{children}</GradientBackground>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#101510",
                  color: "#f7f2e8",
                  border: "1px solid rgba(247, 242, 232, 0.15)",
                  borderRadius: "0px",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                },
                success: {
                  iconTheme: {
                    primary: "#48d8a4",
                    secondary: "#101510",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ff8a3d",
                    secondary: "#101510",
                  },
                },
              }}
            />
            <Analytics />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
