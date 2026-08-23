import assert from "node:assert/strict";
import test from "node:test";

import type { ReviewBatch } from "../src/lib/curriculum/review-types";
import {
  analyzeReviewBatch,
  normalizeMappingText,
} from "../scripts/review-batch-preflight";

function batch(overrides: Partial<ReviewBatch> = {}): ReviewBatch {
  return {
    id: "test-batch",
    title: "Test batch",
    sourcePaths: ["docs/source.md"],
    createdAt: "2026-08-23",
    status: "open",
    candidates: [
      {
        id: "comer-algo-to-eat-something",
        action: "add",
        suggestedCurriculumRole: "reference",
        spanish: "comer [algo]",
        english: "to eat [something]",
        example: {
          spanish: "Quiero comer algo.",
          english: "I want to eat something.",
        },
        collections: ["comer", "eat"],
        curriculumRole: "reference",
        sourcePaths: ["docs/source.md"],
        rationale: "Reusable lexical mapping.",
        approved: false,
        ownerNote: "",
      },
    ],
    ...overrides,
  };
}

const sourcePathExists = async () => true;

test("normalizes spacing, case, and typographic punctuation", () => {
  assert.equal(normalizeMappingText("  TO  Eat [Something]  "), "to eat [something]");
  assert.equal(normalizeMappingText("I’m READY"), "i'm ready");
});

test("blocks a normalized duplicate addition", async () => {
  const issues = await analyzeReviewBatch(batch(), {
    existingConcepts: [
      {
        id: "existing-eat",
        spanish: "COMER  [ALGO]",
        english: "To Eat [Something]",
        exampleSpanish: "Como pan.",
        exampleEnglish: "I eat bread.",
        curriculumRole: "reference",
        collections: [{ collectionName: "comer" }],
      },
    ],
    existingBatchIds: new Set(),
    sourcePathExists,
  });

  assert.ok(
    issues.some(
      (issue) =>
        issue.severity === "error" && issue.code === "duplicate-existing-edge",
    ),
  );
});

test("warns about sentence-shaped concepts and probable slot duplicates", async () => {
  const value = batch({
    candidates: [
      batch().candidates[0],
      {
        ...batch().candidates[0],
        id: "sentence-candidate",
        spanish: "Quiero comer algo.",
        english: "I want to eat something.",
      },
      {
        ...batch().candidates[0],
        id: "slot-duplicate",
        spanish: "comer [la comida]",
        english: "to eat [food]",
      },
    ],
  });
  const issues = await analyzeReviewBatch(value, {
    existingConcepts: [],
    existingBatchIds: new Set(),
    sourcePathExists,
  });

  assert.ok(issues.some((issue) => issue.code === "sentence-shaped-concept"));
  assert.ok(issues.some((issue) => issue.code === "probable-batch-duplicate"));
});

test("requires collections and provenance", async () => {
  const candidate = {
    ...batch().candidates[0],
    collections: [],
    sourcePaths: [],
  };
  const issues = await analyzeReviewBatch(batch({ candidates: [candidate] }), {
    existingConcepts: [],
    existingBatchIds: new Set(),
    sourcePathExists,
  });

  assert.ok(issues.some((issue) => issue.code === "missing-collections"));
  assert.ok(issues.some((issue) => issue.code === "missing-provenance"));
});

test("blocks source paths that cannot be verified", async () => {
  const issues = await analyzeReviewBatch(batch(), {
    existingConcepts: [],
    existingBatchIds: new Set(),
    sourcePathExists: async () => false,
  });

  assert.ok(
    issues.some(
      (issue) =>
        issue.severity === "error" && issue.code === "missing-source-path",
    ),
  );
});
