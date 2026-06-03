import Link from "next/link";
import type { Metadata } from "next";
import {
  OsmosisViewer,
  OsmosisInfoPanel,
} from "@/components/visualizations/OsmosisSimulator";

export const metadata: Metadata = {
  title: "Osmosis & Diffusion — Cell Biology · Cellscape",
  description:
    "Simulate osmosis in real time. Adjust solute concentrations on both sides of a membrane and watch water molecules cross toward equilibrium.",
};

const KEY_CONCEPTS = [
  {
    icon: "⚖️",
    heading: "Equilibrium drives everything",
    body: "Neither diffusion nor osmosis requires a motor protein or ATP. The random collisions of molecules statistically push the system toward equal concentrations — thermodynamics does the work.",
  },
  {
    icon: "🚫",
    heading: "Solute can't cross",
    body: "A semipermeable membrane is the key constraint. Solute molecules are too large to fit through aquaporin channels, so only water crosses — magnifying the osmotic effect.",
  },
  {
    icon: "💧",
    heading: "Water follows solute",
    body: "Counter-intuitive but true: water moves toward higher solute concentration. High solute means low water concentration — water diffuses down its own gradient, not the solute's.",
  },
] as const;

export default function OsmosisPage() {
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
          <span className="font-medium text-zinc-600">Osmosis & Diffusion</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Cell Biology
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
              Simulator
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
              15 min
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-5xl">
            Osmosis & Diffusion
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Molecules never stop moving — and that restlessness drives all of chemistry and life.
            Adjust the sliders to see how concentration gradients push molecules toward equilibrium,
            and what happens to a cell when you change its surroundings.
          </p>
        </div>

        {/* ── Two-column interactive section ── */}
        <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-8">

          {/* Left column — sticky simulator */}
          <div className="mb-6 lg:sticky lg:top-24 lg:mb-0">
            <OsmosisViewer />
            <p className="mt-2 text-center text-xs text-zinc-400">
              Drag the sliders — watch molecules respond in real time
            </p>
          </div>

          {/* Right column — scrollable content */}
          <div className="space-y-6">

            {/* Concept info panel */}
            <OsmosisInfoPanel />

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

            {/* Comparison table */}
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">
                Diffusion vs. Osmosis
              </h2>
              <div className="overflow-hidden rounded-xl border border-zinc-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Diffusion</th>
                      <th className="px-4 py-3">Osmosis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {[
                      ["What moves",     "Any molecule",          "Water only"],
                      ["Membrane needed","No",                    "Yes (semipermeable)"],
                      ["Energy cost",    "None (passive)",        "None (passive)"],
                      ["Direction",      "High → low conc.",      "Low solute → high solute"],
                      ["Stops when",     "Concentrations equal",  "Osmotic pressure balances"],
                    ].map(([prop, diff, osm]) => (
                      <tr key={prop} className="bg-white transition-colors hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{prop}</td>
                        <td className="px-4 py-3 text-zinc-500">{diff}</td>
                        <td className="px-4 py-3 text-zinc-500">{osm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Clinical connection */}
            <section className="rounded-xl border-l-4 border-rose-400 bg-rose-50 px-6 py-5">
              <h2 className="mb-2 text-base font-bold text-zinc-900">
                When osmosis goes wrong
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                IV fluids must be isotonic (~0.9% NaCl) or cells suffer immediately.
                A hypotonic drip swells red blood cells until they burst (hemolysis).
                A hypertonic drip shrinks them — dangerously reducing their flexibility.
                Cholera toxin forces chloride channels open, pulling water out of intestinal
                cells by osmosis, causing the catastrophic dehydration that kills within hours.
                Cryopreservation of cells uses cryoprotectants that match the internal osmolarity
                so cells don&apos;t shatter when frozen.
              </p>
            </section>

            {/* Quick recap */}
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
              <ol className="space-y-2.5">
                {[
                  ["Diffusion",       "Net movement of molecules from high to low concentration — driven by random molecular motion, no energy needed."],
                  ["Osmosis",         "Diffusion of water across a semipermeable membrane toward the side with higher solute concentration."],
                  ["Aquaporins",      "Protein channels that allow water to cross the membrane ~1 billion molecules per second — much faster than simple diffusion."],
                  ["Tonicity",        "Describes a solution relative to a cell: hypotonic (cell swells), isotonic (no change), hypertonic (cell shrinks)."],
                  ["Osmotic pressure","The hydrostatic pressure that exactly counteracts osmosis — higher solute concentration = higher osmotic pressure."],
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
                href="/topics/cell-biology/cell-membrane"
                className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50"
              >
                ← Cell Membrane
              </Link>
              <Link
                href="/topics/cell-biology"
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
              >
                Cell Biology →
              </Link>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
