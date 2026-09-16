import "server-only";

import { prisma } from "@/lib/database/prisma";
import type { CurriculumRole } from "@/lib/curriculum/types";

export type ConceptDisplay = {
  spanish: string;
  english: string;
  role: CurriculumRole;
  // Bare part-of-speech token ("verb", "pronoun", …) taken from the
  // concept's first `pos:*` collection; absent when it has none. Read by
  // the lesson builder's syllabus card to group its pills
  // (src/lib/lesson-builder/syllabus-groups.ts).
  pos?: string;
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
        where: { collectionName: { startsWith: "pos:" } },
        orderBy: { position: "asc" },
        take: 1,
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
        pos: concept.collections[0]?.collectionName.slice(4),
      },
    ]),
  ) as Record<string, ConceptDisplay>;
}
