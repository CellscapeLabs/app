import Link from "next/link";
import type { Metadata } from "next";
import { ScrollHint } from "@/components/lessons/ScrollHint";
import { LessonNav } from "@/components/lessons/LessonNav";
import {
  DnaReplicationProvider,
  DnaReplicationViewer,
  DnaReplicationPanel,
  EnzymeRoster,
} from "@/components/visualizations/DnaReplicationVisualization";

export const metadata: Metadata = {
  title: "DNA Replication — Genetics · Cellscape",
  description:
    "Open a replication fork and watch helicase, primase, DNA polymerase, and ligase copy DNA — including why the lagging strand is built in Okazaki fragments.",
};

const KEY_CONCEPTS = [
  {
    icon: "➡️",
    heading: "Only 5′ → 3′",
    body: "DNA polymerase can only add nucleotides to a 3′ end. Every other rule of replication — primers, leading vs. lagging strands, Okazaki fragments — follows from this one constraint.",
  },
  {
    icon: "↔️",
    heading: "Antiparallel templates",
    body: "Because the two template strands run in opposite directions, one new strand can follow the fork continuously while the other has to be built backward in short pieces.",
  },
  {
    icon: "🧬",
    heading: "Half old, half new",
    body: "Each daughter molecule keeps one parent strand. That's semiconservative replication — and it's why each strand can serve as a check on the other.",
  },
] as const;

export default function DnaReplicationPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <LessonNav topic="genetics" />
      <ScrollHint />

      <main className="mx-auto max-w-6xl px-6 pb-24">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 pt-8 pb-6 text-xs text-zinc-400" aria-label="Breadcrumb">
          <Link href="/topics" className="hover:text-zinc-600 transition-colors">Topics</Link>
          <span>/</span>
          <Link href="/topics/genetics" className="hover:text-zinc-600 transition-colors">Genetics</Link>
          <span>/</span>
          <span className="text-zinc-600 font-medium">DNA Replication</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">Genetics</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">18 min</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
            DNA Replication
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Before a cell divides, it copies all of its DNA — about 6 billion base pairs in a human
            cell, in a matter of hours. Open a replication fork and follow the team of enzymes that
            unzips, primes, builds, and seals two perfect copies.
          </p>
        </div>

        {/* ── Two-column interactive section ── */}
        <DnaReplicationProvider>
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

            {/* Left column — sticky viewer */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
              <DnaReplicationViewer />
              <p className="mt-2 text-center text-xs text-zinc-400">
                Click a stage tab, drag the diagram, or use the ← → keys
              </p>
            </div>

            {/* Right column — scrollable content */}
            <div className="space-y-6">

              {/* Stage info panel — stays in sync with the viewer */}
              <DnaReplicationPanel />

              {/* Enzyme roster — jumps the viewer to each enzyme's stage */}
              <section>
                <h2 className="mb-1 text-xl font-bold tracking-tight text-zinc-900">
                  Meet the enzymes
                </h2>
                <p className="mb-3 text-sm text-zinc-500">Tap one to see it at work in the fork.</p>
                <EnzymeRoster />
              </section>

              {/* Key concepts */}
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">
                  Three things to keep straight
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {KEY_CONCEPTS.map(({ icon, heading, body }) => (
                    <div key={heading} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <div className="mb-2 text-2xl">{icon}</div>
                      <h3 className="mb-1 text-sm font-bold text-zinc-900">{heading}</h3>
                      <p className="text-xs leading-relaxed text-zinc-500">{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Leading vs lagging */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">
                  Leading vs. lagging strand
                </h2>
                <div className="overflow-x-auto rounded-xl border border-zinc-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        <th className="px-4 py-3"></th>
                        <th className="px-4 py-3">Leading strand</th>
                        <th className="px-4 py-3">Lagging strand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        ["Direction built",   "5′ → 3′, toward the fork",  "5′ → 3′, away from the fork"],
                        ["Synthesis",         "Continuous",                "Discontinuous (Okazaki fragments)"],
                        ["RNA primers",       "One",                       "One per fragment"],
                        ["Ligase needed",     "Rarely",                    "To join every fragment"],
                      ].map(([row, lead, lag]) => (
                        <tr key={row} className="bg-white transition-colors hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{row}</td>
                          <td className="px-4 py-3 text-zinc-500">{lead}</td>
                          <td className="px-4 py-3 text-zinc-500">{lag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* History */}
              <section className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-5">
                <h2 className="mb-2 text-base font-bold text-zinc-900">
                  How do we know replication is semiconservative?
                </h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  In 1958, Matthew Meselson and Franklin Stahl grew bacteria on heavy nitrogen
                  (¹⁵N), then moved them to light nitrogen (¹⁴N). After one generation, all the DNA
                  had an intermediate density — ruling out the conservative model. After two
                  generations, half was intermediate and half was light — ruling out the dispersive
                  model. <strong>Only semiconservative replication fit both results.</strong>
                </p>
              </section>

              {/* Quick recap */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
                <ol className="space-y-2.5">
                  {[
                    ["Unzip",   "Helicase breaks H-bonds at the fork; topoisomerase relieves strain ahead; SSBs keep strands apart."],
                    ["Prime",   "Primase builds short RNA primers to give DNA polymerase a free 3′ end."],
                    ["Build",   "DNA polymerase III adds nucleotides 5′ → 3′ — continuously on the leading strand, in Okazaki fragments on the lagging strand."],
                    ["Clean up", "DNA polymerase I replaces RNA primers with DNA; DNA ligase seals the nicks."],
                    ["Result",  "Two identical DNA molecules, each with one original and one new strand."],
                  ].map(([term, desc], i) => (
                    <li key={term} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="pt-0.5">
                        <span className="text-sm font-semibold text-zinc-900">{term} — </span>
                        <span className="text-sm text-zinc-500">{desc}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Footer nav */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                <Link href="/topics/genetics/dna-structure"
                  className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50">
                  ← DNA Structure
                </Link>
                <Link href="/topics/genetics"
                  className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-700">
                  ↩ Genetics
                </Link>
              </div>

            </div>
          </div>
        </DnaReplicationProvider>

      </main>
    </div>
  );
}
