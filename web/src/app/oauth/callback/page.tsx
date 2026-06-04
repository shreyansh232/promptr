"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isNew = searchParams.get("is_new") === "true";

  useEffect(() => {
    if (token) {
      // Set the access token cookie using standard document.cookie on client-side
      const secure = process.env.NODE_ENV === "production" ? "; secure" : "";
      document.cookie = `access_token=${token}; max-age=${60 * 60 * 24 * 7}; path=/${secure}`;

      // Redirect to onboarding if new user, else home
      if (isNew) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
      router.refresh();
    } else {
      router.push("/sign-in");
    }
  }, [token, isNew, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#10110f] text-[#f7f2e8]">
      <div className="flex flex-col items-center gap-4">
        <CircleNotch className="h-8 w-8 animate-spin text-[#48d8a4]" />
        <p className="font-mono text-sm tracking-wide">Logging you in...</p>
      </div>
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#10110f] text-[#f7f2e8]">
          <div className="flex flex-col items-center gap-4">
            <CircleNotch className="h-8 w-8 animate-spin text-[#48d8a4]" />
            <p className="font-mono text-sm tracking-wide">Loading...</p>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
