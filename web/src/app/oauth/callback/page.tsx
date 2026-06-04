"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { setCookie } from "cookies-next";

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      setCookie("access_token", token, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
      // Redirect to home after setting the cookie
      router.push("/");
      router.refresh();
    } else {
      router.push("/sign-in");
    }
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#10110f] text-[#f7f2e8]">
      <div className="flex flex-col items-center gap-4">
        <CircleNotch className="h-8 w-8 animate-spin text-[#48d8a4]" />
        <p className="font-mono text-sm tracking-wide">Logging you in...</p>
      </div>
    </div>
  );
}
