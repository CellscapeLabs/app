import Link from "next/link";
import type { Metadata } from "next";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import {
  OrganellesProvider,
  OrganellesViewer,
  OrganellesPanel,
} from "@/components/visualizations/OrganellesVisualization";

export const metadata: Metadata = {
  title: "Organelles — Cell Biology · Cellscape",
  description:
    "Explore the organelles of an animal cell. Click each structure to learn its name, function, and a real-world analogy.",
};

const KEY_CONCEPTS = [
  {
    icon: "🏭",
    heading: "Division of labour",
    body: "Each organelle is a specialist. The nucleus issues instructions, the ER and Golgi manufacture and ship proteins, and mitochondria supply the energy to run it all.",
  },
  {
    icon: "🫧",
    heading: "Membrane-bound",
    body: "Most organelles are enclosed by a lipid bilayer that lets them maintain a distinct internal chemistry — different pH, enzyme concentration, or ion balance from the cytoplasm.",
  },
  {
    icon: "🔗",
    heading: "Endomembrane system",
    body: "The nuclear envelope, rough ER, smooth ER, Golgi, lysosomes, and secretory vesicles are all physically or functionally connected — one integrated protein-trafficking network.",
  },
] as const;

export default function OrganellesPage() {
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
          <span className="font-medium text-zinc-600">Organelles</span>
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
            Cell Organelles
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Your cells are not simple bags of fluid — they are highly organised cities, with
            specialised structures handling energy, manufacturing, waste disposal, and more.
            Click any organelle in the diagram to explore what it does.
          </p>
        </div>

        {/* ── Two-column interactive section ── */}
        {/* Left: sticky cell viewer. Right: organelle panel + lesson content. */}
        <OrganellesProvider>
          <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8 lg:items-start">

            {/* Left column — sticky viewer */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
              <OrganellesViewer />
            </div>

            {/* Right column — scrollable content */}
            <div className="space-y-6">

              {/* Organelle detail panel — synced with the viewer */}
              <OrganellesPanel />

              {/* Organelle quick-reference table */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">
                  Organelle at a glance
                </h2>
                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        <th className="px-4 py-3">Organelle</th>
                        <th className="px-4 py-3">Key role</th>
                        <th className="hidden px-4 py-3 sm:table-cell">Membrane</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        ["Nucleus",          "Stores DNA; controls gene expression",      "Double"],
                        ["Mitochondria",     "ATP synthesis via cellular respiration",    "Double"],
                        ["Rough ER",         "Protein synthesis and initial processing",  "Single"],
                        ["Smooth ER",        "Lipid synthesis; detoxification",           "Single"],
                        ["Golgi Apparatus",  "Protein modification and trafficking",      "Single"],
                        ["Lysosome",         "Intracellular digestion and recycling",     "Single"],
                        ["Centrosome",       "Microtubule organisation; spindle assembly","None"],
                        ["Peroxisome",       "Fatty-acid oxidation; H₂O₂ neutralisation","Single"],
                      ].map(([name, role, mem]) => (
                        <tr key={name} className="bg-white transition-colors hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{name}</td>
                          <td className="px-4 py-3 text-zinc-500">{role}</td>
                          <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">{mem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Key concepts */}
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">
                  Key concepts
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {KEY_CONCEPTS.map(({ icon, heading, body }) => (
                    <div
                      key={heading}
                      className="rounded-xl border border-zinc-100 bg-zinc-50 p-4"
                    >
                      <div className="mb-2 text-2xl">{icon}</div>
                      <h3 className="mb-1 text-sm font-bold text-zinc-900">{heading}</h3>
                      <p className="text-xs leading-relaxed text-zinc-500">{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Disease connection callout */}
              <section className="rounded-xl border-l-4 border-rose-400 bg-rose-50 px-6 py-5">
                <h2 className="mb-2 text-base font-bold text-zinc-900">
                  When organelles malfunction
                </h2>
                <p className="text-sm leading-relaxed text-zinc-600">
                  Organelle failure underpins many diseases. Lysosomal storage disorders (e.g.
                  Tay-Sachs) arise when hydrolytic enzymes are missing. Mitochondrial myopathies
                  impair ATP production in muscle and nerve cells. Peroxisome biogenesis disorders
                  (Zellweger syndrome) prevent very-long-chain fatty-acid breakdown.
                  Understanding organelle biology is therefore directly relevant to medicine.
                </p>
              </section>

              {/* Footer nav */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                <Link
                  href="/topics/cell-biology"
                  className="rounded-full border-2 border-zinc-200 px-6 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                >
                  ← Cell Biology
                </Link>
                <Link
                  href="/topics"
                  className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
                >
                  All Topics →
                </Link>
              </div>

            </div>
          </div>
        </OrganellesProvider>

      </main>
    </div>
  );
}
