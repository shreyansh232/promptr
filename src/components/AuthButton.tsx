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
      className="w-full rounded-full bg-[#ff8a3d] px-5 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-[#ff9b5b] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Loading..." : label}
    </button>
  );
};

export default AuthButton;
