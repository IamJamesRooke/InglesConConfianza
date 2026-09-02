import "dotenv/config";

import assert from "node:assert/strict";

import {
  exportCurriculumDatabase,
  loadSeedData,
} from "./curriculum-data";
import { prisma } from "../src/lib/database/prisma";

async function main() {
  const expected = await loadSeedData();
  const actual = await exportCurriculumDatabase(prisma);

  assert.deepStrictEqual(actual.curriculum, expected.curriculum);
  assert.deepStrictEqual(actual.sources, expected.sources);

  const [collections, conceptLinks] = await Promise.all([
    prisma.collection.count(),
    prisma.conceptCollection.count(),
  ]);

  const expectedCollectionNames = new Set(
    expected.curriculum.concepts.flatMap((concept) => concept.collections),
  );
  assert.equal(
    collections,
    expectedCollectionNames.size,
    "Collection count differs from the snapshots.",
  );

  assert.equal(
    await prisma.mappingSourceDocument.count(),
    expected.sources.documents.length,
    "Mapping source document count differs from the snapshot.",
  );
  assert.equal(
    await prisma.mappingSourceEntry.count(),
    expected.sources.entries.length,
    "Mapping source entry count differs from the snapshot.",
  );
  assert.equal(
    conceptLinks,
    expected.curriculum.concepts.reduce(
      (total, concept) => total + concept.collections.length,
      0,
    ),
    "Concept-collection link count differs from the snapshot.",
  );

  console.log(
    "Curriculum database exactly matches the immutable seed snapshots.",
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
