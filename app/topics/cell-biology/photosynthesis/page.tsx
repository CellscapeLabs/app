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
  PhotosynthesisProvider,
  PhotosynthesisViewer,
  PhotosynthesisPanel,
} from "@/components/visualizations/PhotosynthesisVisualization";
import { LeafDiskLab } from "@/components/visualizations/LeafDiskLab";

export const metadata = lessonMetadata(
  "cell-biology",
  "photosynthesis",
  "Run a virtual leaf disk lab to find what limits photosynthesis, then step through the light reactions and Calvin cycle inside the chloroplast.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "sun",
    heading: "Light reactions make the fuel",
    body: "The thylakoid membrane splits water, ferries electrons through PS II and PS I, and uses the resulting H⁺ gradient to produce ATP and NADPH. These are the energy carriers — not glucose. Glucose comes later.",
  },
  {
    icon: "cycle",
    heading: "Calvin cycle spends the fuel",
    body: "RuBisCO in the stroma fixes CO₂ into 3-PGA, which ATP and NADPH reduce to G3P. Three turns of the cycle fix 3 CO₂ and yield 1 net G3P. Six turns yield 1 glucose. The cycle doesn't use light directly — it uses the ATP and NADPH made by the light reactions.",
  },
  {
    icon: "pin",
    heading: "Location is everything",
    body: "Light reactions happen on the thylakoid membrane. The Calvin cycle runs in the stroma surrounding it. This spatial separation matters — NADPH and ATP must physically move from one compartment to the other. That handoff is the link between the two stages.",
  },
];

const STAGE_ROWS = [
  ["Light reactions", "Thylakoid membrane", "H₂O, light", "O₂, ATP, NADPH"],
  ["Calvin cycle", "Stroma", "CO₂, ATP, NADPH", "G3P (→ glucose)"],
  ["Net equation", "Chloroplast", "6CO₂ + 6H₂O + light", "C₆H₁₂O₆ + 6O₂"],
] as const;

const RECAP = [
  ["PS II absorbs light", "P680 absorbs a photon. The energy splits H₂O → 2H⁺ + ½O₂ + 2e⁻. O₂ is released. Note: PS II acts first despite its name."],
  ["Electron transport chain", "Electrons flow PS II → plastoquinone → cytochrome b6f → plastocyanin. H⁺ pumped into lumen, building the gradient."],
  ["PS I + NADPH", "Electrons re-energized at P700. Passed to ferredoxin → NADP⁺ reductase → NADPH formed in the stroma."],
  ["Chemiosmosis → ATP", "H⁺ flows back through ATP synthase, spinning the rotor. Same mechanism as the mitochondrial ETC. ~3 ATP per 2e⁻."],
  ["Carbon fixation", "RuBisCO fixes CO₂ + RuBP (5C) → 2× 3-PGA (3C). Happens once per CO₂. 3 turns = 3 CO₂ fixed."],
  ["Reduction", "3-PGA + ATP + NADPH → G3P. This step consumes the light-reaction outputs — the coupling moment."],
  ["Regeneration", "G3P → RuBP (uses ATP). 5 out of 6 G3P molecules are recycled. 1 net G3P exits per 3 turns → 1 glucose per 6 turns."],
] as const;

export default function PhotosynthesisPage() {
  return (
    <LessonLayout
      topicId="cell-biology"
      lessonId="photosynthesis"
      intro={
        <>
          Every plant, algae, and cyanobacterium runs on the same two-stage engine. Start in
          the lab: change the light, CO₂, and temperature and watch leaf disks float as they
          fill with oxygen. Then look inside the chloroplast to see why your results turned
          out the way they did.
        </>
      }
    >
      <LessonFeature
        topic="cell-biology"
        id="lab-heading"
        eyebrow="Virtual lab"
        title="The leaf disk assay"
        lead="Small disks punched from a spinach leaf are soaked in bicarbonate solution (a CO₂ source) until they sink. Under a lamp, photosynthesis makes O₂, which collects inside the leaf tissue and floats the disks back up. The faster photosynthesis runs, the sooner they rise. Set up a trial, run it, and compare."
      >
        <LeafDiskLab />
      </LessonFeature>

      <LessonFeature
        topic="cell-biology"
        id="how-it-works"
        eyebrow="How it works"
        title="Inside the chloroplast"
      >
        <PhotosynthesisProvider>
          <LessonSplit
            viewer={<PhotosynthesisViewer />}
            caption="Click a stage tab or drag the diagram to explore"
          >
            <PhotosynthesisPanel />

            <KeyConcepts level={3}
              title="Three things to keep straight"
              items={KEY_CONCEPTS}
            />

            <DataTable level={3}
              title="At a glance"
              columns={[
                { header: "Stage" },
                { header: "Location" },
                { header: "Inputs", hideOnMobile: true },
                { header: "Outputs", accent: true },
              ]}
              rows={STAGE_ROWS}
              emphasize="Net equation"
            />

            <Callout level={3} tone="note" label="Exam trap" title="Does the Calvin cycle need light?">
              Technically no — the enzymes don&apos;t use photons directly. But it stops in the
              dark because it depends on a constant supply of ATP and NADPH from the light
              reactions. This is a common AP exam trap: &quot;light-independent&quot; does not mean
              &quot;dark-adapted.&quot; It means no photon is absorbed in that stage&apos;s chemistry.
            </Callout>

            <QuickRecap level={3} items={RECAP} />
          </LessonSplit>
        </PhotosynthesisProvider>
      </LessonFeature>
    </LessonLayout>
  );
}
