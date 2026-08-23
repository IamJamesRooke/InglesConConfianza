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

  const cognates = actual.curriculum.concepts.filter((concept) =>
    concept.collections.includes("cognate"),
  );
  const partOfSpeechCollections = new Set([
    "adjective",
    "adverb",
    "expression",
    "noun",
    "participle-or-progressive",
    "verb",
  ]);
  assert.deepStrictEqual(
    cognates.filter(
      (concept) =>
        !concept.collections.some((collection) =>
          partOfSpeechCollections.has(collection),
        ),
    ),
    [],
    "Every cognate concept must have a part-of-speech collection.",
  );
  assert.deepStrictEqual(
    cognates.filter(
      (concept) =>
        concept.collections.includes("noun") &&
        !/^(?:el|la|los|las|lo|el\/la|la\/el) /iu.test(concept.spanish),
    ),
    [],
    "Cognate nouns must include their natural Spanish article.",
  );
  assert.deepStrictEqual(
    cognates.filter(
      (concept) =>
        concept.collections.includes("adjective") &&
        concept.id !== "valer-ser-valido" &&
        !/^(?:ser|estar|tener) /iu.test(concept.spanish),
    ),
    [],
    "Cognate adjectives must use a natural Spanish support verb.",
  );
  assert.equal(
    cognates.some(
      (concept) =>
        concept.spanish === "el territorio" && concept.english === "territory",
    ),
    true,
  );
  assert.equal(
    actual.curriculum.concepts.some(
      (concept) =>
        concept.collections.includes("noun or adjective") ||
        concept.collections.includes("noun-or-adjective"),
    ),
    false,
  );
  assert.equal(
    cognates.some(
      (concept) =>
        concept.id.startsWith("cognate-") &&
        (concept.spanish.includes(",") || concept.english.includes(",")),
    ),
    false,
    "Imported cognate mappings must have one Spanish and one English target.",
  );

  await assert.rejects(
    seedCurriculumDatabase(
      prisma,
      expected.curriculum,
      expected.review,
      expected.sources,
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
