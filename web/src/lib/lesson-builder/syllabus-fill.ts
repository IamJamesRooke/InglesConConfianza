// "Add from Level…" (round 2, item B — docs/design/lesson-builder-round-2.md):
// pure filtering/grouping over a level's concepts and the whole course's
// modules, so the picker component stays a thin fetch+render shell. A
// concept already claimed by ANY module's Main or Review list — not just
// this one — is excluded, so a later module (e.g. Confianza II) is never
// offered what an earlier one already claims.
import { groupSyllabusItems, type SyllabusGroupOf } from "@/lib/lesson-builder/syllabus-groups";
import type { LessonModule } from "@/lib/lesson-builder/types";

export type ByLevelConcept = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
  pos: string | null;
};

function claimedConceptIds(modules: readonly LessonModule[]): Set<string> {
  const claimed = new Set<string>();
  for (const courseModule of modules) {
    const syllabus = courseModule.syllabus;
    if (!syllabus) continue;
    for (const item of syllabus.main) {
      if (item.conceptId) claimed.add(item.conceptId);
    }
    for (const item of syllabus.review) {
      if (item.conceptId) claimed.add(item.conceptId);
    }
  }
  return claimed;
}

/**
 * Concepts at a level not yet claimed by any module's Main or Review list,
 * grouped the same way the syllabus card groups its own pills
 * (syllabus-groups.ts). Order within a group is `rows`' own order (the
 * route's `sort_order`).
 */
export function unclaimedConceptsForLevel(
  rows: readonly ByLevelConcept[],
  modules: readonly LessonModule[],
): SyllabusGroupOf<ByLevelConcept>[] {
  const claimed = claimedConceptIds(modules);
  const unclaimed = rows.filter((row) => !claimed.has(row.id));
  return groupSyllabusItems(unclaimed, (row) => row.pos);
}
