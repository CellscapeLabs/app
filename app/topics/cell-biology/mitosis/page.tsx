import Link from "next/link";
import type { Metadata } from "next";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import {
  MitosisProvider,
  MitosisViewer,
  MitosisPanel,
} from "@/components/visualizations/MitosisAnimation";

export const metadata: Metadata = {
  title: "Mitosis — Cell Biology · Cellscape",
  description:
    "Learn how cells divide through mitosis. Step through all 6 phases with interactive animations.",
};

const KEY_CONCEPTS = [
  {
    icon: "🔢",
    heading: "46 → 46",
    body: "Mitosis is a copying process, not a halving one. Each daughter cell receives a complete copy of all 46 chromosomes — identical to the parent cell.",
  },
  {
    icon: "⏱️",
    heading: "1–2 Hours",
    body: "A full mitotic cycle takes about 1–2 hours in human cells. Interphase can last 18–20 hours — the actual division is the quick part.",
  },
  {
    icon: "🔬",
    heading: "Not Meiosis",
    body: "Mitosis produces 2 identical diploid cells for growth and repair. Meiosis produces 4 genetically diverse haploid cells for sexual reproduction.",
  },
] as const;

export default function MitosisPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <CellscapeIcon />
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
          <span className="text-zinc-600 font-medium">Mitosis</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Cell Biology</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">12 min</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-5xl">Mitosis</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Every cell in your body came from a single fertilized egg through billions of rounds
            of mitosis. Learn how one cell becomes two — with perfect genetic fidelity — every time.
          </p>
        </div>

        {/* ── Two-column interactive section ── */}
        {/* Left: sticky cell viewer. Right: phase info + lesson content. */}
        <MitosisProvider>
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

            {/* Left column — sticky viewer */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
              <MitosisViewer />
              <p className="mt-2 text-center text-xs text-zinc-400">
                Click a phase tab or drag the cell to explore
              </p>
            </div>

            {/* Right column — scrollable content */}
            <div className="space-y-6">

              {/* Phase info panel — stays in sync with the viewer */}
              <MitosisPanel />

              {/* Why it matters */}
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">Why mitosis matters</h2>
                <p className="mb-4 text-sm leading-relaxed text-zinc-500">
                  Mitosis is the engine of growth, maintenance, and repair in multicellular life.
                  Understanding it is foundational to understanding cancer, wound healing, and development.
                </p>
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

              {/* What can go wrong */}
              <section className="rounded-xl border-l-4 border-rose-400 bg-rose-50 px-6 py-5">
                <h2 className="mb-2 text-base font-bold text-zinc-900">What happens when mitosis goes wrong?</h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  Errors at the spindle assembly checkpoint can let chromosomes mis-segregate,
                  giving daughter cells the wrong number — <strong>aneuploidy</strong>.
                  When these errors affect genes that control the cell cycle, the result can be
                  uncontrolled division: <strong>cancer</strong>. Many chemotherapy drugs disrupt
                  spindle formation, freezing cells at metaphase so they self-destruct.
                </p>
              </section>

              {/* Quick recap */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
                <ol className="space-y-2.5">
                  {[
                    ["Interphase (G₂)", "Cell grows; DNA already duplicated — ready to divide."],
                    ["Prophase", "Chromosomes condense; nuclear envelope breaks down; spindle forms."],
                    ["Metaphase", "Chromosomes line up at equator; spindle checkpoint fires."],
                    ["Anaphase", "Sister chromatids pulled to opposite poles; cell elongates."],
                    ["Telophase", "Nuclear envelopes reform; chromosomes decondense; furrow starts."],
                    ["Cytokinesis", "Cleavage furrow pinches cell in two → 2 identical daughter cells."],
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
                  ← Cell Biology
                </Link>
                <Link href="/topics/cell-biology/meiosis"
                  className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600">
                  Next: Meiosis →
                </Link>
              </div>

            </div>
          </div>
        </MitosisProvider>

      </main>
    </div>
  );
}
