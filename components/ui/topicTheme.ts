// Colour identity for each topic, used consistently on the home, topics, and topic pages.
import type { TopicId } from "@/content/topics";

export interface TopicTheme {
  panel:   string;   // saturated pastel background
  soft:    string;   // light tint background
  text:    string;   // accent text
  dot:     string;   // solid swatch
  sticker: string;   // sticker fill
}

export const TOPIC_THEME: Record<TopicId, TopicTheme> = {
  "cell-biology": { panel: "bg-emerald-200", soft: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", sticker: "bg-lime-300" },
  genetics:       { panel: "bg-violet-200",  soft: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  sticker: "bg-pink-300" },
  ecosystems:     { panel: "bg-sky-200",     soft: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     sticker: "bg-amber-300" },
};
