// Playful accents: a sticker-style label and a highlighter swipe behind text.
import type React from "react";

export function Sticker({ children, className = "bg-lime-300", tilt = "-rotate-2" }: {
  children: React.ReactNode; className?: string; tilt?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border-2 border-zinc-950 px-3 py-1 text-xs font-bold text-zinc-950 shadow-[2px_2px_0_0_#09090b] ${tilt} ${className}`}>
      {children}
    </span>
  );
}

/** Marker-pen highlight behind a word. The parent heading needs `isolate`. */
export function Highlight({ children, color = "bg-lime-300" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span aria-hidden="true" className={`absolute inset-x-[-0.12em] top-[0.52em] bottom-[0.06em] -z-10 -rotate-[1.5deg] rounded-md ${color}`} />
      {children}
    </span>
  );
}
