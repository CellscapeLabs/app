import Link from "next/link";
import type { Metadata } from "next";
import { TOPICS, type LessonFormat } from "@/content/topics";
import { LESSON_EMBLEMS } from "@/components/lessons/lessonEmblems";
import { SiteNav } from "@/components/ui/SiteNav";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Sticker, Highlight } from "@/components/ui/Sticker";
import { TopicMark } from "@/components/ui/TopicMark";
import { TOPIC_THEME } from "@/components/ui/topicTheme";
import { Reveal } from "@/components/home/Reveal";
import { HeroCell } from "@/components/home/HeroCell";
import { ExploreMockup, PredictMockup, ExperimentMockup } from "@/components/home/StepMockups";

export const metadata: Metadata = {
  title: "Cellscape — Biology you can take apart",
  description:
    "Interactive biology lessons, virtual labs, and simulations for AP and intro college students. Free, no sign-up, works on your phone.",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_LESSONS = TOPICS.flatMap((t) => t.lessons.map((l) => ({ ...l, topic: t.id, href: `/topics/${t.id}/${l.slug}` })));
const LESSON_COUNT = ALL_LESSONS.length;
const NEWEST = ALL_LESSONS[ALL_LESSONS.length - 1];

const FORMAT_STYLE: Record<LessonFormat, { panel: string; sticker: string }> = {
  "Virtual lab":  { panel: "bg-emerald-200", sticker: "bg-lime-300" },
  "Simulator":    { panel: "bg-amber-200",   sticker: "bg-orange-300" },
  "Builder":      { panel: "bg-violet-200",  sticker: "bg-pink-300" },
  "Step-through": { panel: "bg-sky-200",     sticker: "bg-cyan-300" },
  "Explorer":     { panel: "bg-rose-200",    sticker: "bg-rose-300" },
};

const FEATURED = [
  { lesson: "photosynthesis",       body: "Run the leaf disk assay. Change light, CO₂, and temperature, then graph what happens." },
  { lesson: "cellular-respiration", body: "Cut off oxygen or add cyanide and watch the whole pipeline jam." },
  { lesson: "meiosis",              body: "Line up chromosomes, cross them over, and collect all 16 possible gametes." },
  { lesson: "dna-replication",      body: "Open a replication fork and predict each enzyme's next move." },
].flatMap(({ lesson, body }) => {
  const l = ALL_LESSONS.find((x) => x.id === lesson);
  return l ? [{ ...l, body }] : [];
});

const STEPS = [
  { n: "1", title: "Explore",    color: "bg-lime-300",   body: "Drag, tap, and scrub through a process until you can see how the pieces fit.", Mockup: ExploreMockup },
  { n: "2", title: "Predict",    color: "bg-violet-300", body: "Commit to an answer before the reveal — the fastest way to find what you don't know yet.", Mockup: PredictMockup },
  { n: "3", title: "Experiment", color: "bg-sky-300",    body: "Change the conditions, run trials, and compare results like a real lab.", Mockup: ExperimentMockup },
] as const;

const TICKER = [...ALL_LESSONS.map((l) => l.title), ...TOPICS.flatMap((t) => t.upcoming.slice(0, 1).map((u) => `${u.split(" — ")[0]} (soon)`))];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-zinc-950">
      <SiteNav />

      <main>
        {/* ── Hero ── */}
        <section className="relative">
          <div aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_65%_at_50%_35%,black,transparent)] opacity-70" />

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-12 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-20 lg:pb-24">
            <Reveal>
              <Link href={NEWEST.href} className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Sticker className="bg-pink-300">New lesson</Sticker>
                <span className="group-hover:underline">{NEWEST.title}</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>

              <h1 className="isolate mt-6 font-display text-[3.1rem] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[4.6rem]">
                Biology you can<br className="hidden sm:block" /> <Highlight>take apart.</Highlight>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-700">
                Interactive lessons, virtual labs, and simulations for AP and intro college biology.
                Run the experiment, break the pathway, build the cell — and see why it works.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/topics">
                  Start learning <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                </ButtonLink>
                <ButtonLink href="/topics/cell-biology/photosynthesis" variant="white">
                  Try the leaf disk lab
                </ButtonLink>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-zinc-700">
                {[`${LESSON_COUNT} hands-on lessons`, "Free, no sign-up", "Works on your phone"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-950 bg-lime-300 text-[10px] font-black">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.15}>
              <HeroCell />
            </Reveal>
          </div>
        </section>

        {/* ── Ticker ── */}
        <div className="relative -left-[2vw] w-[104vw] -rotate-1 border-y-2 border-zinc-950 bg-emerald-500 py-3" aria-hidden="true">
          <div className="flex w-max animate-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {TICKER.map((item) => (
                  <span key={`${copy}-${item}`} className="flex items-center font-display text-xl font-bold text-white">
                    <span className="px-6">{item}</span>
                    <span className="text-lime-300">✳</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Lesson formats ── */}
        <section id="formats" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
            <Reveal className="max-w-3xl">
              <Sticker className="bg-orange-300" tilt="rotate-2">Not another slideshow</Sticker>
              <h2 className="isolate mt-5 font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
                Every lesson is something you <Highlight color="bg-orange-200">do.</Highlight>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-700">
                Some lessons are labs. Some are simulations you can break. Some you build with your
                own hands. The ideas stick because you tested them.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED.map((f, i) => {
                const Emblem = LESSON_EMBLEMS[f.id];
                const style = FORMAT_STYLE[f.format];
                return (
                  <Reveal key={f.id} delay={i * 0.06} className="h-full">
                    <Link href={f.href}
                      className={`group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-zinc-950 bg-white shadow-[4px_4px_0_0_#09090b] transition-all hover:-translate-y-1 hover:shadow-[6px_8px_0_0_#09090b] ${i % 2 ? "sm:rotate-1" : "sm:-rotate-1"} hover:rotate-0`}>
                      <div className={`relative aspect-[4/3] overflow-hidden border-b-2 border-zinc-950 ${style.panel}`}>
                        {Emblem && (
                          <div className="absolute inset-x-6 top-5 bottom-0 transition-transform duration-500 group-hover:scale-110">
                            <Emblem className="h-full w-full" />
                          </div>
                        )}
                        <span className="absolute left-3 top-3">
                          <Sticker className={style.sticker}>{f.format}</Sticker>
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-display text-xl font-bold tracking-tight">{f.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.body}</p>
                        <span className="mt-auto pt-4 text-sm font-bold">
                          Open lesson <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
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
        <section id="how-it-works" className="scroll-mt-16 border-y-2 border-zinc-950 bg-amber-50">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <Reveal className="max-w-3xl">
              <Sticker className="bg-sky-300" tilt="-rotate-2">How a lesson works</Sticker>
              <h2 className="isolate mt-5 font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
                Explore. Predict. <Highlight color="bg-sky-200">Experiment.</Highlight>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-700">
                Built around how learning actually sticks: hands on the model, a guess before the
                answer, and a chance to test your idea.
              </p>
            </Reveal>

            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ n, title, color, body, Mockup }, i) => (
                <Reveal key={n} delay={i * 0.08} className="h-full">
                  <li className="relative flex h-full flex-col rounded-3xl border-2 border-zinc-950 bg-white">
                    <span className={`absolute -top-5 left-5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-950 font-display text-xl font-extrabold shadow-[2px_2px_0_0_#09090b] ${color}`}>
                      {n}
                    </span>
                    <div className="h-40 overflow-hidden rounded-t-3xl border-b-2 border-dashed border-zinc-300 pt-4">
                      <Mockup />
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-2xl font-bold tracking-tight">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Topics ── */}
        <section id="topics" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-3xl">
                <Sticker className="bg-violet-300" tilt="rotate-1">Topics</Sticker>
                <h2 className="isolate mt-5 font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
                  Pick where your <Highlight color="bg-violet-200">class</Highlight> is.
                </h2>
              </div>
              <ButtonLink href="/topics" variant="white" size="sm">All topics →</ButtonLink>
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {TOPICS.map((topic, i) => {
                const theme = TOPIC_THEME[topic.id];
                const count = topic.lessons.length;
                const available = count > 0;
                return (
                  <Reveal key={topic.id} delay={i * 0.06} className="h-full">
                    <Link href={`/topics/${topic.id}`}
                      className={`group flex h-full flex-col rounded-3xl border-2 border-zinc-950 p-6 transition-all ${
                        available ? `${theme.panel} shadow-[4px_4px_0_0_#09090b] hover:-translate-y-1 hover:shadow-[6px_8px_0_0_#09090b]` : `${theme.soft} border-dashed`
                      }`}>
                      <div className="flex items-start justify-between">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-zinc-950 bg-white">
                          <TopicMark id={topic.id} className="h-11 w-11" />
                        </span>
                        <Sticker className={available ? "bg-white" : "bg-amber-300"} tilt="rotate-3">
                          {available ? `${count} ${count === 1 ? "lesson" : "lessons"}` : "Coming soon"}
                        </Sticker>
                      </div>
                      <h3 className="mt-6 font-display text-3xl font-extrabold tracking-tight">{topic.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{topic.description}</p>
                      <span className="mt-auto pt-6 text-sm font-bold">
                        {available ? "Start exploring" : "See what's coming"}{" "}
                        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="px-6 pb-24">
          <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border-2 border-zinc-950 bg-emerald-800 px-8 py-16 text-center shadow-[6px_6px_0_0_#09090b] sm:px-16 lg:py-20">
            <div aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
            {[
              { id: "photosynthesis", pos: "left-[4%] top-[12%] -rotate-12" },
              { id: "dna-replication", pos: "right-[5%] top-[10%] rotate-6" },
              { id: "cellular-respiration", pos: "left-[8%] bottom-[8%] rotate-6" },
              { id: "meiosis", pos: "right-[7%] bottom-[10%] -rotate-6" },
            ].map(({ id, pos }) => {
              const Emblem = LESSON_EMBLEMS[id];
              return Emblem ? (
                <span key={id} aria-hidden="true"
                  className={`absolute hidden h-24 w-24 overflow-hidden rounded-2xl border-2 border-zinc-950 bg-white p-2 shadow-[3px_3px_0_0_#09090b] lg:block ${pos}`}>
                  <span className="block h-full w-full translate-y-[14%]"><Emblem className="h-full w-full" /></span>
                </span>
              ) : null;
            })}
            <div className="relative">
              <h2 className="isolate font-display text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-6xl">
                Start with <span className="text-lime-300">one lesson.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-emerald-100">
                Free, no sign-up, and it works on the phone in your pocket.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <ButtonLink href="/topics">Browse lessons <span aria-hidden="true">→</span></ButtonLink>
                <ButtonLink href="/topics/cell-biology/meiosis" variant="white">Try the gamete builder</ButtonLink>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
