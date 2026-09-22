// The shell every lesson page sits in.
//
// Title, duration, format, position in the topic, and the previous/next links are all
// derived from content/topics.ts — a lesson page supplies its biology and nothing else,
// and reordering the curriculum there re-points every link automatically.
import type React from "react";
import Link from "next/link";
import { getLesson, type TopicId } from "@/content/topics";
import { TOPIC_THEME } from "@/components/ui/topicTheme";
import { CONTROL, HEADING, TEXT } from "@/components/ui/tokens";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { LessonNav } from "@/components/lessons/LessonNav";
import { ScrollHint } from "@/components/lessons/ScrollHint";

export function LessonLayout({ topicId, lessonId, intro, children }: {
  topicId: TopicId;
  /** Lesson `id` from content/topics.ts. */
  lessonId: string;
  /** The opening paragraph, which is the one piece of the header a lesson writes itself. */
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  const { topic, lesson, index, prev, next } = getLesson(topicId, lessonId);
  const theme = TOPIC_THEME[topicId];
  const topicHref = `/topics/${topic.id}`;

  const prevLink = prev
    ? { href: `${topicHref}/${prev.slug}`, text: `← ${prev.title}` }
    : { href: topicHref, text: `← ${topic.title}` };
  const nextLink = next
    ? { href: `${topicHref}/${next.slug}`, text: `Next: ${next.title} →` }
    : { href: topicHref, text: `↩ Back to ${topic.title}` };

  return (
    <div className="min-h-screen bg-white">
      <LessonNav topic={topicId} />
      <ScrollHint />

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <nav className={`flex flex-wrap items-center gap-1.5 pt-8 pb-6 text-xs ${TEXT.muted}`} aria-label="Breadcrumb">
          <Link href="/topics" className="transition-colors hover:text-zinc-950">Topics</Link>
          <span aria-hidden="true">/</span>
          <Link href={topicHref} className="transition-colors hover:text-zinc-950">{topic.title}</Link>
          <span aria-hidden="true">/</span>
          <span className={`font-medium ${TEXT.heading}`}>{lesson.title}</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-zinc-800">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
              {topic.title}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">{lesson.format}</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
              {lesson.durationMinutes} min
            </span>
            <span className={`rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700`}>
              Lesson {index + 1} of {topic.lessons.length}
            </span>
          </div>
          <h1 className={`${HEADING.page} ${TEXT.heading}`}>{lesson.title}</h1>
          <div className={`mt-3 max-w-2xl text-lg leading-relaxed ${TEXT.body}`}>{intro}</div>
        </header>

        {children}

        <nav aria-label="Lesson navigation" className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-8">
          <Link href={prevLink.href}
            className={`rounded-full border-[1.5px] border-zinc-900 bg-white px-6 py-2.5 text-sm font-bold text-zinc-900 transition-all hover:shadow-[2px_2px_0_0_#18181b] ${CONTROL.focus}`}>
            {prevLink.text}
          </Link>
          <Link href={nextLink.href}
            className={`rounded-full border-[1.5px] border-zinc-900 px-6 py-2.5 text-sm font-bold transition-all hover:shadow-[2px_2px_0_0_#18181b] ${CONTROL.primary} ${CONTROL.focus}`}>
            {nextLink.text}
          </Link>
        </nav>
      </main>

      <SiteFooter />
    </div>
  );
}
