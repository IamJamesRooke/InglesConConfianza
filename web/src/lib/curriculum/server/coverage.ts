import "server-only";

import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";
import { normalizeLessons } from "@/lib/lesson-builder/utils";

// Which lesson first teaches each curriculum concept, derived from the
// "concepts covered" field on lessons (in lesson order). Only entries linked to
// a real curriculum_concepts row count; free-typed chips are ignored.
export type ConceptCoverage = {
  lessonId: string;
  lessonNumber: number;
  lessonName: string | null;
};

export async function readConceptCoverage(): Promise<
  Map<string, ConceptCoverage>
> {
  const lessonFile = await readLessonFile();
  const lessons = normalizeLessons(lessonFile.lessons);

  const coverage = new Map<string, ConceptCoverage>();
  lessons.forEach((lesson, index) => {
    for (const concept of lesson.concepts) {
      if (concept.conceptId && !coverage.has(concept.conceptId)) {
        coverage.set(concept.conceptId, {
          lessonId: lesson.id,
          lessonNumber: index + 1,
          lessonName: lesson.name,
        });
      }
    }
  });

  return coverage;
}
