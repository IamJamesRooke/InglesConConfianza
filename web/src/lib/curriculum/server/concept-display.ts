import "server-only";

import { prisma } from "@/lib/database/prisma";
import type { CurriculumRole } from "@/lib/curriculum/types";

export type ConceptDisplay = {
  spanish: string;
  english: string;
  role: CurriculumRole;
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
    },
  });

  return Object.fromEntries(
    concepts.map((concept) => [
      concept.id,
      {
        spanish: concept.spanish,
        english: concept.english,
        role: concept.curriculumRole,
      },
    ]),
  ) as Record<string, ConceptDisplay>;
}
