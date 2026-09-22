import { LessonLayout } from "@/components/lessons/LessonLayout";
import { lessonMetadata } from "@/components/lessons/lessonMetadata";
import { LessonSplit } from "@/components/lessons/LessonSplit";
import { Callout, KeyConcepts, QuickRecap, type KeyConcept } from "@/components/lessons/blocks";
import {
  MitosisProvider,
  MitosisViewer,
  MitosisPanel,
} from "@/components/visualizations/MitosisAnimation";

export const metadata = lessonMetadata(
  "cell-biology",
  "mitosis",
  "Learn how cells divide through mitosis. Step through all 6 phases with interactive animations.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "count",
    heading: "46 → 46",
    body: "Mitosis is a copying process, not a halving one. Each daughter cell receives a complete copy of all 46 chromosomes — identical to the parent cell.",
  },
  {
    icon: "clock",
    heading: "1–2 Hours",
    body: "A full mitotic cycle takes about 1–2 hours in human cells. Interphase can last 18–20 hours — the actual division is the quick part.",
  },
  {
    icon: "compare",
    heading: "Not Meiosis",
    body: "Mitosis produces 2 identical diploid cells for growth and repair. Meiosis produces 4 genetically diverse haploid cells for sexual reproduction.",
  },
];

const RECAP = [
  ["Interphase (G₂)", "Cell grows; DNA already duplicated — ready to divide."],
  ["Prophase", "Chromosomes condense; nuclear envelope breaks down; spindle forms."],
  ["Metaphase", "Chromosomes line up at equator; spindle checkpoint fires."],
  ["Anaphase", "Sister chromatids pulled to opposite poles; cell elongates."],
  ["Telophase", "Nuclear envelopes reform; chromosomes decondense; furrow starts."],
  ["Cytokinesis", "Cleavage furrow pinches cell in two → 2 identical daughter cells."],
] as const;

export default function MitosisPage() {
  return (
    <LessonLayout
      topicId="cell-biology"
      lessonId="mitosis"
      intro={
        <>
          Every cell in your body came from a single fertilized egg through billions of rounds
          of mitosis. Learn how one cell becomes two — with perfect genetic fidelity — every time.
        </>
      }
    >
      <MitosisProvider>
        <LessonSplit
          viewer={<MitosisViewer />}
          caption="Click a phase tab or drag the cell to explore"
        >
          <MitosisPanel />

          <KeyConcepts
            title="Why mitosis matters"
            lead="Mitosis is the engine of growth, maintenance, and repair in multicellular life. Understanding it is foundational to understanding cancer, wound healing, and development."
            items={KEY_CONCEPTS}
          />

          <Callout tone="clinical" title="What happens when mitosis goes wrong?">
            Errors at the spindle assembly checkpoint can let chromosomes mis-segregate,
            giving daughter cells the wrong number — <strong>aneuploidy</strong>.
            When these errors affect genes that control the cell cycle, the result can be
            uncontrolled division: <strong>cancer</strong>. Many chemotherapy drugs disrupt
            spindle formation, freezing cells at metaphase so they self-destruct.
          </Callout>

          <QuickRecap items={RECAP} />
        </LessonSplit>
      </MitosisProvider>
    </LessonLayout>
  );
}
