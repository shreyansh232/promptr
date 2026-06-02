"use client";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";

import { GoogleLogo } from "@phosphor-icons/react";

const LoginGoogle = () => {
  return (
    <div className="mt-3">
      <Button
        variant="outline"
        type="button"
        className="w-full rounded-full border-white/15 bg-transparent py-6 text-[#f7f2ea] hover:bg-white/10 hover:text-[#f7f2ea]"
        onClick={() => login("google")}
      >
        <GoogleLogo className="mr-2 h-4 w-4" aria-hidden="true" />
        Continue with Google
      </Button>
    </div>
  );
};

export default LoginGoogle;
