import Link from "next/link";
import type { Metadata } from "next";
import type React from "react";
import { TOPICS } from "@/content/topics";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import { LESSON_EMBLEMS } from "@/components/lessons/lessonEmblems";
import { Reveal } from "@/components/home/Reveal";
import { HeroCell } from "@/components/home/HeroCell";
import { ExploreMockup, PredictMockup, ExperimentMockup } from "@/components/home/StepMockups";

export const metadata: Metadata = {
  title: "Cellscape — Biology you can take apart",
  description:
    "Interactive biology lessons, virtual labs, and simulations for AP and intro college students. Free, no sign-up, works on your phone.",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const LESSON_COUNT = TOPICS.reduce((n, t) => n + t.lessons.length, 0);
const NEWEST = { title: "DNA Replication", href: "/topics/genetics/dna-replication" };

const FORMATS = [
  {
    tag: "Virtual lab",
    lesson: "photosynthesis",
    title: "Photosynthesis",
    href: "/topics/cell-biology/photosynthesis",
    body: "Run the leaf disk assay. Change light, CO₂, and temperature, then graph what happens.",
    tint: "bg-emerald-50",
    tagClass: "bg-emerald-100 text-emerald-800",
  },
  {
    tag: "What-if simulator",
    lesson: "cellular-respiration",
    title: "Cellular Respiration",
    href: "/topics/cell-biology/cellular-respiration",
    body: "Cut off oxygen or add cyanide and watch the whole pipeline jam.",
    tint: "bg-amber-50",
    tagClass: "bg-amber-100 text-amber-800",
  },
  {
    tag: "Builder",
    lesson: "meiosis",
    title: "Meiosis",
    href: "/topics/cell-biology/meiosis",
    body: "Line up chromosomes, cross them over, and collect all 16 possible gametes.",
    tint: "bg-violet-50",
    tagClass: "bg-violet-100 text-violet-800",
  },
  {
    tag: "Step-through",
    lesson: "dna-replication",
    title: "DNA Replication",
    href: "/topics/genetics/dna-replication",
    body: "Open a replication fork and predict each enzyme's next move.",
    tint: "bg-sky-50",
    tagClass: "bg-sky-100 text-sky-800",
  },
] as const;

const STEPS = [
  { n: "01", title: "Explore", body: "Drag, tap, and scrub through a process until you can see how the pieces fit.", Mockup: ExploreMockup },
  { n: "02", title: "Predict", body: "Commit to an answer before the reveal — it's the fastest way to find what you don't know yet.", Mockup: PredictMockup },
  { n: "03", title: "Experiment", body: "Change the conditions, run trials, and compare results like a real lab.", Mockup: ExperimentMockup },
] as const;

const TOPIC_ACCENT: Record<string, string> = {
  "cell-biology": "text-emerald-700",
  genetics: "text-violet-700",
  ecosystems: "text-sky-700",
};

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-emerald-600" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-sm font-semibold text-emerald-700">{children}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-950">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <CellscapeIcon />
            <span className="text-[17px] font-bold tracking-tight">Cellscape</span>
          </Link>
          <div className="flex items-center gap-7">
            <Link href="#how-it-works" className="hidden text-sm text-zinc-600 transition-colors hover:text-zinc-950 sm:block">How it works</Link>
            <Link href="#topics" className="hidden text-sm text-zinc-600 transition-colors hover:text-zinc-950 sm:block">Topics</Link>
            <Link href="/topics"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
              Start learning
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_65%_at_50%_35%,black,transparent)] opacity-70" />

          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pt-12 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-20 lg:pb-24">
            <Reveal>
              <Link href={NEWEST.href}
                className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 py-1 pl-1 pr-3 text-xs text-zinc-600 shadow-sm transition-colors hover:border-zinc-300">
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-semibold text-white">New</span>
                {NEWEST.title} lesson
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>

              <h1 className="mt-6 text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Biology you can<br />
                <span className="text-emerald-600">take apart.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
                Interactive lessons, virtual labs, and simulations for AP and intro college biology.
                Run the experiment, break the pathway, build the cell — and see why it works.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/topics"
                  className="group inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-950/10 transition-colors hover:bg-zinc-800">
                  Start learning
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <Link href="/topics/cell-biology/photosynthesis"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
                  Try the leaf disk lab
                </Link>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
                <li className="flex items-center gap-1.5"><Check />{LESSON_COUNT} interactive lessons</li>
                <li className="flex items-center gap-1.5"><Check />Free, no sign-up</li>
                <li className="flex items-center gap-1.5"><Check />Works on your phone</li>
              </ul>
            </Reveal>

            <Reveal delay={0.15}>
              <HeroCell />
            </Reveal>
          </div>
        </section>

        {/* ── Lesson formats ── */}
        <section id="formats" className="scroll-mt-16 border-y border-zinc-200/70 bg-zinc-50">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <Reveal className="max-w-3xl">
              <Eyebrow>Not another slideshow</Eyebrow>
              <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Every lesson is something you do.</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                Some lessons are labs. Some are simulations you can break. Some you build with your
                own hands. The ideas stick because you tested them.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FORMATS.map((f, i) => {
                const Emblem = LESSON_EMBLEMS[f.lesson];
                return (
                  <Reveal key={f.title} delay={i * 0.06} className="h-full">
                    <Link href={f.href}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-900/[0.06]">
                      <div className={`relative aspect-[4/3] overflow-hidden ${f.tint}`}>
                        {Emblem && (
                          <div className="absolute inset-x-6 top-5 bottom-0 transition-transform duration-500 group-hover:scale-105">
                            <Emblem className="h-full w-full" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${f.tagClass}`}>{f.tag}</span>
                        <h3 className="mt-3 text-lg font-semibold tracking-tight">{f.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.body}</p>
                        <span className="mt-auto pt-4 text-sm font-semibold text-zinc-950">
                          Open lesson <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── How a lesson works ── */}
        <section id="how-it-works" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <Reveal className="max-w-2xl">
              <Eyebrow>How a lesson works</Eyebrow>
              <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Explore. Predict. Experiment.</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                Built around how learning actually sticks: hands on the model, a guess before the
                answer, and a chance to test your idea.
              </p>
            </Reveal>

            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map(({ n, title, body, Mockup }, i) => (
                <Reveal key={n} delay={i * 0.08} className="h-full">
                  <li className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white">
                    <div className="h-40 border-b border-zinc-100 bg-gradient-to-b from-zinc-50 to-white">
                      <Mockup />
                    </div>
                    <div className="p-6">
                      <div className="font-mono text-xs font-semibold text-emerald-700">{n}</div>
                      <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Topics ── */}
        <section id="topics" className="scroll-mt-16 border-t border-zinc-200/70 bg-zinc-50">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <Eyebrow>Topics</Eyebrow>
                <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Pick where your class is.</h2>
              </div>
              <Link href="/topics" className="text-sm font-semibold text-zinc-950 hover:underline">All topics →</Link>
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {TOPICS.map((topic, i) => {
                const count = topic.lessons.length;
                const available = count > 0;
                const card = (
                  <div className={`flex h-full flex-col rounded-3xl border bg-white p-6 transition-all ${
                    available ? "border-zinc-200 group-hover:-translate-y-1 group-hover:border-zinc-300 group-hover:shadow-xl group-hover:shadow-zinc-900/[0.06]" : "border-dashed border-zinc-300 bg-white/60"
                  }`}>
                    <div className="flex h-16 items-center gap-2">
                      {available ? topic.lessons.slice(0, 3).map((lesson) => {
                        const Emblem = LESSON_EMBLEMS[lesson.id];
                        return (
                          <span key={lesson.id} className="relative h-16 w-16 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                            {Emblem && <span className="absolute inset-x-1.5 top-2 bottom-0"><Emblem className="h-full w-full" /></span>}
                          </span>
                        );
                      }) : (
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">In development</span>
                      )}
                    </div>
                    <h3 className={`mt-5 text-xl font-semibold tracking-tight ${available ? "" : "text-zinc-500"}`}>{topic.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{topic.description}</p>
                    <div className={`mt-auto pt-5 text-sm font-semibold ${available ? TOPIC_ACCENT[topic.id] ?? "text-zinc-950" : "text-zinc-400"}`}>
                      {available ? <>{count} {count === 1 ? "lesson" : "lessons"} <span aria-hidden="true">→</span></> : "Coming soon"}
                    </div>
                  </div>
                );
                return (
                  <Reveal key={topic.id} delay={i * 0.06} className="h-full">
                    {available ? (
                      <Link href={`/topics/${topic.id}`} className="group block h-full rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                        {card}
                      </Link>
                    ) : card}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="px-6 py-20 lg:py-28">
          <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-zinc-950 px-8 py-16 text-center sm:px-16 lg:py-20">
            <div aria-hidden="true" className="absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/25 blur-3xl" />
            <div aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,black,transparent)]" />
            <div className="relative">
              <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Start with one lesson.</h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-zinc-400">
                Free, no sign-up, and it works on the phone in your pocket.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/topics"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200">
                  Browse lessons
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <Link href="/topics/cell-biology/meiosis"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                  Try the gamete builder
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200/70">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <CellscapeIcon className="h-7 w-7" />
              <span className="font-bold tracking-tight">Cellscape</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              Interactive biology for AP and intro college students.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Topics</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              {TOPICS.map((t) => (
                <li key={t.id}><Link href={`/topics/${t.id}`} className="transition-colors hover:text-zinc-950">{t.title}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Try a lesson</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              {FORMATS.map((f) => (
                <li key={f.href}><Link href={f.href} className="transition-colors hover:text-zinc-950">{f.title}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-200/70">
          <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-zinc-400">© 2026 Cellscape</div>
        </div>
      </footer>
    </div>
  );
}
