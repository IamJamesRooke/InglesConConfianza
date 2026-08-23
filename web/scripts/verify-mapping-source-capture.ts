import "dotenv/config";

import assert from "node:assert/strict";

import { exportCurriculumDatabase } from "./curriculum-data";
import { buildMappingSourceArchive } from "./mapping-source-capture";
import { prisma } from "../src/lib/database/prisma";

async function main() {
  const [expected, exported] = await Promise.all([
    buildMappingSourceArchive(),
    exportCurriculumDatabase(prisma),
  ]);

  assert.deepStrictEqual(
    exported.sources,
    expected,
    "PostgreSQL mapping source archive differs from the live source tree.",
  );

  const bytes = expected.documents.reduce(
    (total, document) => total + document.byteLength,
    0,
  );
  console.log(
    `Mapping source capture exactly matches all ${expected.documents.length} files (${bytes} bytes) and ${expected.entries.length} extracted table rows.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
