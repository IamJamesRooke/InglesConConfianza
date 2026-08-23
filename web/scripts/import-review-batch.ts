import "dotenv/config";

import type { Prisma } from "../src/generated/prisma/client";
import type { ReviewBatch } from "../src/lib/curriculum/review-types";
import { loadReviewBatch, databaseDate } from "./curriculum-data";
import {
  preflightReviewBatch,
  printPreflightIssues,
} from "./review-batch-preflight";
import { prisma } from "../src/lib/database/prisma";

class DryRunRollback extends Error {}

function optionValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function insertBatch(
  transaction: Prisma.TransactionClient,
  batch: ReviewBatch,
) {
  if (batch.status !== "open" || batch.migratedAt) {
    throw new Error("A new review batch must have open status and no migration date.");
  }
  if (
    batch.candidates.some(
      (candidate) =>
        candidate.approved || candidate.deleted || candidate.migrated,
    )
  ) {
    throw new Error(
      "New review candidates must begin unapproved, undeleted, and unmigrated.",
    );
  }
  if (
    batch.candidates.some(
      (candidate) =>
        (candidate.action === "add" && candidate.existingConceptId) ||
        (candidate.action === "revise" && !candidate.existingConceptId),
    )
  ) {
    throw new Error(
      "Add candidates cannot name an existing concept; revise candidates must name one.",
    );
  }

  const existingBatch = await transaction.reviewBatch.findUnique({
    where: { id: batch.id },
    select: { id: true },
  });
  if (existingBatch) throw new Error(`Review batch already exists: ${batch.id}`);

  const revisionIds = batch.candidates.flatMap((candidate) =>
    candidate.action === "revise" && candidate.existingConceptId
      ? [candidate.existingConceptId]
      : [],
  );
  if (revisionIds.length > 0) {
    const existingRevisionCount = await transaction.curriculumConcept.count({
      where: { id: { in: revisionIds } },
    });
    if (existingRevisionCount !== new Set(revisionIds).size) {
      throw new Error("At least one revision target does not exist.");
    }
  }

  const collectionNames = [
    ...new Set(batch.candidates.flatMap((candidate) => candidate.collections)),
  ];
  if (collectionNames.length > 0) {
    await transaction.collection.createMany({
      data: collectionNames.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  const maximumOrder = await transaction.reviewBatch.aggregate({
    _max: { sortOrder: true },
  });
  await transaction.reviewBatch.create({
    data: {
      id: batch.id,
      title: batch.title,
      sourcePaths: batch.sourcePaths,
      createdAt: databaseDate(batch.createdAt),
      status: "open",
      sortOrder: (maximumOrder._max.sortOrder ?? -1) + 1,
    },
  });
  await transaction.reviewCandidate.createMany({
    data: batch.candidates.map((candidate, sortOrder) => ({
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
      approved: false,
      deleted: false,
      migrated: false,
      ownerNote: candidate.ownerNote,
      sortOrder,
    })),
  });
  if (batch.candidates.some((candidate) => candidate.collections.length > 0)) {
    await transaction.reviewCandidateCollection.createMany({
      data: batch.candidates.flatMap((candidate) =>
        candidate.collections.map((collectionName, position) => ({
          batchId: batch.id,
          candidateId: candidate.id,
          collectionName,
          position,
        })),
      ),
    });
  }

  return { id: batch.id, candidates: batch.candidates.length };
}

async function main() {
  const filePath = optionValue("--file");
  const apply = process.argv.includes("--apply");
  if (!filePath) {
    throw new Error(
      "Usage: npm run curriculum:review:import -- --file <batch.json> [--apply]",
    );
  }

  const batch = await loadReviewBatch(filePath);
  const issues = await preflightReviewBatch(prisma, batch);
  printPreflightIssues(issues);
  const errors = issues.filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    throw new Error(
      `Review batch preflight failed with ${errors.length} error(s).`,
    );
  }

  try {
    const summary = await prisma.$transaction(
      async (transaction) => {
        const result = await insertBatch(transaction, batch);
        if (!apply) throw new DryRunRollback(JSON.stringify(result));
        return result;
      },
      { timeout: 30_000 },
    );
    console.log(
      `Imported review batch ${summary.id} with ${summary.candidates} candidates.`,
    );
  } catch (error) {
    if (error instanceof DryRunRollback) {
      const summary = JSON.parse(error.message) as {
        id: string;
        candidates: number;
      };
      console.log(
        `Dry run passed for ${summary.id} with ${summary.candidates} candidates. Re-run with --apply to import it.`,
      );
      return;
    }
    throw error;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
