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
  const sourceDocumentCount = exported.sources.documents.length;
  const sourceEntryCount = exported.sources.entries.length;

  if (!apply) {
    console.log(
      `Dry run: would export ${conceptCount} concepts, ${sourceDocumentCount} source documents, and ${sourceEntryCount} source entries. Re-run with --apply to write snapshots.`,
    );
    return;
  }

  await writeJsonAtomically(
    path.join(seedDataDirectory, "curriculum.json"),
    exported.curriculum,
  );
  await writeJsonAtomically(
    path.join(seedDataDirectory, "curriculum-sources.json"),
    exported.sources,
  );
  console.log(
    `Exported ${conceptCount} concepts, ${sourceDocumentCount} source documents, and ${sourceEntryCount} source entries.`,
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
