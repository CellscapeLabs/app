import { LessonLayout } from "@/components/lessons/LessonLayout";
import { lessonMetadata } from "@/components/lessons/lessonMetadata";
import { LessonSplit } from "@/components/lessons/LessonSplit";
import {
  Callout,
  DataTable,
  KeyConcepts,
  QuickRecap,
  type KeyConcept,
} from "@/components/lessons/blocks";
import {
  CellMembraneProvider,
  CellMembraneViewer,
  CellMembranePanel,
} from "@/components/visualizations/CellMembraneVisualization";
import { EYEBROW, FRAME, HEADING, TEXT } from "@/components/ui/tokens";

export const metadata = lessonMetadata(
  "cell-biology",
  "cell-membrane",
  "Explore the phospholipid bilayer and the three types of membrane transport: simple diffusion, facilitated diffusion, and active transport.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "ban",
    heading: "Selectively permeable",
    body: "The membrane is not a wall — it is a selective filter. Small, non-polar molecules cross freely; large or charged molecules need protein help or active pumping.",
  },
  {
    icon: "gradient",
    heading: "Downhill is free",
    body: "Moving from high to low concentration (down the gradient) requires zero energy — it happens spontaneously, like water flowing downhill. Both forms of diffusion exploit this.",
  },
  {
    icon: "bolt",
    heading: "Uphill costs ATP",
    body: "Pushing molecules from low to high concentration — against their gradient — is like rolling a boulder uphill. Protein pumps use ATP hydrolysis to supply that force.",
  },
];

const TRANSPORT_ROWS = [
  ["Simple diffusion", "No", "No", "High → Low"],
  ["Facilitated diffusion", "Yes", "No", "High → Low"],
  ["Active transport", "Yes", "Yes", "Low → High"],
  ["Osmosis", "Aquaporin", "No", "High H₂O → Low H₂O"],
] as const;

const RECAP = [
  ["Phospholipid bilayer", "Two leaflets of phospholipids, hydrophilic heads outward, hydrophobic tails inward. ~7 nm thick."],
  ["Fluid mosaic model", "Membrane proteins float freely within the bilayer, giving it a mosaic appearance."],
  ["Simple diffusion", "Small non-polar molecules (O₂, CO₂) dissolve into and cross the lipid core. No protein, no ATP."],
  ["Facilitated diffusion", "Polar molecules and ions use channel or carrier proteins. Still down the gradient — no ATP."],
  ["Active transport", "Pumps (e.g. Na⁺/K⁺ ATPase) use ATP to move ions against their gradient — essential for membrane potential."],
] as const;

const PASSIVE = [
  "Simple diffusion — small molecules slip straight through the lipid core",
  "Facilitated diffusion — channel proteins open a hydrophilic gate",
  "Osmosis — water moves down its own concentration gradient",
];

const ACTIVE = [
  "Na⁺/K⁺ pump — maintains the voltage across nerve and muscle cells",
  "H⁺ pump — concentrates acid in the stomach",
  "Calcium pumps — allow muscles to relax after each contraction",
];

export default function CellMembranePage() {
  return (
    <LessonLayout
      topicId="cell-biology"
      lessonId="cell-membrane"
      intro={
        <>
          Every cell is surrounded by a membrane that decides what gets in and what stays out.
          The secret to how it works is one idea:{" "}
          <strong className={TEXT.heading}>concentration gradients</strong>.
          Learn the structure of the membrane and the three ways molecules cross it.
        </>
      }
    >
      {/* ── Big idea: the gradient-as-hill analogy the rest of the lesson hangs on ── */}
      <section className={`mb-14 ${FRAME}`} aria-labelledby="big-idea">
        <div className="border-b-[1.5px] border-zinc-900 bg-zinc-50 px-8 py-8">
          <p className={`${EYEBROW} text-emerald-700`}>The big idea</p>
          <h2 id="big-idea" className={`mt-2 ${HEADING.feature} ${TEXT.heading}`}>
            Concentration gradients are like hills
          </h2>
          <p className={`mt-4 max-w-2xl text-base leading-relaxed ${TEXT.body}`}>
            Picture concentration as elevation. Where molecules are packed together in high
            numbers, they are sitting at the{" "}
            <strong className={TEXT.heading}>top of a hill</strong>. Left alone, they tumble
            downhill — from high concentration to low — for free, just like water flows
            downhill. That is <strong className={TEXT.heading}>passive transport</strong>.
            Moving molecules <em>uphill</em>, against their natural tendency, requires a push.
            That push is powered by <strong className={TEXT.heading}>ATP</strong>. That is{" "}
            <strong className={TEXT.heading}>active transport</strong>.
          </p>
        </div>

        {/* Slope diagram
            Slope runs upper-left (HIGH) → lower-right (LOW).
            Downhill arrow: left→right, curves below the slope — genuinely descending.
            Uphill arrow:   right→left, curves above the slope — genuinely ascending.
            Dots and labels are all separated by at least 30 px from each other. */}
        <div className="bg-white px-8 py-10">
          <svg viewBox="0 0 700 220" className="w-full" role="img"
            aria-label="A slope running from high concentration at the upper left down to low concentration at the lower right. A green dashed arrow runs downhill, labelled free, no ATP needed. An amber dashed arrow runs uphill, labelled costs ATP.">
            <defs>
              <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto">
                <path d="M0,0 L0,8 L10,4 z" fill="#047857" />
              </marker>
              <marker id="arrowAmber" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto">
                <path d="M0,0 L0,8 L10,4 z" fill="#b45309" />
              </marker>
            </defs>

            {/* Ground fill below the slope */}
            <path d="M 50 80 L 650 180 L 650 220 L 50 220 Z" fill="#f4f4f5" />
            {/* Slope surface */}
            <line x1={50} y1={80} x2={650} y2={180} stroke="#a1a1aa" strokeWidth={2.5} />

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
            {/* Dots sit clearly above the slope (bottom of each dot > 12 px above slope line) */}
            {([{cx:568, cy:140}, {cx:592, cy:148}] as const).map((d, i) => (
              <circle key={i} cx={d.cx} cy={d.cy} r={10}
                fill="#10b981" fillOpacity={0.3} />
            ))}
            <text x={574} y={200} textAnchor="middle" fontSize={15} fontWeight={800}
              fill="#52525b" fontFamily="system-ui, sans-serif">LOW concentration</text>

            {/* ── Downhill arrow (left → right) ── */}
            {/* Ends just left of the (moved-up) LOW dots */}
            <path d="M 210 88 C 340 108 450 132 542 140"
              fill="none" stroke="#047857" strokeWidth={2.5} strokeDasharray="8 4"
              markerEnd="url(#arrowGreen)" />
            <text x={260} y={170} textAnchor="middle" fontSize={13} fontWeight={700}
              fill="#047857" fontFamily="system-ui, sans-serif">Downhill — FREE (no ATP needed)</text>

            {/* ── Uphill arrow (right → left) ── */}
            {/* Starts just left of the LOW dots */}
            <path d="M 542 132 C 432 98 306 72 210 70"
              fill="none" stroke="#b45309" strokeWidth={2.5} strokeDasharray="8 4"
              markerEnd="url(#arrowAmber)" />
            <text x={378} y={62} textAnchor="middle" fontSize={13} fontWeight={700}
              fill="#b45309" fontFamily="system-ui, sans-serif">Uphill — costs ATP</text>
          </svg>
        </div>

        <div className="grid grid-cols-1 border-t-[1.5px] border-zinc-900 sm:grid-cols-2">
          <div className="border-b-[1.5px] border-zinc-900 bg-emerald-50 px-8 py-7 sm:border-b-0 sm:border-r-[1.5px]">
            <p className={`mb-3 ${EYEBROW} text-emerald-800`}>Downhill — passive transport</p>
            <p className={`mb-5 text-sm leading-relaxed ${TEXT.body}`}>
              High → Low concentration. No energy needed — the gradient itself does the work,
              just like releasing a ball at the top of a hill. The cell simply opens a path
              and molecules flow on their own.
            </p>
            <ul className="space-y-3">
              {PASSIVE.map((s) => (
                <li key={s} className={`flex items-start gap-3 text-sm ${TEXT.body}`}>
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 px-8 py-7">
            <p className={`mb-3 ${EYEBROW} text-amber-800`}>Uphill — active transport</p>
            <p className={`mb-5 text-sm leading-relaxed ${TEXT.body}`}>
              Low → High concentration. Molecules must be pushed against their natural
              tendency — like rolling a boulder uphill. Protein pumps use the energy from
              splitting ATP to force this movement.
            </p>
            <ul className="space-y-3">
              {ACTIVE.map((s) => (
                <li key={s} className={`flex items-start gap-3 text-sm ${TEXT.body}`}>
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-600" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CellMembraneProvider>
        <LessonSplit
          viewer={<CellMembraneViewer />}
          caption="Click a tab to explore each transport type"
        >
          <CellMembranePanel />

          <DataTable
            title="Transport types at a glance"
            columns={[
              { header: "Type" },
              { header: "Protein?" },
              { header: "ATP?" },
              { header: "Direction", hideOnMobile: true },
            ]}
            rows={TRANSPORT_ROWS}
          />

          <KeyConcepts title="Key concepts" items={KEY_CONCEPTS} />

          <Callout tone="clinical" title="When transport fails">
            Cystic fibrosis is caused by a misfolded CFTR chloride channel — mucus becomes
            dangerously thick because Cl⁻ cannot exit cells normally. Digitalis (a heart
            drug) works by blocking the Na⁺/K⁺ pump in cardiac muscle, slowing the heart.
            Cholera toxin forces CFTR channels open, causing catastrophic water loss through
            osmosis into the gut. Membrane transport is medicine.
          </Callout>

          <QuickRecap items={RECAP} />
        </LessonSplit>
      </CellMembraneProvider>
    </LessonLayout>
  );
}
