import "dotenv/config";

import { loadReviewBatch } from "./curriculum-data";
import {
  preflightReviewBatch,
  printPreflightIssues,
} from "./review-batch-preflight";
import { prisma } from "../src/lib/database/prisma";

function optionValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const filePath = optionValue("--file");
  if (!filePath) {
    throw new Error(
      "Usage: npm run curriculum:review:preflight -- --file <batch.json>",
    );
  }

  const batch = await loadReviewBatch(filePath);
  const issues = await preflightReviewBatch(prisma, batch);
  printPreflightIssues(issues);

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  if (errors > 0) {
    throw new Error(
      `Review batch preflight failed with ${errors} error(s) and ${warnings} warning(s).`,
    );
  }
  console.log(
    `Review batch preflight passed with ${warnings} warning(s) requiring inspection.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
