import React from "react";

const GradientBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(138,156,120,0.16),transparent_34%),linear-gradient(180deg,#f5f1e8_0%,#f2ede4_34%,#ece5da_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(69,63,52,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(69,63,52,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_72%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GradientBackground;
