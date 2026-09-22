// Colour identity for each topic. This is the single source of truth for topic colour —
// the lobby pages, the lesson chrome, and the scroll-progress bar all read from it, so a
// new topic only has to be added here once.
import type { TopicId } from "@/content/topics";

export interface TopicTheme {
  panel:    string;   // saturated pastel background
  soft:     string;   // light tint background
  text:     string;   // accent text
  dot:      string;   // solid swatch
  sticker:  string;   // sticker fill
  /**
   * Scroll-progress bar fill — the one saturated topic mark allowed inside a lesson,
   * because it sits on the nav's bottom edge, far from any diagram. See tokens.ts.
   */
  progress: string;
}

export const TOPIC_THEME: Record<TopicId, TopicTheme> = {
  "cell-biology": {
    panel: "bg-emerald-200", soft: "bg-emerald-50", text: "text-emerald-700",
    dot: "bg-emerald-500", sticker: "bg-lime-300",
    progress: "bg-emerald-500",
  },
  genetics: {
    panel: "bg-violet-200", soft: "bg-violet-50", text: "text-violet-700",
    dot: "bg-violet-500", sticker: "bg-pink-300",
    progress: "bg-violet-500",
  },
  ecosystems: {
    panel: "bg-sky-200", soft: "bg-sky-50", text: "text-sky-700",
    dot: "bg-sky-500", sticker: "bg-amber-300",
    progress: "bg-sky-500",
  },
};
