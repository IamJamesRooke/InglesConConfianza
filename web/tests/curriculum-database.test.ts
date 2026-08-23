import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import {
  exportCurriculumDatabase,
  loadSeedData,
  seedCurriculumDatabase,
} from "../scripts/curriculum-data";
import { prisma } from "../src/lib/database/prisma";

test("the imported curriculum is exact and protected", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const expected = await loadSeedData();
  const actual = await exportCurriculumDatabase(prisma);
  assert.deepStrictEqual(actual, expected);

  await assert.rejects(
    seedCurriculumDatabase(
      prisma,
      expected.curriculum,
      expected.review,
      expected.sources,
      expected.cognates,
    ),
    /refuses to overwrite existing data/,
  );

  const firstConcept = await prisma.curriculumConcept.findFirstOrThrow({
    orderBy: { sortOrder: "asc" },
  });
  await assert.rejects(
    prisma.$transaction(async (transaction) => {
      await transaction.curriculumConcept.update({
        where: { id: firstConcept.id },
        data: {
          curriculumRole:
            firstConcept.curriculumRole === "core" ? "reference" : "core",
        },
      });
      throw new Error("intentional rollback");
    }),
    /intentional rollback/,
  );
  const afterRollback = await prisma.curriculumConcept.findUniqueOrThrow({
    where: { id: firstConcept.id },
  });
  assert.equal(afterRollback.curriculumRole, firstConcept.curriculumRole);

  await assert.rejects(
    prisma.curriculumConcept.create({
      data: {
        id: "postgres-empty-field-constraint-test",
        spanish: "",
        english: "temporary test",
        exampleSpanish: "Prueba temporal.",
        exampleEnglish: "Temporary test.",
        curriculumRole: "reference",
        sortOrder: -1,
      },
    }),
  );
});
