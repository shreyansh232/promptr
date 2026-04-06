"use client";
import { Button } from "./ui/button";
import { logout } from "@/actions/auth";

const LogOut = () => {
  return (
    <div>
      <Button
        onClick={() => logout()}
        variant="ghost"
        className="rounded-full border border-[#d7ccbd] bg-white px-4 text-[#4d473d] transition-colors hover:bg-[#ebe3d7] hover:text-[#1f221c]"
      >
        Log Out
      </Button>
    </div>
  );
};

export default LogOut;
