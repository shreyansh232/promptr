import "@/styles/globals.css";
import { type Metadata } from "next";
import GradientBackground from "@/components/ui/gradient-background";
import { SessionProvider } from "next-auth/react";
import { auth } from "auth";
import { Toaster } from "react-hot-toast";
import { Instrument_Serif, Manrope } from "next/font/google";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
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
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} bg-background text-foreground`}>
        <SessionProvider session={session}>
          <GradientBackground>{children}</GradientBackground>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
