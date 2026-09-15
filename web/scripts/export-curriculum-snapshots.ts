import "dotenv/config";

import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { PrismaClient } from "../src/generated/prisma/client";
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

// The reusable half of this script: export the database and, when `apply` is
// true, write both seed-data snapshots atomically. Callers other than main()
// (the inline "set level" server action, for one) import this instead of
// shelling out to the script.
export async function writeCurriculumSnapshots(
  client: PrismaClient,
  { apply }: { apply: boolean },
) {
  const exported = await exportCurriculumDatabase(client);
  const conceptCount = exported.curriculum.concepts.length;
  const sourceDocumentCount = exported.sources.documents.length;
  const sourceEntryCount = exported.sources.entries.length;

  if (apply) {
    await writeJsonAtomically(
      path.join(seedDataDirectory, "curriculum.json"),
      exported.curriculum,
    );
    await writeJsonAtomically(
      path.join(seedDataDirectory, "curriculum-sources.json"),
      exported.sources,
    );
  }

  return { conceptCount, sourceDocumentCount, sourceEntryCount };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const { conceptCount, sourceDocumentCount, sourceEntryCount } =
    await writeCurriculumSnapshots(prisma, { apply });

  console.log(
    apply
      ? `Exported ${conceptCount} concepts, ${sourceDocumentCount} source documents, and ${sourceEntryCount} source entries.`
      : `Dry run: would export ${conceptCount} concepts, ${sourceDocumentCount} source documents, and ${sourceEntryCount} source entries. Re-run with --apply to write snapshots.`,
  );
}

// Only run main() (and disconnect the shared prisma client) when this file is
// executed directly, e.g. `tsx scripts/export-curriculum-snapshots.ts` — not
// when writeCurriculumSnapshots is imported into a long-lived process such as
// the Next.js server.
const isMainModule =
  process.argv[1] !== undefined &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
