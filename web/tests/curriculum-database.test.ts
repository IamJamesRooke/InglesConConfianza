import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import {
  exportCurriculumDatabase,
  loadSeedData,
  seedCurriculumDatabase,
} from "../scripts/curriculum-data";
import {
  collectionFacet,
  KNOWN_CONJUGATION_VALUES,
  KNOWN_GRAMMAR_VALUES,
  KNOWN_COGNATE_VALUES,
  KNOWN_SENSE_VALUES,
  KNOWN_GENDER_VALUES,
  KNOWN_DEGREE_VALUES,
  KNOWN_PARTICLE_VALUES,
  LEGACY_COLLECTIONS,
} from "../src/lib/curriculum/collections";
import { prisma } from "../src/lib/database/prisma";

// A facet with a controlled value list: every `facet:<value>` in the database
// must be registered, and every registered value must still be carried by some
// concept (so the set only grows or shrinks on purpose).
function assertKnownValues(
  collectionNames: Set<string>,
  facet: string,
  known: ReadonlySet<string>,
) {
  const prefix = `${facet}:`;
  const unknown = [...collectionNames]
    .filter((name) => name.startsWith(prefix))
    .map((name) => name.slice(prefix.length))
    .filter((value) => !known.has(value))
    .sort();
  assert.deepStrictEqual(
    unknown,
    [],
    `Unregistered ${facet}: values — add to the controlled set or fix the tag.`,
  );
  const stale = [...known].filter((value) => !collectionNames.has(`${prefix}${value}`));
  assert.deepStrictEqual(
    stale,
    [],
    `The ${facet}: controlled set has entries no concept carries — remove them.`,
  );
}

test("the imported curriculum is exact and protected", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const expected = await loadSeedData();
  const actual = await exportCurriculumDatabase(prisma);
  assert.deepStrictEqual(actual, expected);

  // Every collection is either a known facet:value tag or a shrinking legacy
  // bare name. New bare collections are rejected; the legacy set never grows.
  const collectionNames = new Set(
    actual.curriculum.concepts.flatMap((concept) => concept.collections),
  );
  const unregistered = [...collectionNames].filter(
    (name) => collectionFacet(name) === null && !LEGACY_COLLECTIONS.has(name),
  );
  assert.deepStrictEqual(
    unregistered,
    [],
    "Every collection must be a facet:value tag or a registered legacy name.",
  );
  const staleLegacy = [...LEGACY_COLLECTIONS].filter(
    (name) => !collectionNames.has(name),
  );
  assert.deepStrictEqual(
    staleLegacy,
    [],
    "LEGACY_COLLECTIONS may only shrink; remove names no concept still carries.",
  );
  assert.ok(
    LEGACY_COLLECTIONS.size <= 292,
    `Legacy bare collections must not grow past 292 (found ${LEGACY_COLLECTIONS.size}).`,
  );

  assertKnownValues(collectionNames, "grammar", KNOWN_GRAMMAR_VALUES);
  assertKnownValues(collectionNames, "conjugation", KNOWN_CONJUGATION_VALUES);
  assertKnownValues(collectionNames, "sense", KNOWN_SENSE_VALUES);
  assertKnownValues(collectionNames, "cognate", KNOWN_COGNATE_VALUES);
  assertKnownValues(collectionNames, "gender", KNOWN_GENDER_VALUES);
  assertKnownValues(collectionNames, "degree", KNOWN_DEGREE_VALUES);
  assertKnownValues(collectionNames, "particle", KNOWN_PARTICLE_VALUES);

  // The es: / en: lemma facets make the catalog queryable as a bilingual
  // dictionary: every sense of a headword under one tag.
  const ganarEnglish = new Set(
    actual.curriculum.concepts
      .filter((concept) => concept.collections.includes("es:ganar"))
      .map((concept) => concept.english),
  );
  for (const target of [
    "to win [a competition]",
    "to earn [money]",
    "to gain [support or an advantage]",
    "to beat [somebody]",
  ]) {
    assert.ok(ganarEnglish.has(target), `es:ganar should reach "${target}"`);
  }
  assert.ok(
    actual.curriculum.concepts
      .filter((concept) => concept.collections.includes("en:know"))
      .some((concept) => concept.spanish.startsWith("conocer")) &&
      actual.curriculum.concepts
        .filter((concept) => concept.collections.includes("en:know"))
        .some((concept) => concept.spanish.startsWith("saber")),
    "en:know must gather both conocer and saber senses.",
  );

  // Immutable source-provenance archive — unchanged by curriculum curation.
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
      const dispositions = entry.tags.filter((tag) =>
        tag.startsWith("disposition:"),
      );
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
      const dispositions = entry.tags.filter((tag) =>
        tag.startsWith("disposition:"),
      );
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
      const dispositions = entry.tags.filter((tag) =>
        tag.startsWith("disposition:"),
      );
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
      const dispositions = entry.tags.filter((tag) =>
        tag.startsWith("disposition:"),
      );
      assert.equal(dispositions.length, 1);
      counts[dispositions[0]] = (counts[dispositions[0]] ?? 0) + 1;
      return counts;
    }, {}),
    {
      "disposition: canonical candidate": 478,
      "disposition: historical evidence": 599,
    },
  );

  // Structural guards.
  await assert.rejects(
    seedCurriculumDatabase(prisma, expected.curriculum, expected.sources),
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
