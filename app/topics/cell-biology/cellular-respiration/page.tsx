import { LessonLayout } from "@/components/lessons/LessonLayout";
import { lessonMetadata } from "@/components/lessons/lessonMetadata";
import { LessonSplit } from "@/components/lessons/LessonSplit";
import {
  Callout,
  DataTable,
  KeyConcepts,
  LessonFeature,
  QuickRecap,
  type KeyConcept,
} from "@/components/lessons/blocks";
import {
  CellularRespirationProvider,
  CellularRespirationViewer,
  CellularRespirationPanel,
} from "@/components/visualizations/CellularRespirationVisualization";
import { RespirationSimulator } from "@/components/visualizations/RespirationSimulator";

export const metadata = lessonMetadata(
  "cell-biology",
  "cellular-respiration",
  "Break the respiration pipeline with oxygen loss, cyanide, and uncouplers to see how glycolysis, the Krebs cycle, and the electron transport chain depend on each other.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "bolt",
    heading: "Most ATP comes last",
    body: "Glycolysis yields just 2 ATP. The Krebs cycle adds 2 more. The electron transport chain produces ~32 — about 89% of the total. The first two stages matter mainly because they generate NADH and FADH₂ to power the ETC.",
  },
  {
    icon: "pin",
    heading: "Location = stage",
    body: "Glycolysis happens in the cytoplasm (no organelle needed). The Krebs cycle runs in the mitochondrial matrix. The ETC sits on the inner mitochondrial membrane. Each stage feeds the next.",
  },
  {
    icon: "wind",
    heading: "Oxygen is the finish line",
    body: "O₂ doesn't participate until the very last step — accepting electrons at Complex IV. Without it, the entire ETC backs up. ATP production drops from ~36 to just 2, forcing the cell into fermentation.",
  },
];

const STAGE_ROWS = [
  ["Glycolysis", "Cytoplasm", "2 net", "2 NADH, 2 pyruvate"],
  ["Krebs Cycle", "Mitochondrial matrix", "2", "8 NADH, 2 FADH₂, 6 CO₂"],
  ["ETC", "Inner mito. membrane", "~32", "H₂O (O₂ required)"],
  ["Total", "—", "~36", "6 CO₂, 6 H₂O"],
] as const;

const RECAP = [
  ["Glycolysis", "Splits glucose (C₆) into 2 pyruvate (C₃) in the cytoplasm. Net 2 ATP + 2 NADH. No oxygen needed."],
  ["Pyruvate oxidation", "Each pyruvate loses one carbon as CO₂ and becomes Acetyl-CoA. Produces 1 NADH per pyruvate. Happens twice."],
  ["Krebs cycle", "Acetyl-CoA enters the cycle in the matrix. Per glucose: 2 ATP, 6 NADH, 2 FADH₂, 4 CO₂. All carbon released."],
  ["ETC", "NADH and FADH₂ electrons drive H⁺ pumping. H⁺ gradient spins ATP synthase (chemiosmosis). ~32 ATP."],
  ["Oxygen's role", "Final electron acceptor at Complex IV. O₂ + 4H⁺ + 4e⁻ → 2H₂O. Without O₂, the chain backs up and stops."],
] as const;

export default function CellularRespirationPage() {
  return (
    <LessonLayout
      topicId="cell-biology"
      lessonId="cellular-respiration"
      intro={
        <>
          Every contraction, thought, and cell division runs on ATP. Your cells make it with a
          three-stage pipeline where every step depends on the next. Start by breaking it — take
          away oxygen, add a poison — and watch what fails. Then step through how it works.
        </>
      }
    >
      <LessonFeature
        topic="cell-biology"
        id="sim-heading"
        eyebrow="What if?"
        title="Break the pipeline"
        lead={
          <>
            The map shows one glucose molecule&apos;s path through a working cell. Flip a switch to
            remove oxygen or add a drug, then follow the red mark to see where the pipeline jams —
            and how the problem spreads backward to the other stages.
          </>
        }
      >
        <RespirationSimulator />
      </LessonFeature>

      <LessonFeature
        topic="cell-biology"
        id="how-it-works"
        eyebrow="How it works"
        title="Step through the three stages"
      >
        <CellularRespirationProvider>
          <LessonSplit
            viewer={<CellularRespirationViewer />}
            caption="Click a stage tab or drag the diagram to explore"
          >
            <CellularRespirationPanel />

            <KeyConcepts level={3}
              title="Three things to keep straight"
              items={KEY_CONCEPTS}
            />

            <DataTable level={3}
              title="At a glance"
              columns={[
                { header: "Stage" },
                { header: "Location" },
                { header: "ATP", accent: true },
                { header: "Other outputs", hideOnMobile: true },
              ]}
              rows={STAGE_ROWS}
              emphasize="Total"
            />

            <Callout level={3} tone="note" label="Without oxygen" title="What happens without oxygen? Fermentation.">
              When O₂ runs out, the ETC and Krebs cycle shut down. Cells fall back on
              fermentation — a shortcut that regenerates NAD⁺ so glycolysis can keep
              running. In muscle cells this produces lactic acid (the burn during intense
              exercise). In yeast it produces ethanol and CO₂. Either way, yield drops
              to just <strong>2 ATP per glucose</strong> — 18× less than aerobic respiration.
            </Callout>

            <QuickRecap level={3} items={RECAP} />
          </LessonSplit>
        </CellularRespirationProvider>
      </LessonFeature>
    </LessonLayout>
  );
}
