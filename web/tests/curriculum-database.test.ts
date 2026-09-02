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
        concept.id !== "16pwsfcg7n" &&
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
  assert.equal(vocabulary.length, 581);
  assert.deepStrictEqual(
    vocabulary.reduce<Record<string, number>>((counts, concept) => {
      counts[concept.curriculumRole] = (counts[concept.curriculumRole] ?? 0) + 1;
      return counts;
    }, {}),
    { core: 4, supporting: 19, reference: 558 },
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

  const transformations = actual.curriculum.concepts.filter((concept) =>
    concept.collections.includes("transformation"),
  );
  assert.equal(transformations.length, 802);
  assert.deepStrictEqual(
    transformations.reduce<Record<string, number>>((counts, concept) => {
      counts[concept.curriculumRole] = (counts[concept.curriculumRole] ?? 0) + 1;
      return counts;
    }, {}),
    { core: 13, supporting: 310, reference: 479 },
  );

  const transformationRelationships = transformations.filter((concept) =>
    concept.collections.includes("transformation relationship"),
  );
  const pastFormTransformations = transformations.filter((concept) =>
    concept.collections.includes("verb form transformation"),
  );
  const recognitionMappings = transformations.filter(
    (concept) =>
      !concept.collections.includes("transformation relationship") &&
      !concept.collections.includes("verb form transformation"),
  );
  assert.equal(transformationRelationships.length, 281);
  assert.equal(pastFormTransformations.length, 476);
  assert.equal(recognitionMappings.length, 45);
  assert.deepStrictEqual(
    transformationRelationships.filter(
      (concept) =>
        concept.spanish.split(" ==> ").length !== 2 ||
        concept.english.split(" ==> ").length !== 2 ||
        concept.collections.filter((collection) =>
          /^transformation: .+ => .+$/u.test(collection),
        ).length !== 1 ||
        concept.collections.filter((collection) =>
          collection.startsWith("word family: "),
        ).length !== 1,
    ),
    [],
    "Transformation relationships must remain atomic, normalized, and queryable by type and word family.",
  );
  assert.deepStrictEqual(
    recognitionMappings.filter(
      (concept) => concept.spanish.includes("==>") || concept.english.includes("==>"),
    ),
    [],
    "Recognition-only words remain ordinary Spanish-to-English mappings.",
  );

  const powerTransformation = transformationRelationships.find(
    (concept) =>
      concept.spanish === "el poder ==> ser poderoso/a" &&
      concept.english === "the power ==> to be powerful",
  );
  assert.ok(powerTransformation);
  assert.equal(powerTransformation.curriculumRole, "supporting");
  assert.equal(
    [
      "transformation: -ful",
      "transformation: noun => adjective",
      "word family: power",
      "suffix: -ful",
    ].every((collection) => powerTransformation.collections.includes(collection)),
    true,
  );
  assert.equal(
    transformationRelationships.some(
      (concept) =>
        concept.spanish === "ser rojo/a ==> ser rojizo/a" &&
        concept.english === "to be red ==> to be reddish" &&
        concept.collections.includes("word family: red"),
    ),
    true,
  );

  const also = transformations.find(
    (concept) => concept.spanish === "también" && concept.english === "also",
  );
  const because = transformations.find(
    (concept) => concept.spanish === "porque" && concept.english === "because",
  );
  assert.ok(also);
  assert.ok(because);
  assert.equal(also.collections.includes("prefix: al-"), true);
  assert.equal(because.collections.includes("prefix: be-"), true);
  assert.equal(
    transformations.some(
      (concept) =>
        concept.english === "to look forward to [something]" &&
        ["look", "forward", "to"].every((collection) =>
          concept.collections.includes(collection),
        ),
    ),
    true,
  );

  const transformationDocuments = actual.sources.documents.filter(
    (document) => document.pillar === "transformations",
  );
  const transformationEntries = actual.sources.entries.filter((entry) =>
    entry.documentPath.startsWith("docs/curriculum/transformations/"),
  );
  assert.equal(transformationDocuments.length, 178);
  assert.equal(
    transformationDocuments.reduce(
      (total, document) => total + document.byteLength,
      0,
    ),
    101_277,
  );
  assert.equal(transformationEntries.length, 594);
  assert.deepStrictEqual(
    transformationEntries.reduce<Record<string, number>>((counts, entry) => {
      const dispositions = entry.tags.filter((tag) => tag.startsWith("disposition:"));
      assert.equal(dispositions.length, 1);
      counts[dispositions[0]] = (counts[dispositions[0]] ?? 0) + 1;
      return counts;
    }, {}),
    {
      "disposition: canonical candidate": 216,
      "disposition: example evidence": 302,
      "disposition: reference pattern": 7,
      "disposition: index": 69,
    },
  );

  const structure = actual.curriculum.concepts.filter((concept) =>
    concept.collections.includes("structure"),
  );
  assert.equal(structure.length, 405);
  assert.deepStrictEqual(
    structure.reduce<Record<string, number>>((counts, concept) => {
      counts[concept.curriculumRole] = (counts[concept.curriculumRole] ?? 0) + 1;
      return counts;
    }, {}),
    { core: 75, supporting: 128, reference: 202 },
  );
  assert.equal(
    structure.filter((concept) => concept.collections.includes("comparative")).length,
    16,
  );
  assert.equal(
    structure.filter((concept) => concept.collections.includes("superlative")).length,
    16,
  );
  assert.deepStrictEqual(
    structure.filter(
      (concept) =>
        (concept.collections.includes("comparative") ||
          concept.collections.includes("superlative")) &&
        (!concept.collections.includes("transformation") ||
          !concept.collections.includes("transformation relationship") ||
          concept.spanish.split(" ==> ").length !== 2 ||
          concept.english.split(" ==> ").length !== 2),
    ),
    [],
    "Comparative and superlative concepts must remain explicit transformation relationships.",
  );
  assert.equal(
    structure.some(
      (concept) =>
        concept.spanish === "o / u" ||
        concept.spanish === "comparison que" ||
        concept.spanish === "suficiente / suficientes",
    ),
    false,
  );

  const structureDocuments = actual.sources.documents.filter(
    (document) => document.pillar === "structure",
  );
  const structureDocumentPaths = new Set(
    structureDocuments.map((document) => document.path),
  );
  const structureEntries = actual.sources.entries.filter((entry) =>
    structureDocumentPaths.has(entry.documentPath),
  );
  assert.equal(structureDocuments.length, 73);
  assert.equal(
    structureDocuments.reduce((total, document) => total + document.byteLength, 0),
    56_558,
  );
  assert.equal(structureEntries.length, 332);
  assert.deepStrictEqual(
    structureEntries.reduce<Record<string, number>>((counts, entry) => {
      const dispositions = entry.tags.filter((tag) => tag.startsWith("disposition:"));
      assert.equal(dispositions.length, 1);
      counts[dispositions[0]] = (counts[dispositions[0]] ?? 0) + 1;
      return counts;
    }, {}),
    {
      "disposition: canonical candidate": 21,
      "disposition: bilingual evidence": 233,
      "disposition: reference pattern": 77,
      "disposition: source warning": 1,
    },
  );

  const pastForms = actual.curriculum.concepts.filter((concept) =>
    concept.collections.includes("past and past participle"),
  );
  assert.equal(pastForms.length, 476);
  assert.deepStrictEqual(
    pastForms.reduce<Record<string, number>>((counts, concept) => {
      counts[concept.curriculumRole] = (counts[concept.curriculumRole] ?? 0) + 1;
      return counts;
    }, {}),
    { core: 12, supporting: 286, reference: 178 },
  );
  assert.equal(
    pastForms.filter((concept) => concept.collections.includes("past")).length,
    234,
  );
  assert.equal(
    pastForms.filter((concept) => concept.collections.includes("past participle"))
      .length,
    242,
  );
  assert.equal(
    new Set(
      pastForms.flatMap((concept) =>
        concept.collections.filter((collection) =>
          collection.startsWith("word family: "),
        ),
      ),
    ).size,
    190,
  );
  assert.deepStrictEqual(
    pastForms.filter((concept) => {
      const statuses = concept.collections.filter((collection) =>
        collection.startsWith("sound metadata "),
      );
      const formTypes = ["past", "past participle"].filter((collection) =>
        concept.collections.includes(collection),
      );
      return (
        statuses.length !== 1 ||
        formTypes.length !== 1 ||
        !concept.collections.includes("transformation") ||
        !concept.collections.includes("verb form transformation") ||
        concept.english.includes(" / ")
      );
    }),
    [],
    "Every past-form concept must be atomic and have one form type and sound-review status.",
  );
  const pendingSound = pastForms.filter((concept) =>
    concept.collections.includes("sound metadata pending review"),
  );
  const reviewedSound = pastForms.filter((concept) =>
    concept.collections.includes("sound metadata reviewed"),
  );
  assert.equal(pendingSound.length, 335);
  assert.equal(reviewedSound.length, 141);
  assert.deepStrictEqual(
    pendingSound.filter((concept) =>
      concept.collections.some(
        (collection) =>
          collection.includes("🔊") ||
          collection.startsWith("past - ") ||
          collection.startsWith("past participle - "),
      ),
    ),
    [],
    "Pending pronunciation rows must not claim a finished sound family.",
  );
  assert.equal(
    pastForms.some(
      (concept) =>
        concept.spanish === "pasado de can" &&
        concept.english === "could" &&
        concept.collections.includes("defective verb") &&
        concept.collections.includes("no past participle"),
    ),
    true,
  );

  const pastFormDocuments = actual.sources.documents.filter(
    (document) => document.pillar === "past-and-past-participle",
  );
  const pastFormDocumentPaths = new Set(
    pastFormDocuments.map((document) => document.path),
  );
  const pastFormEntries = actual.sources.entries.filter((entry) =>
    pastFormDocumentPaths.has(entry.documentPath),
  );
  assert.equal(pastFormDocuments.length, 134);
  assert.equal(
    pastFormDocuments.reduce((total, document) => total + document.byteLength, 0),
    359_868,
  );
  assert.equal(pastFormEntries.length, 1_077);
  assert.deepStrictEqual(
    pastFormEntries.reduce<Record<string, number>>((counts, entry) => {
      const dispositions = entry.tags.filter((tag) => tag.startsWith("disposition:"));
      assert.equal(dispositions.length, 1);
      counts[dispositions[0]] = (counts[dispositions[0]] ?? 0) + 1;
      return counts;
    }, {}),
    {
      "disposition: canonical candidate": 478,
      "disposition: historical evidence": 599,
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
