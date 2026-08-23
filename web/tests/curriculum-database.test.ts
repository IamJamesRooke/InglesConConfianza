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
    "connector",
    "expression",
    "function word",
    "location expression",
    "noun",
    "number",
    "participle-or-progressive",
    "quantifier",
    "time expression",
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

  const vocabulary = actual.curriculum.concepts.filter((concept) =>
    concept.collections.includes("vocabulary"),
  );
  assert.equal(vocabulary.length, 592);
  assert.deepStrictEqual(
    vocabulary.reduce<Record<string, number>>((counts, concept) => {
      counts[concept.curriculumRole] = (counts[concept.curriculumRole] ?? 0) + 1;
      return counts;
    }, {}),
    { core: 2, supporting: 18, reference: 572 },
  );
  assert.deepStrictEqual(
    vocabulary.filter(
      (concept) =>
        concept.collections.filter((collection) =>
          partOfSpeechCollections.has(collection),
        ).length !== 1,
    ),
    [],
    "Every vocabulary concept must have exactly one grammatical type.",
  );
  assert.deepStrictEqual(
    vocabulary.filter((concept) => concept.english.includes(" / ")),
    [],
    "Vocabulary targets must remain atomic.",
  );
  assert.deepStrictEqual(
    vocabulary.filter(
      (concept) =>
        concept.collections.includes("noun") &&
        !concept.collections.includes("days of the week") &&
        !concept.collections.includes("months of the year") &&
        !["español", "inglés"].includes(concept.spanish) &&
        !/^(?:el|la|los|las|lo|el\/la|la\/el|un|una|unos|unas) /iu.test(
          concept.spanish,
        ),
    ),
    [],
    "Vocabulary nouns must use an article except intentional calendar and language names.",
  );
  assert.deepStrictEqual(
    vocabulary.filter(
      (concept) =>
        concept.collections.includes("adjective") &&
        !/^(?:ser|estar|tener|el\/la siguiente) /iu.test(concept.spanish),
    ),
    [],
    "Vocabulary adjectives must use a natural Spanish support verb.",
  );

  const monday = vocabulary.find(
    (concept) => concept.spanish === "lunes" && concept.english === "Monday",
  );
  assert.ok(monday);
  assert.equal(
    ["days of the week", "date", "time", "calendar", "noun"].every((tag) =>
      monday.collections.includes(tag),
    ),
    true,
  );
  const spanishTrillion = vocabulary.find(
    (concept) => concept.spanish === "un billón" && concept.english === "one trillion",
  );
  assert.ok(spanishTrillion);
  assert.equal(spanishTrillion.collections.includes("false cognate"), true);

  const particles = new Set([
    "about", "across", "after", "along", "around", "away", "back", "by", "down",
    "for", "forward", "in", "into", "off", "on", "out", "over", "through", "to",
    "together", "up", "upon", "with",
  ]);
  for (const concept of vocabulary.filter((item) =>
    item.collections.includes("phrasal verb"),
  )) {
    const words = concept.english.replace(/^to\s+/iu, "").split(/\s+/u);
    assert.equal(concept.collections.includes(words[0]), true);
    for (const particle of words.filter((word) => particles.has(word))) {
      assert.equal(concept.collections.includes(particle), true);
    }
  }

  const vocabularyDocuments = actual.sources.documents.filter(
    (document) => document.pillar === "vocabulary",
  );
  const vocabularyEntries = actual.sources.entries.filter((entry) =>
    entry.documentPath.startsWith("docs/curriculum/vocabulary/"),
  );
  assert.equal(vocabularyDocuments.length, 17);
  assert.equal(
    vocabularyDocuments.reduce((total, document) => total + document.byteLength, 0),
    127_594,
  );
  assert.equal(vocabularyEntries.length, 972);
  assert.deepStrictEqual(
    vocabularyEntries.reduce<Record<string, number>>((counts, entry) => {
      const dispositions = entry.tags.filter((tag) => tag.startsWith("disposition:"));
      assert.equal(dispositions.length, 1);
      counts[dispositions[0]] = (counts[dispositions[0]] ?? 0) + 1;
      return counts;
    }, {}),
    {
      "disposition: index": 102,
      "disposition: canonical candidate": 224,
      "disposition: example evidence": 572,
      "disposition: reference pattern": 67,
      "disposition: memory aid": 7,
    },
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
