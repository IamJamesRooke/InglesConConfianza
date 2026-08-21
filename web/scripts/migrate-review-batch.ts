import "dotenv/config";

import type { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/database/prisma";

class DryRunRollback extends Error {}

function optionValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function cleanUnusedCollections(transaction: Prisma.TransactionClient) {
  await transaction.collection.deleteMany({
    where: {
      conceptMemberships: { none: {} },
      candidateMemberships: { none: {} },
    },
  });
}

async function migrateBatch(
  transaction: Prisma.TransactionClient,
  batchId: string,
) {
  const batch = await transaction.reviewBatch.findUnique({
    where: { id: batchId },
    include: {
      candidates: {
        where: { approved: true, deleted: false, migrated: false },
        orderBy: { sortOrder: "asc" },
        include: { collections: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!batch) throw new Error(`Review batch not found: ${batchId}`);
  if (batch.status !== "open") {
    throw new Error(`Review batch is already closed: ${batchId}`);
  }
  if (batch.candidates.length === 0) {
    throw new Error("The batch has no approved candidates ready to migrate.");
  }

  const maximumOrder = await transaction.curriculumConcept.aggregate({
    _max: { sortOrder: true },
  });
  let nextOrder = (maximumOrder._max.sortOrder ?? -1) + 1;

  for (const candidate of batch.candidates) {
    const collectionNames = candidate.collections.map(
      (membership) => membership.collectionName,
    );
    if (collectionNames.length > 0) {
      await transaction.collection.createMany({
        data: collectionNames.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    let conceptId: string;
    if (candidate.action === "add") {
      if (candidate.existingConceptId) {
        throw new Error(`Add candidate ${candidate.id} names a revision target.`);
      }
      conceptId = candidate.id;
      await transaction.curriculumConcept.create({
        data: {
          id: conceptId,
          spanish: candidate.spanish,
          english: candidate.english,
          exampleSpanish: candidate.exampleSpanish,
          exampleEnglish: candidate.exampleEnglish,
          curriculumRole: candidate.curriculumRole,
          sortOrder: nextOrder++,
        },
      });
    } else {
      if (!candidate.existingConceptId) {
        throw new Error(`Revision candidate ${candidate.id} has no target.`);
      }
      conceptId = candidate.existingConceptId;
      const target = await transaction.curriculumConcept.findUnique({
        where: { id: conceptId },
        select: { id: true },
      });
      if (!target) {
        throw new Error(`Revision target does not exist: ${conceptId}`);
      }
      await transaction.curriculumConcept.update({
        where: { id: conceptId },
        data: {
          spanish: candidate.spanish,
          english: candidate.english,
          exampleSpanish: candidate.exampleSpanish,
          exampleEnglish: candidate.exampleEnglish,
          curriculumRole: candidate.curriculumRole,
        },
      });
      await transaction.conceptCollection.deleteMany({
        where: { conceptId },
      });
    }

    if (collectionNames.length > 0) {
      await transaction.conceptCollection.createMany({
        data: collectionNames.map((collectionName, position) => ({
          conceptId,
          collectionName,
          position,
        })),
      });
    }
    await transaction.reviewCandidate.update({
      where: { batchId_id: { batchId, id: candidate.id } },
      data: { migrated: true },
    });
  }

  const unresolved = await transaction.reviewCandidate.count({
    where: { batchId, deleted: false, migrated: false },
  });
  if (unresolved === 0) {
    await transaction.reviewBatch.update({
      where: { id: batchId },
      data: {
        status: "migrated",
        migratedAt: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
      },
    });
  }
  await cleanUnusedCollections(transaction);

  return {
    batchId,
    migrated: batch.candidates.length,
    remaining: unresolved,
  };
}

async function main() {
  const batchId = optionValue("--batch");
  const apply = process.argv.includes("--apply");
  if (!batchId) {
    throw new Error(
      "Usage: npm run curriculum:migrate -- --batch <batch-id> [--apply]",
    );
  }

  try {
    const summary = await prisma.$transaction(
      async (transaction) => {
        const result = await migrateBatch(transaction, batchId);
        if (!apply) throw new DryRunRollback(JSON.stringify(result));
        return result;
      },
      { timeout: 30_000 },
    );
    console.log(
      `Migrated ${summary.migrated} candidates from ${summary.batchId}; ${summary.remaining} remain unresolved.`,
    );
  } catch (error) {
    if (error instanceof DryRunRollback) {
      const summary = JSON.parse(error.message) as {
        batchId: string;
        migrated: number;
        remaining: number;
      };
      console.log(
        `Dry run passed for ${summary.batchId}: ${summary.migrated} candidates would migrate and ${summary.remaining} would remain. Re-run with --apply to commit.`,
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
