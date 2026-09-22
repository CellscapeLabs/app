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
  OsmosisViewer,
  OsmosisInfoPanel,
  OsmosisProvider,
} from "@/components/visualizations/OsmosisSimulator";

export const metadata = lessonMetadata(
  "cell-biology",
  "osmosis",
  "Simulate osmosis in real time. Adjust solute concentrations on both sides of a membrane and watch water molecules cross toward equilibrium.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "balance",
    heading: "Equilibrium drives everything",
    body: "Neither diffusion nor osmosis requires a motor protein or ATP. The random collisions of molecules statistically push the system toward equal concentrations — thermodynamics does the work.",
  },
  {
    icon: "ban",
    heading: "Solute can't cross",
    body: "A semipermeable membrane is the key constraint. Most solutes cannot dissolve into the oily lipid bilayer core, so they are blocked. Only water molecules — helped by aquaporin protein channels — can cross freely, which is what makes osmosis possible.",
  },
  {
    icon: "droplet",
    heading: "Water follows solute",
    body: "Counter-intuitive but true: water moves toward higher solute concentration. Adding solute to water dilutes it — so the high-solute side is actually the low-water-concentration side. Water diffuses down its own gradient toward the solute, not the other way around.",
  },
];

const COMPARISON_ROWS = [
  ["What moves", "Any molecule", "Water only"],
  ["Membrane needed", "No", "Yes (semipermeable)"],
  ["Energy cost", "None (passive)", "None (passive)"],
  ["Direction", "High → low conc.", "Water moves toward high-solute side"],
  ["Stops when", "Concentrations equal", "Osmotic pressure balances"],
] as const;

const RECAP = [
  ["Diffusion", "Net movement of molecules from high to low concentration — driven by random molecular motion, no energy needed."],
  ["Osmosis", "Diffusion of water across a semipermeable membrane toward the side with higher solute concentration."],
  ["Aquaporins", "Protein channels that allow water to cross the membrane ~1 billion molecules per second — much faster than simple diffusion."],
  ["Tonicity", "Describes a solution relative to a cell: hypotonic (cell swells), isotonic (no change), hypertonic (cell shrinks)."],
  ["Osmotic pressure", "The hydrostatic pressure that exactly counteracts osmosis — higher solute concentration = higher osmotic pressure."],
] as const;

export default function OsmosisPage() {
  return (
    <LessonLayout
      topicId="cell-biology"
      lessonId="osmosis"
      intro={
        <>
          Molecules never stop moving — and that restlessness drives all of chemistry and life.
          Adjust the sliders to see how concentration gradients push molecules toward equilibrium,
          and what happens to a cell when you change its surroundings.
        </>
      }
    >
      <OsmosisProvider>
        <LessonSplit
          viewer={<OsmosisViewer />}
          caption="Drag the sliders — watch molecules respond in real time"
        >
          <OsmosisInfoPanel />

          <KeyConcepts
            title="Three things to keep straight"
            items={KEY_CONCEPTS}
          />

          <DataTable
            title="Diffusion vs. osmosis"
            columns={[
              { header: "Property" },
              { header: "Diffusion" },
              { header: "Osmosis" },
            ]}
            rows={COMPARISON_ROWS}
          />

          <Callout tone="clinical" title="When osmosis goes wrong">
            IV fluids must be isotonic (~0.9% NaCl) or cells suffer immediately.
            A hypotonic drip swells red blood cells until they burst (hemolysis).
            A hypertonic drip shrinks them — dangerously reducing their flexibility.
            Cholera toxin forces chloride channels open, pulling water out of intestinal
            cells by osmosis, causing the catastrophic dehydration that kills within hours.
            Cryopreservation of cells uses cryoprotectants that match the internal osmolarity
            so cells don&apos;t shatter when frozen.
          </Callout>

          <QuickRecap items={RECAP} />
        </LessonSplit>
      </OsmosisProvider>
    </LessonLayout>
  );
}
