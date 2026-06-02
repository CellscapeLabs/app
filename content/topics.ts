export type TopicId = "cell-biology" | "genetics" | "ecosystems";

export type Lesson = {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
};

export type Topic = {
  id: TopicId;
  title: string;
  description: string;
  lessons: Lesson[];
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
      },
      {
        id: "meiosis",
        title: "Meiosis",
        slug: "meiosis",
        durationMinutes: 16,
      },
    ],
  },
  {
    id: "genetics",
    title: "Genetics",
    description: "DNA replication, transcription, translation, and inheritance",
    lessons: [],
  },
  {
    id: "ecosystems",
    title: "Ecosystems",
    description: "Food webs, energy flow, and nutrient cycles",
    lessons: [],
  },
];
