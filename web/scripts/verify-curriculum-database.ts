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
  assert.deepStrictEqual(actual.review, expected.review);

  const [collections, conceptLinks, candidateLinks] = await Promise.all([
    prisma.collection.count(),
    prisma.conceptCollection.count(),
    prisma.reviewCandidateCollection.count(),
  ]);

  assert.equal(expected.curriculum.concepts.length, 1_196);
  assert.equal(expected.review.batches.length, 9);
  assert.equal(
    expected.review.batches.flatMap((batch) => batch.candidates).length,
    291,
  );
  assert.equal(collections, 712);
  assert.equal(conceptLinks, 4_649);
  assert.equal(candidateLinks, 1_298);

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
