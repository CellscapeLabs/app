import Link from "next/link";
import type { Metadata } from "next";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import { LessonProgress } from "@/components/lessons/LessonProgress";
import {
  DnaStructureProvider,
  DnaStructureViewer,
  DnaStructurePanel,
  DnaSequenceBuilder,
} from "@/components/visualizations/DnaStructureVisualization";

export const metadata: Metadata = {
  title: "DNA Structure — Genetics · Cellscape",
  description:
    "Unwind the double helix, pair the bases, and zoom into a single nucleotide to see how DNA's structure stores genetic information.",
};

const KEY_CONCEPTS = [
  {
    icon: "📏",
    heading: "Same width everywhere",
    body: "A two-ring purine always pairs with a one-ring pyrimidine, so every rung is the same length. That's why the helix is a uniform ~2 nm wide — and why A–G or C–T pairs don't fit.",
  },
  {
    icon: "🔗",
    heading: "Strong rails, weak rungs",
    body: "Covalent phosphodiester bonds hold each backbone together. Only hydrogen bonds hold the two strands to each other, so DNA can be unzipped for copying without breaking the sequence.",
  },
  {
    icon: "↔️",
    heading: "Direction matters",
    body: "The strands are antiparallel: one runs 5′ → 3′, the other 3′ → 5′. Enzymes that copy DNA can only add to a 3′ end — you'll need this for DNA replication.",
  },
] as const;

export default function DnaStructurePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <CellscapeIcon />
            <span className="font-black tracking-tight text-zinc-900">Cellscape</span>
          </Link>
          <Link href="/topics/genetics"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
            ← Genetics
          </Link>
        </div>
        <LessonProgress color="violet" />
      </nav>

      <main className="mx-auto max-w-6xl px-6 pb-24">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 pt-8 pb-6 text-xs text-zinc-400" aria-label="Breadcrumb">
          <Link href="/topics" className="hover:text-zinc-600 transition-colors">Topics</Link>
          <span>/</span>
          <Link href="/topics/genetics" className="hover:text-zinc-600 transition-colors">Genetics</Link>
          <span>/</span>
          <span className="text-zinc-600 font-medium">DNA Structure</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">Genetics</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">15 min</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-5xl">
            DNA Structure
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Every trait you inherit is written in a molecule just 2 nanometers wide. Unwind the
            double helix, pair up its bases, and zoom into a single nucleotide to see how DNA&apos;s
            shape makes it both stable enough to store information and easy enough to copy.
          </p>
        </div>

        {/* ── Two-column interactive section ── */}
        <DnaStructureProvider>
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

            {/* Left column — sticky viewer */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
              <DnaStructureViewer />
              <p className="mt-2 text-center text-xs text-zinc-400">
                Click a stage tab, drag the diagram, or use the ← → keys
              </p>
            </div>

            {/* Right column — scrollable content */}
            <div className="space-y-6">

              {/* Stage info panel — stays in sync with the viewer */}
              <DnaStructurePanel />

              {/* Sequence builder — shares the sequence with the helix */}
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">
                  Build a strand
                </h2>
                <DnaSequenceBuilder />
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

              {/* Base table */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">
                  The four bases
                </h2>
                <div className="overflow-x-auto rounded-xl border border-zinc-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        <th className="px-4 py-3">Base</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Rings</th>
                        <th className="px-4 py-3">Pairs with</th>
                        <th className="px-4 py-3">H-bonds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        ["Adenine (A)",  "Purine",     "2", "Thymine (T)",  "2"],
                        ["Guanine (G)",  "Purine",     "2", "Cytosine (C)", "3"],
                        ["Thymine (T)",  "Pyrimidine", "1", "Adenine (A)",  "2"],
                        ["Cytosine (C)", "Pyrimidine", "1", "Guanine (G)",  "3"],
                      ].map(([base, type, rings, pair, hb]) => (
                        <tr key={base} className="bg-white transition-colors hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{base}</td>
                          <td className="px-4 py-3 text-zinc-500">{type}</td>
                          <td className="px-4 py-3 text-zinc-500">{rings}</td>
                          <td className="px-4 py-3 text-zinc-500">{pair}</td>
                          <td className="px-4 py-3 font-bold text-violet-600">{hb}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* History */}
              <section className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-5">
                <h2 className="mb-2 text-base font-bold text-zinc-900">
                  Who figured out the double helix?
                </h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  In 1950, Erwin Chargaff showed that DNA always contains equal amounts of A and T,
                  and of G and C. In 1952, Rosalind Franklin&apos;s X-ray diffraction image — known as
                  Photo 51, taken with her student Raymond Gosling — revealed a helix of constant width.
                  Building on both, James Watson and Francis Crick published their double-helix model
                  in 1953. <strong>Chargaff&apos;s ratios explained the pairing; Franklin&apos;s data
                  revealed the shape.</strong>
                </p>
              </section>

              {/* Quick recap */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
                <ol className="space-y-2.5">
                  {[
                    ["Double helix",  "Two strands twisted into a right-handed helix, ~2 nm wide, ~10 base pairs per turn."],
                    ["Nucleotide",    "Phosphate + deoxyribose sugar + nitrogenous base. Base on the 1′ carbon, phosphate on the 5′ carbon."],
                    ["Backbone",      "Alternating sugars and phosphates joined by covalent phosphodiester bonds (3′ –OH to 5′ phosphate)."],
                    ["Base pairing",  "A=T (2 H-bonds), G≡C (3 H-bonds). A purine always pairs with a pyrimidine, so %A = %T and %G = %C."],
                    ["DNA vs. RNA",   "RNA uses ribose (with a 2′ –OH), has uracil (U) instead of thymine, and is usually single-stranded."],
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
                <Link href="/topics"
                  className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50">
                  ← All Topics
                </Link>
                <Link href="/topics/genetics"
                  className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-700">
                  ↩ Genetics
                </Link>
              </div>

            </div>
          </div>
        </DnaStructureProvider>

      </main>
    </div>
  );
}
