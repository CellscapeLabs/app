// Small glyph set for lesson "key concept" cards.
//
// These replace the emoji the lesson pages used to carry. Emoji render as a different
// drawing on every OS (and as colour images inside an otherwise monochrome card), which
// pulled against the rest of the visual system. These are stroke glyphs that inherit
// `currentColor`, so a card tints them with its topic accent.
//
// Keep the set small and reuse across lessons — a shared vocabulary of shapes is easier
// for a student to read than a unique picture per concept.
import type React from "react";

export type ConceptIconName =
  | "droplet" | "gradient" | "bolt" | "count" | "clock" | "compare"
  | "shuffle" | "branch" | "grid" | "layers" | "link" | "balance"
  | "ban" | "wind" | "pin" | "sun" | "cycle" | "ruler"
  | "arrows" | "arrowRight" | "helix";

const PATHS: Record<ConceptIconName, React.ReactNode> = {
  // Water
  droplet: <path d="M12 3c0 0-6.5 7.3-6.5 11.2a6.5 6.5 0 0 0 13 0C18.5 10.3 12 3 12 3Z" />,

  // A concentration gradient, drawn as a slope with molecules thinning downhill
  gradient: (
    <>
      <path d="M3 18 21 8" />
      <circle cx="6" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14" cy="10.6" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 21h18" opacity="0.4" />
    </>
  ),

  // Energy / ATP
  bolt: <path d="M13 2 5 13.5h5.5L9 22l8-11.5h-5.5L13 2Z" />,

  // A count or a ratio
  count: <path d="M5 20v-5M12 20V9M19 20V4" />,

  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),

  // Two things held side by side
  compare: (
    <>
      <circle cx="9" cy="12" r="6.5" />
      <circle cx="15" cy="12" r="6.5" />
    </>
  ),

  // Crossing over / recombination
  shuffle: (
    <>
      <path d="M3 7h3.5c1.6 0 2.4.9 3.4 2.4l3.2 5.2c1 1.5 1.8 2.4 3.4 2.4H20" />
      <path d="M3 17h3.5c1.6 0 2.4-.9 3.4-2.4l3.2-5.2c1-1.5 1.8-2.4 3.4-2.4H20" />
      <path d="m17.5 4.5 2.8 2.5-2.8 2.5M17.5 14.5l2.8 2.5-2.8 2.5" />
    </>
  ),

  // One thing becoming many possibilities
  branch: (
    <>
      <path d="M12 3v4M12 7 6 12M12 7l6 5M6 12v3M18 12v3" />
      <circle cx="12" cy="3" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="17" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),

  // Compartments / division of labour
  grid: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M12 3.5v17M3.5 12h17" />
    </>
  ),

  // Membrane-bound: a bilayer
  layers: (
    <>
      <rect x="3" y="5" width="18" height="4.5" rx="2.25" />
      <rect x="3" y="14.5" width="18" height="4.5" rx="2.25" />
    </>
  ),

  // Connected system
  link: (
    <>
      <path d="M10 14a4 4 0 0 1 0-5.6l2.4-2.4a4 4 0 0 1 5.6 5.6L16.8 12.8" />
      <path d="M14 10a4 4 0 0 1 0 5.6l-2.4 2.4a4 4 0 0 1-5.6-5.6L7.2 11.2" />
    </>
  ),

  // Equilibrium
  balance: (
    <>
      <path d="M12 4v16M6 20h12M4 8h16M4 8l-2.5 5.5a3.5 3.5 0 0 0 5 0L4 8ZM20 8l-2.5 5.5a3.5 3.5 0 0 0 5 0L20 8Z" />
    </>
  ),

  // Blocked / cannot cross
  ban: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6 6 12 12" />
    </>
  ),

  // A gas
  wind: <path d="M3 8h10a3 3 0 1 0-3-3M3 12h14a3 3 0 1 1-3 3M3 16h8a2.5 2.5 0 1 1-2.5 2.5" />,

  // A place
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),

  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
    </>
  ),

  cycle: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </>
  ),

  ruler: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="2" />
      <path d="M7 8v3M12 8v4M17 8v3" />
    </>
  ),

  // Antiparallel / two directions at once
  arrows: (
    <>
      <path d="M4 8h16M17 5l3 3-3 3" />
      <path d="M20 16H4M7 13l-3 3 3 3" />
    </>
  ),

  // One direction only
  arrowRight: <path d="M3 12h17M15 6.5 20.5 12 15 17.5" />,

  helix: (
    <>
      <path d="M8 2c0 5 8 5 8 10s-8 5-8 10" />
      <path d="M16 2c0 5-8 5-8 10s8 5 8 10" />
      <path d="M9.6 6.5h4.8M8.2 12h7.6M9.6 17.5h4.8" />
    </>
  ),
};

export function ConceptIcon({ name, className = "h-6 w-6" }: {
  name: ConceptIconName;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}
