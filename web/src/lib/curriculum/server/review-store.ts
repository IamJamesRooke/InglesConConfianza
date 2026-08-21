import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  ReviewBatch,
  ReviewCandidate,
  ReviewFile,
} from "@/lib/curriculum/review-types";
import type { CurriculumRole } from "@/lib/curriculum/types";
import {
  removeUnusedCollections,
} from "@/lib/curriculum/server/curriculum-store";
import { isReviewCandidate } from "@/lib/curriculum/validation";
import { prisma } from "@/lib/database/prisma";

type CandidateRow = {
  id: string;
  action: "add" | "revise";
  existingConceptId: string | null;
  suggestedCurriculumRole: CurriculumRole;
  spanish: string;
  english: string;
  exampleSpanish: string;
  exampleEnglish: string;
  curriculumRole: CurriculumRole;
  sourcePaths: string[];
  rationale: string;
  approved: boolean;
  deleted: boolean;
  migrated: boolean;
  ownerNote: string;
  collections: Array<{ collectionName: string }>;
};

type BatchRow = {
  id: string;
  title: string;
  sourcePaths: string[];
  createdAt: Date;
  status: "open" | "migrated";
  migratedAt: Date | null;
  candidates: CandidateRow[];
};

const candidateRelations = {
  collections: {
    orderBy: { position: "asc" },
    select: { collectionName: true },
  },
} satisfies Prisma.ReviewCandidateInclude;

export class ReviewBatchNotFoundError extends Error {
  constructor() {
    super("Batch not found.");
  }
}

export class ReviewCandidateNotFoundError extends Error {
  constructor() {
    super("Candidate not found.");
  }
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toReviewCandidate(row: CandidateRow): ReviewCandidate {
  return {
    id: row.id,
    action: row.action,
    ...(row.existingConceptId
      ? { existingConceptId: row.existingConceptId }
      : {}),
    suggestedCurriculumRole: row.suggestedCurriculumRole,
    spanish: row.spanish,
    english: row.english,
    example: {
      spanish: row.exampleSpanish,
      english: row.exampleEnglish,
    },
    collections: row.collections.map((membership) => membership.collectionName),
    curriculumRole: row.curriculumRole,
    sourcePaths: row.sourcePaths,
    rationale: row.rationale,
    approved: row.approved,
    deleted: row.deleted,
    migrated: row.migrated,
    ownerNote: row.ownerNote,
  };
}

function toReviewBatch(row: BatchRow): ReviewBatch {
  return {
    id: row.id,
    title: row.title,
    sourcePaths: row.sourcePaths,
    createdAt: formatDate(row.createdAt),
    status: row.status,
    ...(row.migratedAt ? { migratedAt: formatDate(row.migratedAt) } : {}),
    candidates: row.candidates.map(toReviewCandidate),
  };
}

export { isReviewCandidate };

export async function readReviewFile(): Promise<ReviewFile> {
  const batches = await prisma.reviewBatch.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      candidates: {
        orderBy: { sortOrder: "asc" },
        include: candidateRelations,
      },
    },
  });

  return {
    version: 1,
    batches: batches.map(toReviewBatch),
  };
}

export async function updateReviewCandidate(
  batchId: string,
  candidate: ReviewCandidate,
): Promise<ReviewCandidate> {
  return prisma.$transaction(async (transaction) => {
    const batch = await transaction.reviewBatch.findUnique({
      where: { id: batchId },
      select: { id: true },
    });
    if (!batch) throw new ReviewBatchNotFoundError();

    const existing = await transaction.reviewCandidate.findUnique({
      where: { batchId_id: { batchId, id: candidate.id } },
      select: { id: true },
    });
    if (!existing) throw new ReviewCandidateNotFoundError();

    const collections = candidate.collections.map((collection) =>
      collection.trim(),
    );
    if (collections.length > 0) {
      await transaction.collection.createMany({
        data: collections.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    await transaction.reviewCandidateCollection.deleteMany({
      where: { batchId, candidateId: candidate.id },
    });
    await transaction.reviewCandidate.update({
      where: { batchId_id: { batchId, id: candidate.id } },
      data: {
        action: candidate.action,
        existingConceptId: candidate.existingConceptId?.trim() || null,
        suggestedCurriculumRole: candidate.suggestedCurriculumRole,
        spanish: candidate.spanish.trim(),
        english: candidate.english.trim(),
        exampleSpanish: candidate.example.spanish.trim(),
        exampleEnglish: candidate.example.english.trim(),
        curriculumRole: candidate.curriculumRole,
        sourcePaths: candidate.sourcePaths.map((sourcePath) => sourcePath.trim()),
        rationale: candidate.rationale.trim(),
        approved: candidate.approved,
        deleted: candidate.deleted ?? false,
        migrated: candidate.migrated ?? false,
        ownerNote: candidate.ownerNote.trim(),
      },
    });

    if (collections.length > 0) {
      await transaction.reviewCandidateCollection.createMany({
        data: collections.map((collectionName, position) => ({
          batchId,
          candidateId: candidate.id,
          collectionName,
          position,
        })),
      });
    }

    await removeUnusedCollections(transaction);
    const updated = await transaction.reviewCandidate.findUniqueOrThrow({
      where: { batchId_id: { batchId, id: candidate.id } },
      include: candidateRelations,
    });
    return toReviewCandidate(updated);
  });
}
