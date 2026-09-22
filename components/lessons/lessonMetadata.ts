// Page metadata for a lesson, derived from the content model.
//
// Each lesson page used to spell out its own title string ("Mitosis — Cell Biology ·
// Cellscape"). With 21 lessons still to build, that is 21 chances for the format to
// drift; the lesson only supplies the part that isn't derivable — its description.
import type { Metadata } from "next";
import { getLesson, type TopicId } from "@/content/topics";

export function lessonMetadata(
  topicId: TopicId,
  lessonId: string,
  description: string,
): Metadata {
  const { topic, lesson } = getLesson(topicId, lessonId);
  const title = `${lesson.title} — ${topic.title} · Cellscape`;
  return {
    title,
    description,
    openGraph: { title, description, url: `https://cellscape.app/topics/${topic.id}/${lesson.slug}` },
  };
}
