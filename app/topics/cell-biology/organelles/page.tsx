import { LessonLayout } from "@/components/lessons/LessonLayout";
import { lessonMetadata } from "@/components/lessons/lessonMetadata";
import { LessonSplit } from "@/components/lessons/LessonSplit";
import {
  Callout,
  ContentSection,
  DataTable,
  KeyConcepts,
  type KeyConcept,
} from "@/components/lessons/blocks";
import {
  OrganellesProvider,
  OrganellesViewer,
  OrganellesPanel,
  PlantCellComparison,
} from "@/components/visualizations/OrganellesVisualization";

export const metadata = lessonMetadata(
  "cell-biology",
  "organelles",
  "Explore the organelles of an animal cell. Click each structure to learn its name, function, and a real-world analogy.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "grid",
    heading: "Division of labour",
    body: "Each organelle is a specialist. The nucleus issues instructions, the ER and Golgi manufacture and ship proteins, and mitochondria supply the energy to run it all.",
  },
  {
    icon: "layers",
    heading: "Membrane-bound",
    body: "Most organelles are enclosed by a lipid bilayer that lets them maintain a distinct internal chemistry — different pH, enzyme concentration, or ion balance from the cytoplasm.",
  },
  {
    icon: "link",
    heading: "Endomembrane system",
    body: "The nuclear envelope, rough ER, smooth ER, Golgi, lysosomes, and secretory vesicles are all physically or functionally connected — one integrated protein-trafficking network.",
  },
];

const ORGANELLE_ROWS = [
  ["Nucleus", "Stores DNA; controls gene expression", "Double"],
  ["Mitochondria", "ATP synthesis via cellular respiration", "Double"],
  ["Rough ER", "Protein synthesis and initial processing", "Single"],
  ["Smooth ER", "Lipid synthesis; detoxification", "Single"],
  ["Golgi Apparatus", "Protein modification and trafficking", "Single"],
  ["Lysosome", "Intracellular digestion and recycling", "Single"],
  ["Centrosome", "Microtubule organisation; spindle assembly", "None"],
  ["Peroxisome", "Fatty-acid oxidation; H₂O₂ neutralisation", "Single"],
] as const;

export default function OrganellesPage() {
  return (
    <LessonLayout
      topicId="cell-biology"
      lessonId="organelles"
      intro={
        <>
          Your cells are not simple bags of fluid — they are highly organised cities, with
          specialised structures handling energy, manufacturing, waste disposal, and more.
          Click any organelle in the diagram to explore what it does.
        </>
      }
    >
      <OrganellesProvider>
        <LessonSplit
          viewer={<OrganellesViewer />}
          caption="Click any structure to zoom in; press Esc or the back button to zoom out"
        >
          <OrganellesPanel />

          <DataTable
            title="Organelle at a glance"
            columns={[
              { header: "Organelle" },
              { header: "Key role" },
              { header: "Membrane", hideOnMobile: true },
            ]}
            rows={ORGANELLE_ROWS}
          />

          <ContentSection title="Animal cell vs. plant cell">
            <PlantCellComparison />
          </ContentSection>

          <KeyConcepts title="Key concepts" items={KEY_CONCEPTS} />

          <Callout tone="clinical" title="When organelles malfunction">
            Organelle failure underpins many diseases. Lysosomal storage disorders (e.g.
            Tay-Sachs) arise when hydrolytic enzymes are missing. Mitochondrial myopathies
            impair ATP production in muscle and nerve cells. Peroxisome biogenesis disorders
            (Zellweger syndrome) prevent very-long-chain fatty-acid breakdown.
            Understanding organelle biology is therefore directly relevant to medicine.
          </Callout>
        </LessonSplit>
      </OrganellesProvider>
    </LessonLayout>
  );
}
