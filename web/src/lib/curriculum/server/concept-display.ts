import "server-only";

import { prisma } from "@/lib/database/prisma";
import type { CurriculumRole } from "@/lib/curriculum/types";

export type ConceptDisplay = {
  spanish: string;
  english: string;
  role: CurriculumRole;
  // The concept's `pos:*`/`grammar:*`/`construction:*` collection names
  // (e.g. `["pos:pronoun", "grammar:prepositional-pronoun"]`); absent when
  // it has none of them. Read by the lesson builder's syllabus card to
  // group its pills (src/lib/lesson-builder/syllabus-groups.ts), which
  // needs the full set, not just the first `pos:*` collection, to tell
  // e.g. "conmigo" (prepositional pronoun) apart from plain "yo".
  collections?: string[];
};

export async function readConceptDisplays(conceptIds: string[]) {
  const ids = [...new Set(conceptIds.filter(Boolean))];
  if (ids.length === 0) return {} as Record<string, ConceptDisplay>;

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
