import { curriculumRoles } from "@/lib/curriculum/types";
import type { Lesson } from "@/lib/lesson-builder/types";

export type ConceptPriorityBand = "high" | "medium" | "low" | "neutral";

export type SuggestionConceptDisplay = {
  spanish: string;
  english: string;
  role?: string;
};

export type LessonConceptSuggestion = SuggestionConceptDisplay & {
  conceptId: string;
  lessonGap: number;
  priorityBand: ConceptPriorityBand;
};

const teachableRoles = curriculumRoles.filter((role) => role !== "trash");

export function conceptPriority(role?: string) {
  const index = teachableRoles.findIndex((candidate) => candidate === role);
  if (index < 0) {
    return { rank: Number.MAX_SAFE_INTEGER, band: "neutral" as const };
  }

  const bandIndex = Math.min(2, Math.floor((index * 3) / teachableRoles.length));
  const band = (["high", "medium", "low"] as const)[bandIndex];
  return { rank: index, band };
}

export function suggestConceptsForLesson({
  lessons,
  lessonId,
  conceptDisplays,
  limit = 8,
}: {
  lessons: Pick<Lesson, "id" | "concepts">[];
  lessonId: string;
  conceptDisplays: Record<string, SuggestionConceptDisplay>;
  limit?: number;
}): LessonConceptSuggestion[] {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex <= 0 || limit <= 0) return [];

  const lastSeen = new Map<string, number>();
  for (let index = 0; index < lessonIndex; index += 1) {
    for (const concept of lessons[index].concepts) {
      if (concept.conceptId) lastSeen.set(concept.conceptId, index);
    }
  }

  const currentConceptIds = new Set(
    lessons[lessonIndex].concepts.flatMap((concept) =>
      concept.conceptId ? [concept.conceptId] : [],
    ),
  );

  return [...lastSeen]
    .flatMap(([conceptId, lastSeenIndex]) => {
      if (currentConceptIds.has(conceptId)) return [];
      const display = conceptDisplays[conceptId];
      if (!display || display.role === "trash") return [];
      return [
        {
          conceptId,
          ...display,
          lessonGap: lessonIndex - lastSeenIndex,
          priorityBand: conceptPriority(display.role).band,
        },
      ];
    })
    .sort((left, right) => {
      const gapDifference = right.lessonGap - left.lessonGap;
      if (gapDifference !== 0) return gapDifference;
      const priorityDifference =
        conceptPriority(left.role).rank - conceptPriority(right.role).rank;
      if (priorityDifference !== 0) return priorityDifference;
      return left.english.localeCompare(right.english);
    })
    .slice(0, limit);
}
