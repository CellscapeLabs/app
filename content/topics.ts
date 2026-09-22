export type TopicId = "cell-biology" | "genetics" | "ecosystems";

/** The main kind of interaction a lesson is built around. */
export type LessonFormat = "Step-through" | "Builder" | "Explorer" | "Simulator" | "Virtual lab";

export type Lesson = {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  format: LessonFormat;
};

export type Topic = {
  id: TopicId;
  title: string;
  description: string;
  lessons: Lesson[];
  /** Next lessons on the roadmap (see cellscape_lesson_checklist.html). */
  upcoming: string[];
};

export const TOPICS: Topic[] = [
  {
    id: "cell-biology",
    title: "Cell Biology",
    description: "Explore mitosis, organelles, and membrane transport",
    lessons: [
      {
        id: "mitosis",
        title: "Mitosis",
        slug: "mitosis",
        durationMinutes: 12,
        format: "Step-through",
      },
      {
        id: "meiosis",
        title: "Meiosis",
        slug: "meiosis",
        durationMinutes: 16,
        format: "Builder",
      },
      {
        id: "organelles",
        title: "Organelles",
        slug: "organelles",
        durationMinutes: 14,
        format: "Explorer",
      },
      {
        id: "cell-membrane",
        title: "Cell Membrane & Transport",
        slug: "cell-membrane",
        durationMinutes: 14,
        format: "Explorer",
      },
      {
        id: "osmosis",
        title: "Osmosis & Diffusion",
        slug: "osmosis",
        durationMinutes: 15,
        format: "Simulator",
      },
      {
        id: "cellular-respiration",
        title: "Cellular Respiration",
        slug: "cellular-respiration",
        durationMinutes: 20,
        format: "Simulator",
      },
      {
        id: "photosynthesis",
        title: "Photosynthesis",
        slug: "photosynthesis",
        durationMinutes: 18,
        format: "Virtual lab",
      },
    ],
    upcoming: ["The cell cycle & checkpoints", "Prokaryotic vs. eukaryotic cells", "Enzyme activity & inhibition"],
  },
  {
    id: "genetics",
    title: "Genetics",
    description: "DNA replication, transcription, translation, and inheritance",
    lessons: [
      {
        id: "dna-structure",
        title: "DNA Structure",
        slug: "dna-structure",
        durationMinutes: 15,
        format: "Step-through",
      },
      {
        id: "dna-replication",
        title: "DNA Replication",
        slug: "dna-replication",
        durationMinutes: 18,
        format: "Step-through",
      },
    ],
    upcoming: ["Transcription — DNA to mRNA", "Translation — mRNA to protein", "Mendelian inheritance & Punnett squares"],
  },
  {
    id: "ecosystems",
    title: "Ecosystems",
    description: "Food webs, energy flow, and nutrient cycles",
    lessons: [],
    upcoming: ["Food web builder", "Energy flow — trophic levels", "Carbon cycle"],
  },
];

/** Look up a topic by id. Throws rather than returning undefined — a bad id is a build bug. */
export function getTopic(id: TopicId): Topic {
  const topic = TOPICS.find((t) => t.id === id);
  if (!topic) throw new Error(`Unknown topic "${id}"`);
  return topic;
}

/** Look up a lesson within a topic, plus its position and neighbours in the sequence. */
export function getLesson(topicId: TopicId, lessonId: string) {
  const topic = getTopic(topicId);
  const index = topic.lessons.findIndex((l) => l.id === lessonId);
  const lesson = topic.lessons[index];
  if (!lesson) throw new Error(`"${lessonId}" is not a lesson of "${topicId}"`);
  return {
    topic,
    lesson,
    index,
    prev: index > 0 ? topic.lessons[index - 1] : null,
    next: index < topic.lessons.length - 1 ? topic.lessons[index + 1] : null,
  };
}
