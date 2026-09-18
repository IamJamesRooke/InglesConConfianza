import "server-only";

import { hasDatabase, prisma } from "@/lib/database/prisma";
import type { CurriculumRole } from "@/lib/curriculum/types";

export type ConceptDisplay = {
  spanish: string;
  english: string;
  role: CurriculumRole;
  // The concept's `pos:*`/`grammar:*`/`construction:*` collection names,
  // plus the two `topic:*` facets the syllabus card's "Time and place" group
  // also reads (`topic:time`, and any `topic:noun-time-*` sub-facet like
  // día's `topic:noun-time-days-periods`) — absent when it has none of
  // them. Read by the lesson builder's syllabus card to group its pills
  // (src/lib/lesson-builder/syllabus-groups.ts), which needs the full set,
  // not just the first `pos:*` collection, to tell e.g. "conmigo"
  // (prepositional pronoun) apart from plain "yo".
  collections?: string[];
};

export async function readConceptDisplays(conceptIds: string[]) {
  const ids = [...new Set(conceptIds.filter(Boolean))];
  if (ids.length === 0) return {} as Record<string, ConceptDisplay>;
  // No curriculum database on this deployment (docs/engineering/deploy.md,
  // "Learner site: read-only") — the learner app falls back to the label
  // already stored in the lesson (see callers of readConceptDisplays: the
  // practice page catches this the same as a query failure).
  if (!hasDatabase()) return {} as Record<string, ConceptDisplay>;

  const concepts = await prisma.curriculumConcept.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      spanish: true,
      english: true,
      curriculumRole: true,
      collections: {
        where: {
          OR: [
            { collectionName: { startsWith: "pos:" } },
            { collectionName: { startsWith: "grammar:" } },
            { collectionName: { startsWith: "construction:" } },
            { collectionName: "topic:time" },
            { collectionName: { startsWith: "topic:noun-time-" } },
          ],
        },
        orderBy: { position: "asc" },
        select: { collectionName: true },
      },
    },
  });

  return Object.fromEntries(
    concepts.map((concept) => [
      concept.id,
      {
        spanish: concept.spanish,
        english: concept.english,
        role: concept.curriculumRole,
        collections: concept.collections.map((row) => row.collectionName),
      },
    ]),
  ) as Record<string, ConceptDisplay>;
}
