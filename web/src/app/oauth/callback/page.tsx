"use client";

import { useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { exchangeOAuthCode } from "@/actions/auth";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const handleCodeExchange = useCallback(
    async (code: string) => {
      const result = await exchangeOAuthCode(code);
      if (result?.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      } else {
        router.push("/sign-in");
      }
    },
    [router],
  );

  useEffect(() => {
    if (code) {
      handleCodeExchange(code).catch(() => {
        router.push("/sign-in");
      });
    } else {
      router.push("/sign-in");
    }
  }, [code, router, handleCodeExchange]);

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
