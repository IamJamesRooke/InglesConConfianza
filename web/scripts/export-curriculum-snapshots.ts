import "dotenv/config";

import { rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  exportCurriculumDatabase,
  seedDataDirectory,
} from "./curriculum-data";
import { prisma } from "../src/lib/database/prisma";

async function writeJsonAtomically(filePath: string, value: unknown) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const exported = await exportCurriculumDatabase(prisma);
  const conceptCount = exported.curriculum.concepts.length;
  const batchCount = exported.review.batches.length;
  const candidateCount = exported.review.batches.flatMap(
    (batch) => batch.candidates,
  ).length;

  if (!apply) {
    console.log(
      `Dry run: would export ${conceptCount} concepts, ${batchCount} review batches, and ${candidateCount} review candidates. Re-run with --apply to write snapshots.`,
    );
    return;
  }

  await writeJsonAtomically(
    path.join(seedDataDirectory, "curriculum.json"),
    exported.curriculum,
  );
  await writeJsonAtomically(
    path.join(seedDataDirectory, "curriculum-review.json"),
    exported.review,
  );
  console.log(
    `Exported ${conceptCount} concepts, ${batchCount} review batches, and ${candidateCount} review candidates.`,
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
