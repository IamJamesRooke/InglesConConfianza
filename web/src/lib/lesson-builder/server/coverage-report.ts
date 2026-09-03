import "server-only";

import { prisma } from "@/lib/database/prisma";
import type { CurriculumRole } from "@/lib/curriculum/types";
import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";
import { normalizeLessons } from "@/lib/lesson-builder/utils";

// A cross-lesson view of what the "concepts covered" fields declare, in lesson
// order: which lesson introduces each concept, where it is reinforced, and how
// long it has gone untouched. Everything here is derived from data/lessons.json
// + the curriculum rows it points at — nothing is stored.

export type CoveredConcept = {
  conceptId: string;
  spanish: string;
  english: string;
  role: CurriculumRole;
  lessonNumbers: number[];
  firstLesson: number;
  lastLesson: number;
  timesTaught: number;
  lessonsSinceLast: number;
};

export type CoverageReport = {
  lessons: Array<{ id: string; number: number; name: string | null }>;
  concepts: CoveredConcept[];
  // Free-typed chips with no curriculum row yet — the "please author these" queue.
  requested: Array<{ label: string; lessonNumbers: number[] }>;
  // Chips that point at a concept id no longer in the catalog (trashed/deleted).
  missing: Array<{ conceptId: string; label: string; lessonNumbers: number[] }>;
};

export async function readCoverageReport(): Promise<CoverageReport> {
  const lessonFile = await readLessonFile();
  const lessons = normalizeLessons(lessonFile.lessons);
  const lessonCount = lessons.length;

  // conceptId -> sorted distinct lesson numbers; same for labels without an id.
  const byConceptId = new Map<string, Set<number>>();
  const byRequestedLabel = new Map<string, Set<number>>();
  const labelForId = new Map<string, string>();

  lessons.forEach((lesson, index) => {
    const lessonNumber = index + 1;
    for (const concept of lesson.concepts) {
      if (concept.conceptId) {
        if (!byConceptId.has(concept.conceptId)) {
          byConceptId.set(concept.conceptId, new Set());
        }
        byConceptId.get(concept.conceptId)!.add(lessonNumber);
        if (concept.label) labelForId.set(concept.conceptId, concept.label);
      } else if (concept.label.trim()) {
        const key = concept.label.trim();
        if (!byRequestedLabel.has(key)) byRequestedLabel.set(key, new Set());
        byRequestedLabel.get(key)!.add(lessonNumber);
      }
    }
  });

  const rows =
    byConceptId.size > 0
      ? await prisma.curriculumConcept.findMany({
          where: { id: { in: [...byConceptId.keys()] } },
          select: {
            id: true,
            spanish: true,
            english: true,
            curriculumRole: true,
          },
        })
      : [];
  const rowById = new Map(rows.map((row) => [row.id, row]));

  const concepts: CoveredConcept[] = [];
  const missing: CoverageReport["missing"] = [];

  for (const [conceptId, lessonSet] of byConceptId) {
    const lessonNumbers = [...lessonSet].sort((a, b) => a - b);
    const row = rowById.get(conceptId);
    if (!row) {
      missing.push({
        conceptId,
        label: labelForId.get(conceptId) ?? conceptId,
        lessonNumbers,
      });
      continue;
    }
    const lastLesson = lessonNumbers[lessonNumbers.length - 1];
    concepts.push({
      conceptId,
      spanish: row.spanish,
      english: row.english,
      role: row.curriculumRole,
      lessonNumbers,
      firstLesson: lessonNumbers[0],
      lastLesson,
      timesTaught: lessonNumbers.length,
      lessonsSinceLast: lessonCount - lastLesson,
    });
  }

  // Coldest first, then most-recently introduced, then alphabetical.
  concepts.sort(
    (a, b) =>
      b.lessonsSinceLast - a.lessonsSinceLast ||
      b.firstLesson - a.firstLesson ||
      a.spanish.localeCompare(b.spanish),
  );

  const requested = [...byRequestedLabel.entries()]
    .map(([label, set]) => ({
      label,
      lessonNumbers: [...set].sort((a, b) => a - b),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  missing.sort((a, b) => a.label.localeCompare(b.label));

  return {
    lessons: lessons.map((lesson, index) => ({
      id: lesson.id,
      number: index + 1,
      name: lesson.name,
    })),
    concepts,
    requested,
    missing,
  };
}
