import Link from "next/link";
import type { Metadata } from "next";
import { TOPICS } from "@/content/topics";
import { LESSON_EMBLEMS } from "@/components/lessons/lessonEmblems";
import { SiteNav } from "@/components/ui/SiteNav";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Sticker, Highlight } from "@/components/ui/Sticker";
import { TopicMark } from "@/components/ui/TopicMark";
import { TOPIC_THEME } from "@/components/ui/topicTheme";

export const metadata: Metadata = {
  title: "Topics — Cellscape",
  description: "Browse Cellscape's interactive biology lessons by topic: cell biology, genetics, and ecosystems.",
};

const LESSON_COUNT = TOPICS.reduce((n, t) => n + t.lessons.length, 0);

export default function TopicsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <SiteNav />

      <main>
        {/* ── Header ── */}
        <header className="relative border-b-2 border-zinc-950 bg-lime-100">
          <div aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(#a3a3a3_1px,transparent_1px)] [background-size:22px_22px] opacity-25" />
          <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <Sticker className="bg-white">{TOPICS.length} topics · {LESSON_COUNT} lessons · more on the way</Sticker>
            <h1 className="isolate mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1] tracking-[-0.035em] sm:text-7xl">
              What do you want to <Highlight color="bg-white">explore</Highlight>?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-700">
              Every topic is a set of hands-on lessons you can do in any order. Jump to whatever
              your class is covering this week.
            </p>
          </div>
        </header>

        {/* ── Topics ── */}
        <div className="mx-auto max-w-6xl space-y-10 px-6 py-16 lg:py-20">
          {TOPICS.map((topic) => {
            const theme = TOPIC_THEME[topic.id];
            const count = topic.lessons.length;
            const minutes = topic.lessons.reduce((n, l) => n + l.durationMinutes, 0);
            return (
              <section key={topic.id} aria-labelledby={`topic-${topic.id}`}
                className={`grid overflow-hidden rounded-[2rem] border-2 border-zinc-950 shadow-[6px_6px_0_0_#09090b] lg:grid-cols-[5fr_7fr] ${count ? "" : "border-dashed"}`}>
                {/* Topic side */}
                <div className={`flex flex-col border-b-2 border-zinc-950 p-7 sm:p-9 lg:border-b-0 lg:border-r-2 ${theme.panel}`}>
                  <span className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-zinc-950 bg-white shadow-[3px_3px_0_0_#09090b]">
                    <TopicMark id={topic.id} className="h-14 w-14" />
                  </span>
                  <h2 id={`topic-${topic.id}`} className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{topic.title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-zinc-800">{topic.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {count ? (
                      <>
                        <Sticker className="bg-white" tilt="-rotate-1">{count} {count === 1 ? "lesson" : "lessons"}</Sticker>
                        <Sticker className={theme.sticker} tilt="rotate-1">~{minutes} min total</Sticker>
                      </>
                    ) : (
                      <Sticker className="bg-amber-300">In development</Sticker>
                    )}
                  </div>
                  <div className="mt-auto pt-8">
                    <ButtonLink href={`/topics/${topic.id}`} variant={count ? "dark" : "white"}>
                      {count ? `Open ${topic.title}` : "See the plan"} <span aria-hidden="true">→</span>
                    </ButtonLink>
                  </div>
                </div>

                {/* Lessons side — real lessons, then placeholders for what's coming */}
                <div className="bg-white p-4 sm:p-6">
                  <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-zinc-600">
                    {count ? "Lessons" : "Planned lessons"}
                  </div>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {topic.lessons.map((lesson) => {
                      const Emblem = LESSON_EMBLEMS[lesson.id];
                      return (
                        <li key={lesson.id}>
                          <Link href={`/topics/${topic.id}/${lesson.slug}`}
                            className="group flex items-center gap-3 rounded-2xl border-2 border-transparent p-2 transition-colors hover:border-zinc-950 hover:bg-zinc-50">
                            <span className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-950 ${theme.soft}`}>
                              {Emblem && <span className="absolute inset-x-1 top-1.5 bottom-0"><Emblem className="h-full w-full" /></span>}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-display text-base font-bold">{lesson.title}</span>
                              <span className="block text-xs text-zinc-500">{lesson.format} · {lesson.durationMinutes} min</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                    {topic.upcoming.map((u) => (
                      <li key={u} className="flex items-center gap-3 p-2">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 font-display text-lg font-bold text-zinc-300">?</span>
                        <span className="min-w-0">
                          <span className="block font-display text-base font-bold leading-snug text-zinc-600">{u}</span>
                          <span className="block text-xs text-zinc-600">Coming soon</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
