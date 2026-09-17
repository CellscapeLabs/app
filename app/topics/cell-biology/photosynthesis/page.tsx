import Link from "next/link";
import type { Metadata } from "next";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import {
  PhotosynthesisProvider,
  PhotosynthesisViewer,
  PhotosynthesisPanel,
} from "@/components/visualizations/PhotosynthesisVisualization";
import { LeafDiskLab } from "@/components/visualizations/LeafDiskLab";

export const metadata: Metadata = {
  title: "Photosynthesis — Cell Biology · Cellscape",
  description:
    "Run a virtual leaf disk lab to find what limits photosynthesis, then step through the light reactions and Calvin cycle inside the chloroplast.",
};

const KEY_CONCEPTS = [
  {
    icon: "☀️",
    heading: "Light reactions make the fuel",
    body: "The thylakoid membrane splits water, ferries electrons through PS II and PS I, and uses the resulting H⁺ gradient to produce ATP and NADPH. These are the energy carriers — not glucose. Glucose comes later.",
  },
  {
    icon: "🔄",
    heading: "Calvin cycle spends the fuel",
    body: "RuBisCO in the stroma fixes CO₂ into 3-PGA, which ATP and NADPH reduce to G3P. Three turns of the cycle fix 3 CO₂ and yield 1 net G3P. Six turns yield 1 glucose. The cycle doesn't use light directly — it uses the ATP and NADPH made by the light reactions.",
  },
  {
    icon: "📍",
    heading: "Location is everything",
    body: "Light reactions happen on the thylakoid membrane. The Calvin cycle runs in the stroma surrounding it. This spatial separation matters — NADPH and ATP must physically move from one compartment to the other. That handoff is the link between the two stages.",
  },
] as const;

export default function PhotosynthesisPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <CellscapeIcon />
            <span className="font-black tracking-tight text-zinc-900">Cellscape</span>
          </Link>
          <Link
            href="/topics/cell-biology"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Cell Biology
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 pb-24">

        {/* ── Breadcrumb ── */}
        <nav
          className="flex items-center gap-1.5 pt-8 pb-6 text-xs text-zinc-400"
          aria-label="Breadcrumb"
        >
          <Link href="/topics" className="transition-colors hover:text-zinc-600">Topics</Link>
          <span>/</span>
          <Link href="/topics/cell-biology" className="transition-colors hover:text-zinc-600">Cell Biology</Link>
          <span>/</span>
          <span className="font-medium text-zinc-600">Photosynthesis</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Cell Biology
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
              18 min
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-5xl">
            Photosynthesis
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Every plant, algae, and cyanobacterium runs on the same two-stage engine. Start in
            the lab: change the light, CO₂, and temperature and watch leaf disks float as they
            fill with oxygen. Then look inside the chloroplast to see why your results turned
            out the way they did.
          </p>
        </div>

        {/* ── Virtual lab ── */}
        <section className="mb-14" aria-labelledby="lab-heading">
          <div className="mb-4 max-w-3xl">
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">Virtual lab</div>
            <h2 id="lab-heading" className="text-2xl font-black tracking-tight text-zinc-900">
              The leaf disk assay
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Small disks punched from a spinach leaf are soaked in bicarbonate solution (a CO₂
              source) until they sink. Under a lamp, photosynthesis makes O₂, which collects inside
              the leaf tissue and floats the disks back up. The faster photosynthesis runs, the
              sooner they rise. Set up a trial, run it, and compare.
            </p>
          </div>
          <LeafDiskLab />
        </section>

        {/* ── How it works ── */}
        <div className="mb-5 max-w-3xl">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">How it works</div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Inside the chloroplast</h2>
        </div>

        {/* ── Two-column interactive section ── */}
        <PhotosynthesisProvider>
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

            {/* Left column — sticky viewer */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
              <PhotosynthesisViewer />
              <p className="mt-2 text-center text-xs text-zinc-400">
                Click a stage tab or drag the diagram to explore
              </p>
            </div>

            {/* Right column — scrollable content */}
            <div className="space-y-6">

              {/* Stage info panel */}
              <PhotosynthesisPanel />

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

              {/* At a glance table */}
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
                        <th className="px-4 py-3">Inputs</th>
                        <th className="px-4 py-3">Outputs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        ["Light reactions",  "Thylakoid membrane", "H₂O, light",         "O₂, ATP, NADPH"],
                        ["Calvin cycle",     "Stroma",             "CO₂, ATP, NADPH",    "G3P (→ glucose)"],
                        ["Net equation",     "Chloroplast",        "6CO₂ + 6H₂O + light","C₆H₁₂O₆ + 6O₂"],
                      ].map(([stage, loc, inp, out]) => (
                        <tr
                          key={stage}
                          className={`bg-white transition-colors hover:bg-zinc-50 ${stage === "Net equation" ? "font-semibold" : ""}`}
                        >
                          <td className="px-4 py-3 font-medium text-zinc-900">{stage}</td>
                          <td className="px-4 py-3 text-zinc-500">{loc}</td>
                          <td className="px-4 py-3 text-zinc-500">{inp}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{out}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* AP exam callout */}
              <section className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-5">
                <h2 className="mb-2 text-base font-bold text-zinc-900">
                  Does the Calvin cycle need light?
                </h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  Technically no — the enzymes don&apos;t use photons directly. But it stops in the
                  dark because it depends on a constant supply of ATP and NADPH from the light
                  reactions. This is a common AP exam trap: &quot;light-independent&quot; does not mean
                  &quot;dark-adapted.&quot; It means no photon is absorbed in that stage&apos;s chemistry.
                </p>
              </section>

              {/* Quick recap */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
                <ol className="space-y-2.5">
                  {[
                    ["PS II absorbs light",      "P680 absorbs a photon. The energy splits H₂O → 2H⁺ + ½O₂ + 2e⁻. O₂ is released. Note: PS II acts first despite its name."],
                    ["Electron transport chain", "Electrons flow PS II → plastoquinone → cytochrome b6f → plastocyanin. H⁺ pumped into lumen, building the gradient."],
                    ["PS I + NADPH",             "Electrons re-energized at P700. Passed to ferredoxin → NADP⁺ reductase → NADPH formed in the stroma."],
                    ["Chemiosmosis → ATP",       "H⁺ flows back through ATP synthase, spinning the rotor. Same mechanism as the mitochondrial ETC. ~3 ATP per 2e⁻."],
                    ["Carbon fixation",          "RuBisCO fixes CO₂ + RuBP (5C) → 2× 3-PGA (3C). Happens once per CO₂. 3 turns = 3 CO₂ fixed."],
                    ["Reduction",               "3-PGA + ATP + NADPH → G3P. This step consumes the light-reaction outputs — the coupling moment."],
                    ["Regeneration",            "G3P → RuBP (uses ATP). 5 out of 6 G3P molecules are recycled. 1 net G3P exits per 3 turns → 1 glucose per 6 turns."],
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
                <Link
                  href="/topics/cell-biology/cellular-respiration"
                  className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                >
                  ← Cellular Respiration
                </Link>
                <Link
                  href="/topics/cell-biology"
                  className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
                >
                  ↩ Cell Biology
                </Link>
              </div>

            </div>
          </div>
        </PhotosynthesisProvider>

      </main>
    </div>
  );
}
