import Link from "next/link";
import type { Metadata } from "next";
import {
  MeiosisProvider,
  MeiosisViewer,
  MeiosisPanel,
} from "@/components/visualizations/MeiosisAnimation";

export const metadata: Metadata = {
  title: "Meiosis — Cell Biology · Cellscape",
  description:
    "Learn how meiosis produces 4 genetically unique haploid cells through two divisions. Explore homologous pairing, crossing over, and independent assortment.",
};

const KEY_CONCEPTS = [
  {
    icon: "÷2",
    heading: "2n → n",
    body: "Meiosis halves the chromosome count from diploid (2n = 46) to haploid (n = 23), so that fertilization restores the diploid number without doubling it every generation.",
  },
  {
    icon: "🔀",
    heading: "Crossing Over",
    body: "In Prophase I, non-sister chromatids of homologous chromosomes exchange segments at chiasmata — physically shuffling alleles and creating chromosomes that are neither fully maternal nor fully paternal.",
  },
  {
    icon: "🎲",
    heading: "8 Million+",
    body: "Independent assortment alone yields 2²³ ≈ 8 million possible chromosome combinations per gamete. Combined with crossing over, no two human gametes are genetically identical.",
  },
] as const;

export default function MeiosisPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-200">
              uc
            </div>
            <span className="font-black tracking-tight text-zinc-900">Cellscape</span>
          </Link>
          <Link href="/topics/cell-biology"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
            ← Cell Biology
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 pb-24">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 pt-8 pb-6 text-xs text-zinc-400" aria-label="Breadcrumb">
          <Link href="/topics" className="hover:text-zinc-600 transition-colors">Topics</Link>
          <span>/</span>
          <Link href="/topics/cell-biology" className="hover:text-zinc-600 transition-colors">Cell Biology</Link>
          <span>/</span>
          <span className="text-zinc-600 font-medium">Meiosis</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Cell Biology</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">16 min</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-5xl">Meiosis</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Every sperm and egg is the product of meiosis — two back-to-back divisions that halve
            the chromosome count and shuffle the genetic deck. Learn how one diploid cell becomes
            four unique haploid gametes.
          </p>
        </div>

        {/* ── Two-column interactive section ── */}
        <MeiosisProvider>
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

            {/* Left column — sticky viewer */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
              <MeiosisViewer />
              <p className="mt-2 text-center text-xs text-zinc-400">
                Click a phase tab or drag the cell to explore
              </p>
            </div>

            {/* Right column — scrollable content */}
            <div className="space-y-6">

              <MeiosisPanel />

              {/* Meiosis I vs II */}
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">Two very different divisions</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-600">Meiosis I — Reductional</div>
                    <p className="text-sm leading-relaxed text-zinc-600">
                      Homologous chromosomes separate. Chromosome number halves: 2n → n.
                      Sister chromatids stay joined. This division is unique to meiosis.
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-sky-600">Meiosis II — Equational</div>
                    <p className="text-sm leading-relaxed text-zinc-600">
                      Sister chromatids separate — essentially mitosis on haploid cells.
                      Chromosome count stays at n. Two cells → four cells.
                    </p>
                  </div>
                </div>
              </section>

              {/* Why it matters */}
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">Why meiosis matters</h2>
                <p className="mb-4 text-sm leading-relaxed text-zinc-500">
                  Meiosis is the engine of sexual reproduction and genetic diversity. Without it,
                  chromosome counts would double with every fertilization and allele combinations
                  would never shuffle — evolution would grind to a halt.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {KEY_CONCEPTS.map(({ icon, heading, body }) => (
                    <div key={heading} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <div className="mb-2 text-2xl font-black text-zinc-700">{icon}</div>
                      <h3 className="mb-1 text-sm font-bold text-zinc-900">{heading}</h3>
                      <p className="text-xs leading-relaxed text-zinc-500">{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Meiosis vs Mitosis */}
              <section className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-5">
                <h2 className="mb-2 text-base font-bold text-zinc-900">Meiosis vs. Mitosis</h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  Mitosis produces <strong>2 identical diploid cells</strong> for growth and repair —
                  no mixing, no reduction. Meiosis produces <strong>4 genetically unique haploid cells</strong> for
                  reproduction. The key differences: meiosis has two divisions, includes synapsis and
                  crossing over in Prophase I, and separates homologs (not sister chromatids) in the
                  first division. Never confuse them on an exam.
                </p>
              </section>

              {/* Quick recap */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
                <ol className="space-y-2.5">
                  {[
                    ["Interphase", "DNA replicated; centrosomes duplicated — ready for two divisions."],
                    ["Prophase I", "Homologs pair (synapsis); crossing over shuffles alleles."],
                    ["Metaphase I", "Bivalents align at equator; orientation is random (independent assortment)."],
                    ["Anaphase I", "Homologs separate to poles; chromosome number halves (2n → n)."],
                    ["Telophase I", "Two haploid cells form — each chromosome still has 2 chromatids."],
                    ["Metaphase II", "Individual chromosomes align in both cells — like mitosis."],
                    ["Anaphase II", "Sister chromatids finally separate in both cells."],
                    ["4 Haploid Cells", "Cytokinesis II → 4 genetically unique haploid gametes."],
                  ].map(([phase, desc], i) => (
                    <li key={phase} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="pt-0.5">
                        <span className="text-sm font-semibold text-zinc-900">{phase} — </span>
                        <span className="text-sm text-zinc-500">{desc}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Footer nav */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                <Link href="/topics/cell-biology"
                  className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50">
                  ← Back to Cell Biology
                </Link>
                <Link href="/topics/cell-biology/mitosis"
                  className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600">
                  Compare: Mitosis →
                </Link>
              </div>

            </div>
          </div>
        </MeiosisProvider>

      </main>
    </div>
  );
}
