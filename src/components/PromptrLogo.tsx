import { cn } from "@/lib/utils";

interface PromptrLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function PromptrLogo({
  className,
  markClassName,
  showWordmark = true,
  wordmarkClassName,
}: PromptrLogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-[#f7f2e8]", className)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        style={{ color: "#b7ff5a" }}
        className={cn("h-10 w-10 shrink-0", markClassName)}
      >
        {/* Sharp outer square frame - slightly dim */}
        <rect
          x="8"
          y="8"
          width="48"
          height="48"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.4"
        />
        {/* Terminal Caret - bold and sharp */}
        <path
          d="M22 20 l12 12 -12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Vertical Blinking Cursor - thin and sharp */}
        <line
          x1="42"
          y1="20"
          x2="42"
          y2="44"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="square"
        />
      </svg>

      {showWordmark ? (
        <span className={cn("flex flex-col leading-none", wordmarkClassName)}>
          <span className="text-lg font-semibold tracking-wide">Promptr</span>
        </span>
      ) : null}
    </span>
  );
}
