import { LessonLayout } from "@/components/lessons/LessonLayout";
import { lessonMetadata } from "@/components/lessons/lessonMetadata";
import { LessonSplit } from "@/components/lessons/LessonSplit";
import {
  Callout,
  ContentSection,
  KeyConcepts,
  LessonFeature,
  QuickRecap,
  type KeyConcept,
} from "@/components/lessons/blocks";
import {
  MeiosisProvider,
  MeiosisViewer,
  MeiosisPanel,
} from "@/components/visualizations/MeiosisAnimation";
import { GameteBuilder } from "@/components/visualizations/GameteBuilder";
import { INSET, TEXT } from "@/components/ui/tokens";

export const metadata = lessonMetadata(
  "cell-biology",
  "meiosis",
  "Learn how meiosis produces 4 genetically unique haploid cells through two divisions. Explore homologous pairing, crossing over, and independent assortment.",
);

const KEY_CONCEPTS: readonly KeyConcept[] = [
  {
    icon: "count",
    heading: "2n → n",
    body: "Meiosis halves the chromosome count from diploid (2n = 46) to haploid (n = 23), so that fertilization restores the diploid number without doubling it every generation.",
  },
  {
    icon: "shuffle",
    heading: "Crossing Over",
    body: "In Prophase I, non-sister chromatids of homologous chromosomes exchange segments at chiasmata — physically shuffling alleles and creating chromosomes that are neither fully maternal nor fully paternal.",
  },
  {
    icon: "branch",
    heading: "8 Million+",
    body: "Independent assortment alone yields 2²³ ≈ 8 million possible chromosome combinations per gamete. Combined with crossing over, no two human gametes are genetically identical.",
  },
];

const DIVISIONS = [
  {
    label: "Meiosis I — Reductional",
    accent: "text-violet-700",
    body: "Homologous chromosomes separate. Chromosome number halves: 2n → n. Sister chromatids stay joined. This division is unique to meiosis.",
  },
  {
    label: "Meiosis II — Equational",
    accent: "text-sky-700",
    body: "Sister chromatids separate — essentially mitosis on haploid cells. Chromosome count stays at n. Two cells → four cells.",
  },
] as const;

const RECAP = [
  ["Interphase", "DNA replicated; centrosomes duplicated — ready for two divisions."],
  ["Prophase I", "Homologs pair (synapsis); crossing over shuffles alleles."],
  ["Metaphase I", "Bivalents align at equator; orientation is random (independent assortment)."],
  ["Anaphase I", "Homologs separate to poles; chromosome number halves (2n → n)."],
  ["Telophase I", "Two haploid cells form — each chromosome still has 2 chromatids."],
  ["Metaphase II", "Individual chromosomes align in both cells — like mitosis."],
  ["Anaphase II", "Sister chromatids finally separate in both cells."],
  ["4 Haploid Cells", "Cytokinesis II → 4 genetically unique haploid gametes."],
] as const;

export default function MeiosisPage() {
  return (
    <LessonLayout
      topicId="cell-biology"
      lessonId="meiosis"
      intro={
        <>
          Every sperm and egg is the product of meiosis — two back-to-back divisions that halve
          the chromosome count and shuffle the genetic deck. Learn how one diploid cell becomes
          four unique haploid gametes — then build some yourself and see how many different
          ones a single cell can make.
        </>
      }
    >
      <LessonFeature
        topic="cell-biology"
        id="builder-heading"
        eyebrow="Build it"
        title="How many different gametes can one cell make?"
        lead="This cell has three pairs of chromosomes — one copy of each from the mother, one from the father. Choose how the pairs line up, decide whether crossing over happens, and divide. Every new combination you find goes into your collection."
      >
        <GameteBuilder />
      </LessonFeature>

      <LessonFeature
        topic="cell-biology"
        id="how-it-works"
        eyebrow="How it works"
        title="Step through meiosis I and II"
      >
        <MeiosisProvider>
          <LessonSplit
            viewer={<MeiosisViewer />}
            caption="Click a phase tab or drag the cell to explore"
          >
            <MeiosisPanel />

            <ContentSection level={3} title="Two very different divisions">
              <ul className="grid gap-3 sm:grid-cols-2">
                {DIVISIONS.map(({ label, accent, body }) => (
                  <li key={label} className={`${INSET} p-4`}>
                    <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${accent}`}>{label}</p>
                    <p className={`text-sm leading-relaxed ${TEXT.body}`}>{body}</p>
                  </li>
                ))}
              </ul>
            </ContentSection>

            <KeyConcepts level={3}
              title="Why meiosis matters"
              lead="Meiosis is the engine of sexual reproduction and genetic diversity. Without it, chromosome counts would double with every fertilization and allele combinations would never shuffle — evolution would grind to a halt."
              items={KEY_CONCEPTS}
            />

            <Callout level={3} tone="note" label="Exam trap" title="Meiosis vs. Mitosis">
              Mitosis produces <strong>2 identical diploid cells</strong> for growth and repair —
              no mixing, no reduction. Meiosis produces <strong>4 genetically unique haploid cells</strong> for
              reproduction. The key differences: meiosis has two divisions, includes synapsis and
              crossing over in Prophase I, and separates homologs (not sister chromatids) in the
              first division. Never confuse them on an exam.
            </Callout>

            <QuickRecap level={3} items={RECAP} />
          </LessonSplit>
        </MeiosisProvider>
      </LessonFeature>
    </LessonLayout>
  );
}
