import React from "react";

interface AuthButtonProps {
  label?: string;
  pending?: boolean;
}

const AuthButton = ({ label = "Submit", pending = false }: AuthButtonProps) => {
  return (
    <button
      disabled={pending}
      type="submit"
      className="h-11 w-full rounded-none bg-[#48d8a4] font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#10110f] transition hover:bg-[#62e2b7] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? "Loading..." : label}
    </button>
  );
};

export default AuthButton;
