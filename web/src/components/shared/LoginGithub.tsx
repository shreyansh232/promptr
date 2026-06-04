"use client";
import { Button } from "@/components/ui/button";
import { GithubLogoIcon } from "@phosphor-icons/react";

const LoginGithub = () => {
  return (
    <div className="mt-3">
      <Button
        variant="outline"
        type="button"
        className="h-11 w-full rounded-none border border-white/10 bg-white/[0.02] font-mono text-sm font-bold text-[#d8ddcf] hover:bg-white/5 hover:text-[#f7f2e8]"
        onClick={() => {
          window.location.href = "/api/auth/github/login";
        }}
      >
        <GithubLogoIcon className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  );
};

export default LoginGithub;
