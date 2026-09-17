// Sticky nav for lesson pages: logo, a back link to the lesson's topic, and the scroll progress bar.
import Link from "next/link";
import type { TopicId } from "@/content/topics";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import { TOPIC_THEME } from "@/components/ui/topicTheme";
import { LessonProgress } from "@/components/lessons/LessonProgress";

const TOPIC_LABEL: Record<TopicId, string> = {
  "cell-biology": "Cell Biology",
  genetics: "Genetics",
  ecosystems: "Ecosystems",
};

export function LessonNav({ topic }: { topic: TopicId }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <CellscapeIcon />
          <span className="font-display text-xl font-bold tracking-tight text-zinc-950">Cellscape</span>
        </Link>
        <Link href={`/topics/${topic}`}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950">
          <span aria-hidden="true">←</span>
          <span className={`h-2 w-2 rounded-full ${TOPIC_THEME[topic].dot}`} />
          {TOPIC_LABEL[topic]}
        </Link>
      </div>
      <LessonProgress color={topic === "genetics" ? "violet" : "emerald"} />
    </nav>
  );
}
