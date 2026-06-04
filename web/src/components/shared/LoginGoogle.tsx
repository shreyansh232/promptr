"use client";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@phosphor-icons/react";

const LoginGoogle = () => {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  return (
    <div className="mt-3">
      <Button
        variant="outline"
        type="button"
        className="h-11 w-full rounded-none border border-white/10 bg-white/[0.02] font-mono text-xs uppercase tracking-[0.12em] text-[#d8ddcf] hover:bg-white/5 hover:text-[#f7f2e8]"
        onClick={() => {
          window.location.href = `${backendUrl}/auth/google/login`;
        }}
      >
        <GoogleLogo className="mr-2 h-4 w-4" aria-hidden="true" />
        Continue with Google
      </Button>
    </div>
  );
};

export default LoginGoogle;
