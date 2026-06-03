import React from "react";

const GradientBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080908]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(247,242,232,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(247,242,232,0.045)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GradientBackground;
