// Sticky nav for lesson pages: logo, a back link to the lesson's topic, and the scroll progress bar.
import Link from "next/link";
import { getTopic, type TopicId } from "@/content/topics";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import { TOPIC_THEME } from "@/components/ui/topicTheme";
import { LessonProgress } from "@/components/lessons/LessonProgress";

export function LessonNav({ topic }: { topic: TopicId }) {
  const theme = TOPIC_THEME[topic];
  const title = getTopic(topic).title;
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <CellscapeIcon />
          <span className="font-display text-xl font-bold tracking-tight text-zinc-950">Cellscape</span>
        </Link>
        <Link href={`/topics/${topic}`}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-950">
          <span aria-hidden="true">&larr;</span>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${theme.dot}`} />
          {title}
        </Link>
      </div>
      <LessonProgress fill={theme.progress} />
    </nav>
  );
}
