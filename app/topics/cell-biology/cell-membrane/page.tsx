import Link from "next/link";
import type { Metadata } from "next";
import {
  CellMembraneViewer,
  CellMembranePanel,
} from "@/components/visualizations/CellMembraneVisualization";

export const metadata: Metadata = {
  title: "Cell Membrane & Transport — Cell Biology · Cellscape",
  description:
    "Explore the phospholipid bilayer and the three types of membrane transport: simple diffusion, facilitated diffusion, and active transport.",
};

const KEY_CONCEPTS = [
  {
    icon: "💧",
    heading: "Selectively permeable",
    body: "The membrane is not a wall — it's a selective filter. Small, non-polar molecules cross freely; large or charged molecules need protein help or active pumping.",
  },
  {
    icon: "⛰️",
    heading: "Downhill is free",
    body: "Moving from high to low concentration (down the gradient) requires zero energy — it happens spontaneously, like water flowing downhill. Both forms of diffusion exploit this.",
  },
  {
    icon: "🔋",
    heading: "Uphill costs ATP",
    body: "Pushing molecules from low to high concentration — against their gradient — is like rolling a boulder uphill. Protein pumps use ATP hydrolysis to supply that force.",
  },
] as const;

export default function CellMembranePage() {
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
          <Link href="/topics" className="hover:text-zinc-600 transition-colors">Topics</Link>
          <span>/</span>
          <Link href="/topics/cell-biology" className="hover:text-zinc-600 transition-colors">Cell Biology</Link>
          <span>/</span>
          <span className="text-zinc-600 font-medium">Cell Membrane & Transport</span>
        </nav>

        {/* ── Lesson header ── */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Cell Biology
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
              14 min
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-5xl">
            Cell Membrane & Transport
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Every cell is surrounded by a membrane that decides what gets in and what stays out.
            The secret to how it works is one idea: <strong className="text-zinc-700">concentration gradients</strong>.
            Learn the structure of the membrane and the three ways molecules cross it.
          </p>
        </div>

        {/* ── Big Idea callout ── */}
        <div className="mb-14 overflow-hidden rounded-2xl border border-zinc-200">

          {/* Header */}
          <div className="border-b border-zinc-100 bg-zinc-50 px-8 py-8">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              The big idea
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">
              Concentration gradients are like hills
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-500">
              Picture concentration as elevation. Where molecules are packed together in high
              numbers, they are sitting at the{" "}
              <strong className="text-zinc-700">top of a hill</strong>. Left alone, they tumble
              downhill — from high concentration to low — for free, just like water flows
              downhill. That is <strong className="text-zinc-700">passive transport</strong>.
              Moving molecules <em>uphill</em>, against their natural tendency, requires a push.
              That push is powered by <strong className="text-zinc-700">ATP</strong>. That is{" "}
              <strong className="text-zinc-700">active transport</strong>.
            </p>
          </div>

          {/* Slope diagram
              Slope runs upper-left (HIGH) → lower-right (LOW).
              Downhill arrow: left→right, curves below the slope — genuinely descending.
              Uphill arrow:   right→left, curves above the slope — genuinely ascending.
              Dots and labels are all separated by at least 30 px from each other. */}
          <div className="bg-white px-8 py-10">
            <svg viewBox="0 0 700 220" className="w-full" aria-hidden="true">
              <defs>
                <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L10,4 z" fill="#059669" />
                </marker>
                <marker id="arrowAmber" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L10,4 z" fill="#d97706" />
                </marker>
              </defs>

              {/* Ground fill below the slope */}
              <path d="M 50 80 L 650 180 L 650 220 L 50 220 Z" fill="#f8fafc" />
              {/* Slope surface */}
              <line x1={50} y1={80} x2={650} y2={180} stroke="#cbd5e1" strokeWidth={2.5} />

              {/* ── HIGH side (upper-left) ── */}
              {/* Label sits 30+ px above the top dot row */}
              <text x={110} y={22} textAnchor="middle" fontSize={15} fontWeight={800}
                fill="#065f46" fontFamily="system-ui, sans-serif">HIGH concentration</text>

              {/* 6 dots in a 3+3 grid — back row at y=46, front row at y=66.
                  Each dot is r=10; minimum inter-dot distance > 28 px (no overlap). */}
              {([
                {cx: 60, cy: 46}, {cx:110, cy: 46}, {cx:160, cy: 46},
                {cx: 85, cy: 66}, {cx:135, cy: 66}, {cx:185, cy: 66},
              ] as const).map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r={10}
                  fill="#10b981" fillOpacity={0.88} />
              ))}

              {/* ── LOW side (lower-right) ── */}
              {/* 2 faded dots above the label */}
              {([{cx:560, cy:162}, {cx:600, cy:170}] as const).map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r={10}
                  fill="#10b981" fillOpacity={0.22} />
              ))}
              {/* Label sits below the dots with clear space */}
              <text x={580} y={204} textAnchor="middle" fontSize={15} fontWeight={800}
                fill="#9ca3af" fontFamily="system-ui, sans-serif">LOW concentration</text>

              {/* ── Downhill arrow (left → right, below slope) ── */}
              {/* Starts right of the HIGH dot cluster; ends left of the LOW dots.
                  Curve dips below the slope line, so it visually travels downward. */}
              <path d="M 210 88 C 340 130 460 162 548 174"
                fill="none" stroke="#059669" strokeWidth={2.5} strokeDasharray="8 4"
                markerEnd="url(#arrowGreen)" />
              <text x={378} y={162} textAnchor="middle" fontSize={13} fontWeight={700}
                fill="#059669" fontFamily="system-ui, sans-serif">⬇ Downhill — FREE (no ATP needed)</text>

              {/* ── Uphill arrow (right → left, above slope) ── */}
              {/* Starts left of the LOW dots; ends right of the HIGH dot cluster.
                  Curve rises above the slope line, so it visually travels upward. */}
              <path d="M 548 156 C 438 106 308 78 210 74"
                fill="none" stroke="#d97706" strokeWidth={2.5} strokeDasharray="8 4"
                markerEnd="url(#arrowAmber)" />
              <text x={378} y={62} textAnchor="middle" fontSize={13} fontWeight={700}
                fill="#d97706" fontFamily="system-ui, sans-serif">⬆ Uphill — costs ATP</text>
            </svg>
          </div>

          {/* Two explanation cards */}
          <div className="grid grid-cols-1 border-t border-zinc-100 sm:grid-cols-2">
            <div className="border-b border-zinc-100 bg-emerald-50 px-8 py-7
                            sm:border-b-0 sm:border-r sm:border-zinc-100">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">
                ⬇ Downhill — Passive transport
              </p>
              <p className="mb-5 text-sm leading-relaxed text-zinc-600">
                High → Low concentration. No energy needed — the gradient itself does the work,
                just like releasing a ball at the top of a hill. The cell simply opens a path
                and molecules flow on their own.
              </p>
              <ul className="space-y-3">
                {[
                  "Simple diffusion — small molecules slip straight through the lipid core",
                  "Facilitated diffusion — channel proteins open a hydrophilic gate",
                  "Osmosis — water moves down its own concentration gradient",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm text-zinc-500">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 px-8 py-7">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-700">
                ⬆ Uphill — Active transport
              </p>
              <p className="mb-5 text-sm leading-relaxed text-zinc-600">
                Low → High concentration. Molecules must be pushed against their natural
                tendency — like rolling a boulder uphill. Protein pumps use the energy from
                splitting ATP to force this movement.
              </p>
              <ul className="space-y-3">
                {[
                  "Na⁺/K⁺ pump — maintains the voltage across nerve and muscle cells",
                  "H⁺ pump — concentrates acid in the stomach",
                  "Calcium pumps — allow muscles to relax after each contraction",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm text-zinc-500">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Two-column interactive section ── */}
        <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

          {/* Left column — sticky viewer */}
          <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
            <CellMembraneViewer />
            <p className="mt-2 text-center text-xs text-zinc-400">
              Click a tab to explore each transport type
            </p>
          </div>

          {/* Right column — scrollable content */}
          <div className="space-y-6">

            {/* Info panel — synced with viewer */}
            <CellMembranePanel />

            {/* Transport comparison table */}
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">
                Transport types at a glance
              </h2>
              <div className="overflow-hidden rounded-xl border border-zinc-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Protein?</th>
                      <th className="px-4 py-3">ATP?</th>
                      <th className="hidden px-4 py-3 sm:table-cell">Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {[
                      ["Simple diffusion",      "No",       "No",  "High → Low"],
                      ["Facilitated diffusion", "Yes",      "No",  "High → Low"],
                      ["Active transport",       "Yes",      "Yes", "Low → High"],
                      ["Osmosis",                "Aquaporin","No",  "High H₂O → Low H₂O"],
                    ].map(([type, protein, atp, direction]) => (
                      <tr key={type} className="bg-white transition-colors hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{type}</td>
                        <td className="px-4 py-3 text-zinc-500">{protein}</td>
                        <td className="px-4 py-3 text-zinc-500">{atp}</td>
                        <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">{direction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Key concepts */}
            <section>
              <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">Key concepts</h2>
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

            {/* Clinical connection */}
            <section className="rounded-xl border-l-4 border-rose-400 bg-rose-50 px-6 py-5">
              <h2 className="mb-2 text-base font-bold text-zinc-900">
                When transport fails
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                Cystic fibrosis is caused by a misfolded CFTR chloride channel — mucus becomes
                dangerously thick because Cl⁻ cannot exit cells normally. Digitalis (a heart
                drug) works by blocking the Na⁺/K⁺ pump in cardiac muscle, slowing the heart.
                Cholera toxin forces CFTR channels open, causing catastrophic water loss through
                osmosis into the gut. Membrane transport is medicine.
              </p>
            </section>

            {/* Quick recap */}
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">Quick recap</h2>
              <ol className="space-y-2.5">
                {[
                  ["Phospholipid bilayer", "Two leaflets of phospholipids, hydrophilic heads outward, hydrophobic tails inward. ~7 nm thick."],
                  ["Fluid mosaic model", "Membrane proteins float freely within the bilayer, giving it a mosaic appearance."],
                  ["Simple diffusion", "Small non-polar molecules (O₂, CO₂) dissolve into and cross the lipid core. No protein, no ATP."],
                  ["Facilitated diffusion", "Polar molecules and ions use channel or carrier proteins. Still down the gradient — no ATP."],
                  ["Active transport", "Pumps (e.g. Na⁺/K⁺ ATPase) use ATP to move ions against their gradient — essential for membrane potential."],
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
                href="/topics/cell-biology/organelles"
                className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50"
              >
                ← Organelles
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
