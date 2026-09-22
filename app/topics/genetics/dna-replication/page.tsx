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
  DnaReplicationProvider,
  DnaReplicationViewer,
  DnaReplicationPanel,
  EnzymeRoster,
} from "@/components/visualizations/DnaReplicationVisualization";

export const metadata = lessonMetadata(
  "genetics",
  "dna-replication",
  "Open a replication fork and watch helicase, primase, DNA polymerase, and ligase copy DNA — including why the lagging strand is built in Okazaki fragments.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "arrowRight",
    heading: "Only 5′ → 3′",
    body: "DNA polymerase can only add nucleotides to a 3′ end. Every other rule of replication — primers, leading vs. lagging strands, Okazaki fragments — follows from this one constraint.",
  },
  {
    icon: "arrows",
    heading: "Antiparallel templates",
    body: "Because the two template strands run in opposite directions, one new strand can follow the fork continuously while the other has to be built backward in short pieces.",
  },
  {
    icon: "helix",
    heading: "Half old, half new",
    body: "Each daughter molecule keeps one parent strand. That's semiconservative replication — and it's why each strand can serve as a check on the other.",
  },
];

const STRAND_ROWS = [
  ["Direction built", "5′ → 3′, toward the fork", "5′ → 3′, away from the fork"],
  ["Synthesis", "Continuous", "Discontinuous (Okazaki fragments)"],
  ["RNA primers", "One", "One per fragment"],
  ["Ligase needed", "Rarely", "To join every fragment"],
] as const;

const RECAP = [
  ["Unzip", "Helicase breaks H-bonds at the fork; topoisomerase relieves strain ahead; SSBs keep strands apart."],
  ["Prime", "Primase builds short RNA primers to give DNA polymerase a free 3′ end."],
  ["Build", "DNA polymerase III adds nucleotides 5′ → 3′ — continuously on the leading strand, in Okazaki fragments on the lagging strand."],
  ["Clean up", "DNA polymerase I replaces RNA primers with DNA; DNA ligase seals the nicks."],
  ["Result", "Two identical DNA molecules, each with one original and one new strand."],
] as const;

export default function DnaReplicationPage() {
  return (
    <LessonLayout
      topicId="genetics"
      lessonId="dna-replication"
      intro={
        <>
          Before a cell divides, it copies all of its DNA — about 6 billion base pairs in a human
          cell, in a matter of hours. Open a replication fork and follow the team of enzymes that
          unzips, primes, builds, and seals two perfect copies.
        </>
      }
    >
      <DnaReplicationProvider>
        <LessonSplit
          viewer={<DnaReplicationViewer />}
          caption="Click a stage tab, drag the diagram, or use the ← → keys"
        >
          <DnaReplicationPanel />

          <ContentSection title="Meet the enzymes" lead="Tap one to see it at work in the fork.">
            <EnzymeRoster />
          </ContentSection>

          <KeyConcepts title="Three things to keep straight" items={KEY_CONCEPTS} />

          <DataTable
            title="Leading vs. lagging strand"
            columns={[
              { header: "" },
              { header: "Leading strand" },
              { header: "Lagging strand" },
            ]}
            rows={STRAND_ROWS}
          />

          <Callout tone="history" title="How do we know replication is semiconservative?">
            In 1958, Matthew Meselson and Franklin Stahl grew bacteria on heavy nitrogen
            (¹⁵N), then moved them to light nitrogen (¹⁴N). After one generation, all the DNA
            had an intermediate density — ruling out the conservative model. After two
            generations, half was intermediate and half was light — ruling out the dispersive
            model. <strong>Only semiconservative replication fit both results.</strong>
          </Callout>

          <QuickRecap items={RECAP} />
        </LessonSplit>
      </DnaReplicationProvider>
    </LessonLayout>
  );
}
