import Link from "next/link";
import { TOPICS } from "@/content/topics";
import { notFound } from "next/navigation";
import { MitosisEmblem } from "@/components/visualizations/MitosisAnimation";
import { MeiosisEmblem } from "@/components/visualizations/MeiosisAnimation";
import { OrganelleEmblem } from "@/components/visualizations/OrganellesVisualization";
import type React from "react";

// Add an emblem here for each new lesson as it's built
const EMBLEMS: Record<string, React.ComponentType<{ className?: string }>> = {
  mitosis: MitosisEmblem,
  meiosis: MeiosisEmblem,
  organelles: OrganelleEmblem,
};

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const topic = TOPICS.find((t) => t.id === slug);
  return { title: topic ? `${topic.title} — Cellscape` : "Not Found" };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = TOPICS.find((t) => t.id === slug);
  if (!topic) notFound();

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-200">
              c
            </div>
            <span className="font-black text-zinc-900 tracking-tight">Cellscape</span>
          </Link>
          <Link href="/topics" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            ← All Topics
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-600">
          Topic
        </div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-4">{topic.title}</h1>
        <p className="text-lg text-zinc-500 mb-12 max-w-xl">{topic.description}</p>

        {topic.lessons.length > 0 ? (
          <div>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Lessons
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {topic.lessons.map((lesson) => {
                const Emblem = EMBLEMS[lesson.id];
                return (
                  <Link
                    key={lesson.id}
                    href={`/topics/${topic.id}/${lesson.slug}`}
                    className="group relative block aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-300"
                  >
                    {/* Emblem illustration — sits on light background */}
                    {Emblem && (
                      <div className="absolute inset-0 p-4 opacity-90 group-hover:opacity-100 transition-opacity">
                        <Emblem className="w-full h-full" />
                      </div>
                    )}

                    {/* Gradient fade from zinc-50 at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/75 to-transparent" />

                    {/* Title anchored at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-base font-bold leading-snug text-zinc-900">
                        {lesson.title}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-zinc-500">
                        {lesson.durationMinutes} min
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center">
            <div className="text-4xl mb-4">🔬</div>
            <p className="text-zinc-500 text-sm">
              Interactive lessons for {topic.title} are being built.
              <br />
              Check back soon.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
