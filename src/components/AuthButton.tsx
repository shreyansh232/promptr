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
      className="h-11 w-full rounded-none bg-[#b7ff5a] font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#10110f] transition hover:bg-[#cbff82] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? "Loading..." : label}
    </button>
  );
};

export default AuthButton;
