import React from "react";
import { useFormStatus } from "react-dom";

interface AuthButtonProps {
  label?: string;
}

const AuthButton = ({ label = "Submit" }: AuthButtonProps) => {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      type="submit"
      className={`${
        pending ? "bg-second" : "bg-second"
      } rounded-md w-full px-12 py-3 text-sm font-medium text-black`}
    >
      {pending ? "Loading..." : label}
    </button>
  );
};

export default AuthButton;
