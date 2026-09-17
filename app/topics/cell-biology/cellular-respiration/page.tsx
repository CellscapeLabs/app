import Link from "next/link";
import type { Metadata } from "next";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import { LessonProgress } from "@/components/lessons/LessonProgress";
import { ScrollHint } from "@/components/lessons/ScrollHint";
import {
  CellularRespirationProvider,
  CellularRespirationViewer,
  CellularRespirationPanel,
} from "@/components/visualizations/CellularRespirationVisualization";
import { RespirationSimulator } from "@/components/visualizations/RespirationSimulator";

export const metadata: Metadata = {
  title: "Cellular Respiration — Cell Biology · Cellscape",
  description:
    "Break the respiration pipeline with oxygen loss, cyanide, and uncouplers to see how glycolysis, the Krebs cycle, and the electron transport chain depend on each other.",
};

const KEY_CONCEPTS = [
  {
    icon: "🔋",
    heading: "Most ATP comes last",
    body: "Glycolysis yields just 2 ATP. The Krebs cycle adds 2 more. The electron transport chain produces ~32 — about 89% of the total. The first two stages matter mainly because they generate NADH and FADH₂ to power the ETC.",
  },
  {
    icon: "📍",
    heading: "Location = stage",
    body: "Glycolysis happens in the cytoplasm (no organelle needed). The Krebs cycle runs in the mitochondrial matrix. The ETC sits on the inner mitochondrial membrane. Each stage feeds the next.",
  },
  {
    icon: "💨",
    heading: "Oxygen is the finish line",
    body: "O₂ doesn't participate until the very last step — accepting electrons at Complex IV. Without it, the entire ETC backs up. ATP production drops from ~36 to just 2, forcing the cell into fermentation.",
  },
] as const;

export default function CellularRespirationPage() {
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
        <LessonProgress color="emerald" />
      </nav>
      <ScrollHint />

      <main className="mx-auto max-w-6xl px-6 pb-24">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 pt-8 pb-6 text-xs text-zinc-400" aria-label="Breadcrumb">
          <Link href="/topics" className="hover:text-zinc-600 transition-colors">Topics</Link>
          <span>/</span>
          <Link href="/topics/cell-biology" className="hover:text-zinc-600 transition-colors">Cell Biology</Link>
          <span>/</span>
          <span className="text-zinc-600 font-medium">Cellular Respiration</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Cell Biology</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">20 min</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-5xl">
            Cellular Respiration
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Every contraction, thought, and cell division runs on ATP. Your cells make it with a
            three-stage pipeline where every step depends on the next. Start by breaking it — take
            away oxygen, add a poison — and watch what fails. Then step through how it works.
          </p>
        </div>

        {/* ── Simulator ── */}
        <section className="mb-14" aria-labelledby="sim-heading">
          <div className="mb-4 max-w-3xl">
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">What if?</div>
            <h2 id="sim-heading" className="text-2xl font-black tracking-tight text-zinc-900">
              Break the pipeline
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              The map shows one glucose molecule&apos;s path through a working cell. Flip a switch to
              remove oxygen or add a drug, then follow the red ✕ to see where the pipeline jams — and
              how the problem spreads backward to the other stages.
            </p>
          </div>
          <RespirationSimulator />
        </section>

        {/* ── How it works ── */}
        <div className="mb-5 max-w-3xl">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">How it works</div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Step through the three stages</h2>
        </div>

        {/* ── Two-column interactive section ── */}
        <CellularRespirationProvider>
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

            {/* Left column — sticky viewer */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
              <CellularRespirationViewer />
              <p className="mt-2 text-center text-xs text-zinc-400">
                Click a stage tab or drag the diagram to explore
              </p>
            </div>

            {/* Right column — scrollable content */}
            <div className="space-y-6">

              {/* Stage info panel — stays in sync with the viewer */}
              <CellularRespirationPanel />

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

              {/* Stage summary table */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">
                  At a glance
                </h2>
                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        <th className="px-4 py-3">Stage</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">ATP</th>
                        <th className="px-4 py-3">Other outputs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        ["Glycolysis",    "Cytoplasm",             "2 net",  "2 NADH, 2 pyruvate"],
                        ["Krebs Cycle",   "Mitochondrial matrix",  "2",      "8 NADH, 2 FADH₂, 6 CO₂"],
                        ["ETC",           "Inner mito. membrane",  "~32",    "H₂O (O₂ required)"],
                        ["Total",         "—",                     "~36",    "6 CO₂, 6 H₂O"],
                      ].map(([stage, loc, atp, out]) => (
                        <tr key={stage} className={`bg-white transition-colors hover:bg-zinc-50 ${stage === "Total" ? "font-semibold" : ""}`}>
                          <td className="px-4 py-3 font-medium text-zinc-900">{stage}</td>
                          <td className="px-4 py-3 text-zinc-500">{loc}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{atp}</td>
                          <td className="px-4 py-3 text-zinc-500">{out}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* When it goes wrong */}
              <section className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-5">
                <h2 className="mb-2 text-base font-bold text-zinc-900">
                  What happens without oxygen? Fermentation.
                </h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  When O₂ runs out, the ETC and Krebs cycle shut down. Cells fall back on
                  fermentation — a shortcut that regenerates NAD⁺ so glycolysis can keep
                  running. In muscle cells this produces lactic acid (the burn during intense
                  exercise). In yeast it produces ethanol and CO₂. Either way, yield drops
                  to just <strong>2 ATP per glucose</strong> — 18× less than aerobic respiration.
                </p>
              </section>

              {/* Quick recap */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
                <ol className="space-y-2.5">
                  {[
                    ["Glycolysis",          "Splits glucose (C₆) into 2 pyruvate (C₃) in the cytoplasm. Net 2 ATP + 2 NADH. No oxygen needed."],
                    ["Pyruvate oxidation",   "Each pyruvate loses one carbon as CO₂ and becomes Acetyl-CoA. Produces 1 NADH per pyruvate. Happens twice."],
                    ["Krebs cycle",         "Acetyl-CoA enters the cycle in the matrix. Per glucose: 2 ATP, 6 NADH, 2 FADH₂, 4 CO₂. All carbon released."],
                    ["ETC",                 "NADH and FADH₂ electrons drive H⁺ pumping. H⁺ gradient spins ATP synthase (chemiosmosis). ~32 ATP."],
                    ["Oxygen's role",       "Final electron acceptor at Complex IV. O₂ + 4H⁺ + 4e⁻ → 2H₂O. Without O₂, the chain backs up and stops."],
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
                <Link href="/topics/cell-biology/osmosis"
                  className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50">
                  ← Osmosis &amp; Diffusion
                </Link>
                <Link href="/topics/cell-biology"
                  className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600">
                  ↩ Cell Biology
                </Link>
              </div>

            </div>
          </div>
        </CellularRespirationProvider>

      </main>
    </div>
  );
}
