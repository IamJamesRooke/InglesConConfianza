import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  CurriculumConcept,
  CurriculumRole,
} from "@/lib/curriculum/types";
import { isCurriculumConcept } from "@/lib/curriculum/validation";
import { prisma } from "@/lib/database/prisma";

type ConceptRow = {
  id: string;
  spanish: string;
  english: string;
  exampleSpanish: string;
  exampleEnglish: string;
  curriculumRole: CurriculumRole;
  collections: Array<{ collectionName: string }>;
};

export const curriculumPageSize = 50;

export type CurriculumPageFilters = {
  search: string;
  collection: string;
  role: CurriculumRole | "all";
};

export type CurriculumPageResult = CurriculumPageFilters & {
  concepts: CurriculumConcept[];
  availableCollections: string[];
  page: number;
  pageCount: number;
  totalConcepts: number;
};

const conceptRelations = {
  collections: {
    orderBy: { position: "asc" },
    select: { collectionName: true },
  },
} satisfies Prisma.CurriculumConceptInclude;

export class CurriculumConceptNotFoundError extends Error {
  constructor() {
    super("Concept not found.");
  }
}

function toCurriculumConcept(row: ConceptRow): CurriculumConcept {
  return {
    id: row.id,
    spanish: row.spanish,
    english: row.english,
    example: {
      spanish: row.exampleSpanish,
      english: row.exampleEnglish,
    },
    collections: row.collections.map((membership) => membership.collectionName),
    curriculumRole: row.curriculumRole,
  };
}

async function ensureCollections(
  transaction: Prisma.TransactionClient,
  collectionNames: string[],
) {
  if (collectionNames.length === 0) return;

  await transaction.collection.createMany({
    data: collectionNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
}

export async function removeUnusedCollections(
  transaction: Prisma.TransactionClient,
) {
  await transaction.collection.deleteMany({
    where: { conceptMemberships: { none: {} } },
  });
}

export { isCurriculumConcept };

export async function readCurriculumPage({
  page: requestedPage,
  search,
  collection,
  role,
  requireCollections = [],
}: CurriculumPageFilters & {
  page: number;
  requireCollections?: string[];
}): Promise<CurriculumPageResult> {
  const anded = [...new Set([...requireCollections, collection].filter(Boolean))];
  const where = {
    ...(search
      ? {
          OR: [
            { spanish: { contains: search, mode: "insensitive" as const } },
            { english: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(anded.length > 0
      ? {
          AND: anded.map((name) => ({
            collections: { some: { collectionName: name } },
          })),
        }
      : {}),
    ...(role === "all" ? {} : { curriculumRole: role }),
  } satisfies Prisma.CurriculumConceptWhereInput;

  const totalConcepts = await prisma.curriculumConcept.count({ where });
  const pageCount = Math.max(
    1,
    Math.ceil(totalConcepts / curriculumPageSize),
  );
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const [concepts, collections] = await Promise.all([
    prisma.curriculumConcept.findMany({
      where,
      orderBy: [{ curriculumRole: "asc" }, { sortOrder: "asc" }],
      skip: (page - 1) * curriculumPageSize,
      take: curriculumPageSize,
      include: conceptRelations,
    }),
    prisma.collection.findMany({
      where: { conceptMemberships: { some: {} } },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return {
    concepts: concepts.map(toCurriculumConcept),
    availableCollections: collections.map(({ name }) => name),
    page,
    pageCount,
    totalConcepts,
    search,
    collection,
    role,
  };
}

export async function updateCurriculumConcept(
  concept: CurriculumConcept,
): Promise<CurriculumConcept> {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.curriculumConcept.findUnique({
      where: { id: concept.id },
      select: { id: true },
    });

    if (!existing) throw new CurriculumConceptNotFoundError();

    const collections = concept.collections.map((collection) =>
      collection.trim(),
    );
    await ensureCollections(transaction, collections);
    await transaction.conceptCollection.deleteMany({
      where: { conceptId: concept.id },
    });
    await transaction.curriculumConcept.update({
      where: { id: concept.id },
      data: {
        spanish: concept.spanish.trim(),
        english: concept.english.trim(),
        exampleSpanish: concept.example.spanish.trim(),
        exampleEnglish: concept.example.english.trim(),
        curriculumRole: concept.curriculumRole,
      },
    });

    if (collections.length > 0) {
      await transaction.conceptCollection.createMany({
        data: collections.map((collectionName, position) => ({
          conceptId: concept.id,
          collectionName,
          position,
        })),
      });
    }

    await removeUnusedCollections(transaction);
    const updated = await transaction.curriculumConcept.findUniqueOrThrow({
      where: { id: concept.id },
      include: conceptRelations,
    });
    return toCurriculumConcept(updated);
  });
}

export async function deleteCurriculumConcept(conceptId: string) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.curriculumConcept.findUnique({
      where: { id: conceptId },
      select: { id: true },
    });

    if (!existing) throw new CurriculumConceptNotFoundError();

    await transaction.curriculumConcept.delete({ where: { id: conceptId } });
    await removeUnusedCollections(transaction);
    return conceptId;
  });
}
