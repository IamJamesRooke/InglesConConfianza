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

  assert.equal(expected.curriculum.concepts.length, 1_872);
  assert.equal(expected.review.batches.length, 15);
  assert.equal(
    expected.review.batches.flatMap((batch) => batch.candidates).length,
    975,
  );
  assert.equal(collections, 884);
  assert.equal(conceptLinks, 6_187);
  assert.equal(candidateLinks, 2_857);

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
