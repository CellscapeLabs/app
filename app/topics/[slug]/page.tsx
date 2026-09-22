import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS } from "@/content/topics";
import { LESSON_EMBLEMS } from "@/components/lessons/lessonEmblems";
import { SiteNav } from "@/components/ui/SiteNav";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Sticker } from "@/components/ui/Sticker";
import { TopicMark } from "@/components/ui/TopicMark";
import { TOPIC_THEME } from "@/components/ui/topicTheme";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const topic = TOPICS.find((t) => t.id === slug);
  return {
    title: topic ? `${topic.title} — Cellscape` : "Not Found",
    description: topic ? `Interactive ${topic.title.toLowerCase()} lessons: ${topic.description.toLowerCase()}.` : undefined,
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = TOPICS.find((t) => t.id === slug);
  if (!topic) notFound();

  const theme = TOPIC_THEME[topic.id];
  const count = topic.lessons.length;
  const minutes = topic.lessons.reduce((n, l) => n + l.durationMinutes, 0);

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <SiteNav />

      <main>
        {/* ── Header ── */}
        <header className={`relative border-b-2 border-zinc-950 ${theme.panel}`}>
          <div aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(rgba(9,9,11,0.18)_1px,transparent_1px)] [background-size:22px_22px] opacity-50" />
          <div className="relative mx-auto max-w-6xl px-6 py-14 lg:py-16">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Link href="/topics" className="hover:text-zinc-950 hover:underline">Topics</Link>
              <span aria-hidden="true">/</span>
              <span className="text-zinc-950">{topic.title}</span>
            </nav>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-2 border-zinc-950 bg-white shadow-[4px_4px_0_0_#09090b]">
                <TopicMark id={topic.id} className="h-16 w-16" />
              </span>
              <div>
                <h1 className="font-display text-5xl font-extrabold leading-none tracking-[-0.035em] sm:text-7xl">{topic.title}</h1>
                <p className="mt-3 max-w-2xl text-lg text-zinc-800">{topic.description}</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {count ? (
                <>
                  <Sticker className="bg-white">{count} {count === 1 ? "lesson" : "lessons"}</Sticker>
                  <Sticker className={theme.sticker} tilt="rotate-1">~{minutes} min total</Sticker>
                </>
              ) : (
                <Sticker className="bg-amber-300">In development</Sticker>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          {count > 0 ? (
            <>
              <h2 className="font-display text-3xl font-extrabold tracking-tight">Lessons</h2>
              <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {topic.lessons.map((lesson, i) => {
                  const Emblem = LESSON_EMBLEMS[lesson.id];
                  return (
                    <li key={lesson.id}>
                      <Link href={`/topics/${topic.id}/${lesson.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-zinc-950 bg-white shadow-[4px_4px_0_0_#09090b] transition-all hover:-translate-y-1 hover:shadow-[6px_8px_0_0_#09090b]">
                        <div className={`relative aspect-[16/10] overflow-hidden border-b-2 border-zinc-950 ${theme.soft}`}>
                          {Emblem && (
                            <div className="absolute inset-x-10 top-5 bottom-0 transition-transform duration-500 group-hover:scale-110">
                              <Emblem className="h-full w-full" />
                            </div>
                          )}
                          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-950 bg-white font-display text-sm font-extrabold">
                            {i + 1}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-xl font-bold tracking-tight">{lesson.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-600">
                            <span className="rounded-full border-2 border-zinc-950 bg-white px-2 py-0.5 text-zinc-950">{lesson.format}</span>
                            <span>{lesson.durationMinutes} min</span>
                          </div>
                          <span className="mt-auto pt-5 text-sm font-bold">
                            Start lesson <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border-2 border-dashed border-zinc-950 bg-white p-10 text-center">
              <span className="mx-auto flex h-20 w-20 -rotate-6 items-center justify-center rounded-3xl border-2 border-zinc-950 bg-amber-200 shadow-[3px_3px_0_0_#09090b]">
                <TopicMark id={topic.id} className="h-14 w-14" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight">Lessons are growing here</h2>
              <p className="mt-3 text-zinc-600">
                We&apos;re building interactive {topic.title.toLowerCase()}{" "}lessons right now. In the meantime,
                there&apos;s plenty to explore in the other topics.
              </p>
              <div className="mt-7">
                <ButtonLink href="/topics">Browse other topics <span aria-hidden="true">→</span></ButtonLink>
              </div>
            </div>
          )}

          {/* ── Roadmap ── */}
          <section className="mt-16" aria-labelledby="coming-next">
            <h2 id="coming-next" className="font-display text-2xl font-extrabold tracking-tight">
              {count ? "Coming next" : "What we're building"}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {topic.upcoming.map((u, i) => (
                <li key={u} className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-zinc-400 font-display text-sm font-bold text-zinc-500">
                    {count + i + 1}
                  </span>
                  <span className="text-sm font-semibold text-zinc-600">{u}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
