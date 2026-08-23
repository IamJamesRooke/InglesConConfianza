import "dotenv/config";

import type { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/database/prisma";

class DryRunRollback extends Error {}

function optionValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function approveBatch(
  transaction: Prisma.TransactionClient,
  batchId: string,
) {
  const batch = await transaction.reviewBatch.findUnique({
    where: { id: batchId },
    select: { id: true, status: true },
  });
  if (!batch) throw new Error(`Review batch not found: ${batchId}`);
  if (batch.status !== "open") {
    throw new Error(`Review batch is already closed: ${batchId}`);
  }

  const result = await transaction.reviewCandidate.updateMany({
    where: {
      batchId,
      approved: false,
      deleted: false,
      migrated: false,
    },
    data: { approved: true },
  });
  if (result.count === 0) {
    throw new Error("The batch has no pending candidates to approve.");
  }
  return { batchId, approved: result.count };
}

async function main() {
  const batchId = optionValue("--batch");
  const apply = process.argv.includes("--apply");
  if (!batchId) {
    throw new Error(
      "Usage: npm run curriculum:review:approve -- --batch <batch-id> [--apply]",
    );
  }

  try {
    const summary = await prisma.$transaction(
      async (transaction) => {
        const result = await approveBatch(transaction, batchId);
        if (!apply) throw new DryRunRollback(JSON.stringify(result));
        return result;
      },
      { timeout: 30_000 },
    );
    console.log(
      `Approved ${summary.approved} candidates in ${summary.batchId}.`,
    );
  } catch (error) {
    if (error instanceof DryRunRollback) {
      const summary = JSON.parse(error.message) as {
        batchId: string;
        approved: number;
      };
      console.log(
        `Dry run passed for ${summary.batchId}: ${summary.approved} candidates would be approved. Re-run with --apply to commit.`,
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
