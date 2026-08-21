import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import type {
  ReviewBatch,
  ReviewCandidate,
  ReviewFile,
} from "../src/lib/curriculum/review-types";
import type {
  CurriculumConcept,
  CurriculumFile,
} from "../src/lib/curriculum/types";
import {
  isCurriculumFile,
  isReviewBatch,
  isReviewFile,
} from "../src/lib/curriculum/validation";

export const seedDataDirectory = path.join(
  process.cwd(),
  "prisma",
  "seed-data",
);

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

export async function loadSeedData() {
  const [curriculumValue, reviewValue] = await Promise.all([
    readJson(path.join(seedDataDirectory, "curriculum.json")),
    readJson(path.join(seedDataDirectory, "curriculum-review.json")),
  ]);

  if (!isCurriculumFile(curriculumValue)) {
    throw new Error("The curriculum seed snapshot has an invalid shape.");
  }
  if (!isReviewFile(reviewValue)) {
    throw new Error("The review seed snapshot has an invalid shape.");
  }

  return { curriculum: curriculumValue, review: reviewValue };
}

export async function loadReviewBatch(filePath: string) {
  const value = await readJson(path.resolve(filePath));
  if (!isReviewBatch(value)) {
    throw new Error("The review batch file has an invalid shape.");
  }
  return value;
}

export function databaseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid database date: ${value}`);
  }
  return date;
}

export function formatDatabaseDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function seedCurriculumDatabase(
  client: PrismaClient,
  curriculum: CurriculumFile,
  review: ReviewFile,
) {
  await client.$transaction(
    async (transaction) => {
      const [conceptCount, batchCount, candidateCount, collectionCount] =
        await Promise.all([
          transaction.curriculumConcept.count(),
          transaction.reviewBatch.count(),
          transaction.reviewCandidate.count(),
          transaction.collection.count(),
        ]);

      if (conceptCount || batchCount || candidateCount || collectionCount) {
        throw new Error(
          "Curriculum tables are not empty. Seeding refuses to overwrite existing data.",
        );
      }

      const collectionNames = [
        ...new Set([
          ...curriculum.concepts.flatMap((concept) => concept.collections),
          ...review.batches.flatMap((batch) =>
            batch.candidates.flatMap((candidate) => candidate.collections),
          ),
        ]),
      ];

      await transaction.collection.createMany({
        data: collectionNames.map((name) => ({ name })),
      });
      await transaction.curriculumConcept.createMany({
        data: curriculum.concepts.map((concept, sortOrder) => ({
          id: concept.id,
          spanish: concept.spanish,
          english: concept.english,
          exampleSpanish: concept.example.spanish,
          exampleEnglish: concept.example.english,
          curriculumRole: concept.curriculumRole,
          sortOrder,
        })),
      });
      await transaction.conceptCollection.createMany({
        data: curriculum.concepts.flatMap((concept) =>
          concept.collections.map((collectionName, position) => ({
            conceptId: concept.id,
            collectionName,
            position,
          })),
        ),
      });
      await transaction.reviewBatch.createMany({
        data: review.batches.map((batch, sortOrder) => ({
          id: batch.id,
          title: batch.title,
          sourcePaths: batch.sourcePaths,
          createdAt: databaseDate(batch.createdAt),
          status: batch.status,
          migratedAt: batch.migratedAt
            ? databaseDate(batch.migratedAt)
            : null,
          sortOrder,
        })),
      });
      await transaction.reviewCandidate.createMany({
        data: review.batches.flatMap((batch) =>
          batch.candidates.map((candidate, sortOrder) => ({
            batchId: batch.id,
            id: candidate.id,
            action: candidate.action,
            existingConceptId: candidate.existingConceptId ?? null,
            suggestedCurriculumRole: candidate.suggestedCurriculumRole,
            spanish: candidate.spanish,
            english: candidate.english,
            exampleSpanish: candidate.example.spanish,
            exampleEnglish: candidate.example.english,
            curriculumRole: candidate.curriculumRole,
            sourcePaths: candidate.sourcePaths,
            rationale: candidate.rationale,
            approved: candidate.approved,
            deleted: candidate.deleted ?? false,
            migrated: candidate.migrated ?? false,
            ownerNote: candidate.ownerNote,
            sortOrder,
          })),
        ),
      });
      await transaction.reviewCandidateCollection.createMany({
        data: review.batches.flatMap((batch) =>
          batch.candidates.flatMap((candidate) =>
            candidate.collections.map((collectionName, position) => ({
              batchId: batch.id,
              candidateId: candidate.id,
              collectionName,
              position,
            })),
          ),
        ),
      });
    },
    { timeout: 30_000 },
  );
}

type ConceptRow = Prisma.CurriculumConceptGetPayload<{
  include: { collections: true };
}>;
type BatchRow = Prisma.ReviewBatchGetPayload<{
  include: { candidates: { include: { collections: true } } };
}>;

function conceptFromRow(row: ConceptRow): CurriculumConcept {
  return {
    id: row.id,
    spanish: row.spanish,
    english: row.english,
    example: { spanish: row.exampleSpanish, english: row.exampleEnglish },
    collections: row.collections.map((item) => item.collectionName),
    curriculumRole: row.curriculumRole,
  };
}

function candidateFromRow(
  row: BatchRow["candidates"][number],
): ReviewCandidate {
  return {
    id: row.id,
    action: row.action,
    ...(row.existingConceptId
      ? { existingConceptId: row.existingConceptId }
      : {}),
    suggestedCurriculumRole: row.suggestedCurriculumRole,
    spanish: row.spanish,
    english: row.english,
    example: { spanish: row.exampleSpanish, english: row.exampleEnglish },
    collections: row.collections.map((item) => item.collectionName),
    curriculumRole: row.curriculumRole,
    sourcePaths: row.sourcePaths,
    rationale: row.rationale,
    approved: row.approved,
    ...(row.deleted ? { deleted: true } : {}),
    ...(row.migrated ? { migrated: true } : {}),
    ownerNote: row.ownerNote,
  };
}

function batchFromRow(row: BatchRow): ReviewBatch {
  return {
    id: row.id,
    title: row.title,
    sourcePaths: row.sourcePaths,
    createdAt: formatDatabaseDate(row.createdAt),
    status: row.status,
    ...(row.migratedAt
      ? { migratedAt: formatDatabaseDate(row.migratedAt) }
      : {}),
    candidates: row.candidates.map(candidateFromRow),
  };
}

export async function exportCurriculumDatabase(client: PrismaClient) {
  const [conceptRows, batchRows] = await Promise.all([
    client.curriculumConcept.findMany({
      orderBy: { sortOrder: "asc" },
      include: { collections: { orderBy: { position: "asc" } } },
    }),
    client.reviewBatch.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        candidates: {
          orderBy: { sortOrder: "asc" },
          include: { collections: { orderBy: { position: "asc" } } },
        },
      },
    }),
  ]);

  return {
    curriculum: {
      version: 1,
      concepts: conceptRows.map(conceptFromRow),
    } satisfies CurriculumFile,
    review: {
      version: 1,
      batches: batchRows.map(batchFromRow),
    } satisfies ReviewFile,
  };
}
