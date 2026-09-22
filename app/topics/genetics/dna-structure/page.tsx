import { LessonLayout } from "@/components/lessons/LessonLayout";
import { lessonMetadata } from "@/components/lessons/lessonMetadata";
import { LessonSplit } from "@/components/lessons/LessonSplit";
import {
  Callout,
  ContentSection,
  DataTable,
  KeyConcepts,
  QuickRecap,
  type KeyConcept,
} from "@/components/lessons/blocks";
import {
  DnaStructureProvider,
  DnaStructureViewer,
  DnaStructurePanel,
  DnaSequenceBuilder,
} from "@/components/visualizations/DnaStructureVisualization";

export const metadata = lessonMetadata(
  "genetics",
  "dna-structure",
  "Unwind the double helix, pair the bases, and zoom into a single nucleotide to see how DNA's structure stores genetic information.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "ruler",
    heading: "Same width everywhere",
    body: "A two-ring purine always pairs with a one-ring pyrimidine, so every rung is the same length. That's why the helix is a uniform ~2 nm wide — and why A–G or C–T pairs don't fit.",
  },
  {
    icon: "link",
    heading: "Strong rails, weak rungs",
    body: "Covalent phosphodiester bonds hold each backbone together. Only hydrogen bonds hold the two strands to each other, so DNA can be unzipped for copying without breaking the sequence.",
  },
  {
    icon: "arrows",
    heading: "Direction matters",
    body: "The strands are antiparallel: one runs 5′ → 3′, the other 3′ → 5′. Enzymes that copy DNA can only add to a 3′ end — you'll need this for DNA replication.",
  },
];

const BASE_ROWS = [
  ["Adenine (A)", "Purine", "2", "Thymine (T)", "2"],
  ["Guanine (G)", "Purine", "2", "Cytosine (C)", "3"],
  ["Thymine (T)", "Pyrimidine", "1", "Adenine (A)", "2"],
  ["Cytosine (C)", "Pyrimidine", "1", "Guanine (G)", "3"],
] as const;

const RECAP = [
  ["Double helix", "Two strands twisted into a right-handed helix, ~2 nm wide, ~10 base pairs per turn."],
  ["Nucleotide", "Phosphate + deoxyribose sugar + nitrogenous base. Base on the 1′ carbon, phosphate on the 5′ carbon."],
  ["Backbone", "Alternating sugars and phosphates joined by covalent phosphodiester bonds (3′ –OH to 5′ phosphate)."],
  ["Base pairing", "A=T (2 H-bonds), G≡C (3 H-bonds). A purine always pairs with a pyrimidine, so %A = %T and %G = %C."],
  ["DNA vs. RNA", "RNA uses ribose (with a 2′ –OH), has uracil (U) instead of thymine, and is usually single-stranded."],
] as const;

export default function DnaStructurePage() {
  return (
    <LessonLayout
      topicId="genetics"
      lessonId="dna-structure"
      intro={
        <>
          Every trait you inherit is written in a molecule just 2 nanometers wide. Unwind the
          double helix, pair up its bases, and zoom into a single nucleotide to see how DNA&apos;s
          shape makes it both stable enough to store information and easy enough to copy.
        </>
      }
    >
      <DnaStructureProvider>
        <LessonSplit
          viewer={<DnaStructureViewer />}
          caption="Click a stage tab, drag the diagram, or use the ← → keys"
        >
          <DnaStructurePanel />

          <ContentSection title="Build a strand">
            <DnaSequenceBuilder />
          </ContentSection>

          <KeyConcepts title="Three things to keep straight" items={KEY_CONCEPTS} />

          <DataTable
            title="The four bases"
            columns={[
              { header: "Base" },
              { header: "Type" },
              { header: "Rings", hideOnMobile: true },
              { header: "Pairs with" },
              { header: "H-bonds", accent: true },
            ]}
            rows={BASE_ROWS}
          />

          <Callout tone="history" title="Who figured out the double helix?">
            In 1950, Erwin Chargaff showed that DNA always contains equal amounts of A and T,
            and of G and C. In 1952, Rosalind Franklin&apos;s X-ray diffraction image — known as
            Photo 51, taken with her student Raymond Gosling — revealed a helix of constant width.
            Building on both, James Watson and Francis Crick published their double-helix model
            in 1953. <strong>Chargaff&apos;s ratios explained the pairing; Franklin&apos;s data
            revealed the shape.</strong>
          </Callout>

          <QuickRecap items={RECAP} />
        </LessonSplit>
      </DnaStructureProvider>
    </LessonLayout>
  );
}
