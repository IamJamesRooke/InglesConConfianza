import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  CurriculumConcept,
  CurriculumRole,
} from "@/lib/curriculum/types";
import type { CurriculumNavigationFamily } from "@/lib/curriculum/navigation";
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

export const curriculumPageSize = 100;

export type CurriculumSort =
  | "default"
  | "spanish"
  | "spanish-desc"
  | "english"
  | "english-desc"
  | "role";

export type CurriculumPageFilters = {
  search: string;
  collection: string;
  role: CurriculumRole | "all";
  sort: CurriculumSort;
};

const SORT_ORDER_BY: Record<
  CurriculumSort,
  Prisma.CurriculumConceptOrderByWithRelationInput[]
> = {
  default: [{ curriculumRole: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  spanish: [{ spanish: "asc" }, { id: "asc" }],
  "spanish-desc": [{ spanish: "desc" }, { id: "asc" }],
  english: [{ english: "asc" }, { id: "asc" }],
  "english-desc": [{ english: "desc" }, { id: "asc" }],
  role: [{ curriculumRole: "asc" }, { spanish: "asc" }, { id: "asc" }],
};

export type CurriculumPageResult = CurriculumPageFilters & {
  concepts: CurriculumConcept[];
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
  sort,
  requireCollections = [],
  anyCollections = [],
  excludeAnyCollections = [],
  idFilter,
}: CurriculumPageFilters & {
  page: number;
  requireCollections?: string[];
  anyCollections?: string[];
  excludeAnyCollections?: string[];
  // Restrict the result set to / away from a set of concept ids (used by the
  // "taught" coverage filter). Caller owns the meaning of the ids.
  idFilter?: { in: string[] } | { notIn: string[] };
}): Promise<CurriculumPageResult> {
  const anded = [...new Set([...requireCollections, collection].filter(Boolean))];
  const where = {
    ...(idFilter ? { id: idFilter } : {}),
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
    ...(anyCollections.length > 0
      ? {
          collections: {
            some: { collectionName: { in: [...new Set(anyCollections)] } },
          },
        }
      : {}),
    ...(excludeAnyCollections.length > 0
      ? {
          NOT: {
            collections: {
              some: {
                collectionName: {
                  in: [...new Set(excludeAnyCollections)],
                },
              },
            },
          },
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
  const concepts = await prisma.curriculumConcept.findMany({
    where,
    orderBy: SORT_ORDER_BY[sort] ?? SORT_ORDER_BY.default,
    skip: (page - 1) * curriculumPageSize,
    take: curriculumPageSize,
    include: conceptRelations,
  });

  return {
    concepts: concepts.map(toCurriculumConcept),
    page,
    pageCount,
    totalConcepts,
    search,
    collection,
    role,
    sort,
  };
}

export async function readCurriculumNavigationCounts({
  baseCollection,
  families,
  search,
  collection,
  role,
  idFilter,
}: {
  baseCollection: string;
  families: CurriculumNavigationFamily[];
  search: string;
  collection: string;
  role: CurriculumRole | "all";
  idFilter?: { in: string[] } | { notIn: string[] };
}) {
  const navigationCollections = [
    ...new Set(
      families.flatMap((family) =>
        family.leaves.map((leaf) => leaf.collection),
      ),
    ),
  ];
  const required = [...new Set([baseCollection, collection].filter(Boolean))];
  const conceptWhere = {
    ...(idFilter ? { id: idFilter } : {}),
    ...(search
      ? {
          OR: [
            { spanish: { contains: search, mode: "insensitive" as const } },
            { english: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(required.length > 0
      ? {
          AND: required.map((name) => ({
            collections: { some: { collectionName: name } },
          })),
        }
      : {}),
    ...(role === "all" ? {} : { curriculumRole: role }),
  } satisfies Prisma.CurriculumConceptWhereInput;
  const [memberships, topicConcepts] = await Promise.all([
    navigationCollections.length > 0
      ? prisma.conceptCollection.findMany({
          where: {
            collectionName: { in: navigationCollections },
            concept: conceptWhere,
          },
          select: { collectionName: true, conceptId: true },
        })
      : [],
    prisma.curriculumConcept.findMany({
      where: conceptWhere,
      select: { id: true },
    }),
  ]);

  const conceptIdsByCollection = new Map<string, Set<string>>();
  conceptIdsByCollection.set(
    "__topic__",
    new Set(topicConcepts.map((concept) => concept.id)),
  );
  for (const membership of memberships) {
    const ids = conceptIdsByCollection.get(membership.collectionName) ?? new Set();
    ids.add(membership.conceptId);
    conceptIdsByCollection.set(membership.collectionName, ids);
  }
  return conceptIdsByCollection;
}

export async function readCurriculumConcept(
  conceptId: string,
): Promise<CurriculumConcept> {
  const row = await prisma.curriculumConcept.findUnique({
    where: { id: conceptId },
    include: conceptRelations,
  });
  if (!row) throw new CurriculumConceptNotFoundError();
  return toCurriculumConcept(row);
}

// Every collection name in use, with how many concepts carry it — powers the
// tag autocomplete in the quick editor.
export async function readCollectionVocabulary(): Promise<
  Array<{ name: string; count: number }>
> {
  const grouped = await prisma.conceptCollection.groupBy({
    by: ["collectionName"],
    _count: { collectionName: true },
    orderBy: { collectionName: "asc" },
  });
  return grouped.map((entry) => ({
    name: entry.collectionName,
    count: entry._count.collectionName,
  }));
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
