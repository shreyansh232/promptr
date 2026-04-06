"use client";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

const LoginGithub = () => {
  return (
    <div className="mt-3">
      <Button
        variant="outline"
        type="button"
        className="w-full rounded-full border-white/15 bg-transparent py-6 text-[#f7f2ea] hover:bg-white/10 hover:text-[#f7f2ea]"
        onClick={() => login("github")}
      >
        <Github className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  );
};

export default LoginGithub;
