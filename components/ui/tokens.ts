// Shared design tokens for the lesson ("workbench") register.
//
// Cellscape runs two deliberate registers:
//   · Lobby     — home, /topics, /topics/[slug], 404. Loud sticker system (see Sticker.tsx):
//                 2px outlines, 4px offset shadows, tilts, saturated pastels.
//   · Workbench — everything inside a lesson. Quieter, tuned for 15 minutes of reading.
//
// They share the display face, the topic accents (topicTheme.ts), and the radii scale, and
// meet at one frame step, so the two read as one product rather than two products.

/** The frame step without a background, for surfaces that supply their own tint. */
export const FRAME_BASE =
  "rounded-2xl border-[1.5px] border-zinc-900 shadow-[2px_2px_0_0_#18181b]";

/** The single frame step every lesson card, panel, and visualization uses. */
export const FRAME =
  "rounded-2xl border-[1.5px] border-zinc-900 bg-white shadow-[2px_2px_0_0_#18181b]";

/** The same frame without the offset shadow — for surfaces nested inside a framed one. */
export const FRAME_FLAT = "rounded-2xl border-[1.5px] border-zinc-900 bg-white";

/** Quiet inset surface: concept cards, tables, anything that should recede behind the copy. */
export const INSET = "rounded-xl border border-zinc-300 bg-zinc-50";

/**
 * Text ramp. Every value here clears WCAG AA on white at its intended size — nothing
 * lighter than `muted` is used for copy a student has to read.
 *   heading 16.1:1 · body 8.9:1 · muted 7.0:1
 */
export const TEXT = {
  heading: "text-zinc-950",
  body: "text-zinc-700",
  muted: "text-zinc-600",
} as const;

/**
 * Chrome is ink; colour is data.
 *
 * The visualizations spend nearly the whole spectrum on meaning — violet is a phosphate
 * group in DnaStructureVisualization and a maternal chromosome in GameteBuilder, emerald
 * is newly-built DNA, rose is an RNA primer, amber is helicase. So a saturated brand hue
 * placed beside a diagram competes with the diagram's own encoding: a student scanning a
 * violet-accented page for "the violet thing" gets more than one answer.
 *
 * Inside a lesson, therefore, interactive chrome (buttons, focus rings, filled pills,
 * icon marks, emphasised table cells) is ink. The topic hue survives only where it cannot
 * be mistaken for data: the nav dot, the scroll-progress bar, and section eyebrow type.
 * The lobby is unaffected — there are no diagrams there to compete with.
 */
export const CONTROL = {
  focus: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
  primary: "bg-zinc-900 text-white hover:bg-zinc-800",
} as const;

/** Small capitalised label that sits above a section heading. */
export const EYEBROW = "text-xs font-bold uppercase tracking-widest";

/** Heading scale inside a lesson. */
export const HEADING = {
  page: "font-display text-4xl font-extrabold tracking-tight lg:text-5xl",
  feature: "font-display text-2xl font-extrabold tracking-tight sm:text-3xl",
  section: "font-display text-xl font-bold tracking-tight",
} as const;
