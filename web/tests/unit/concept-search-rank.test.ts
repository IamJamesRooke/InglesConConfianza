import assert from "node:assert/strict";
import test from "node:test";

import {
  rankConceptSearchResults,
  type ConceptSearchCandidate,
} from "../../src/lib/lesson-builder/concept-search-rank";

function candidate(
  id: string,
  english: string,
  spanish: string,
  curriculumRole = "Unranked",
): ConceptSearchCandidate {
  return { id, english, spanish, curriculumRole };
}

test("exact match beats a prefix match on the same field", () => {
  const results = rankConceptSearchResults(
    [
      candidate("work-with", "to work with [somebody]", "trabajar con [alguien]"),
      candidate("with", "with", "con"),
    ],
    "with",
  );
  assert.equal(results[0].id, "with");
});

test("prefix match beats a word-boundary match", () => {
  const results = rankConceptSearchResults(
    [
      candidate("understand", "understand", "entender"),
      candidate("standard", "standard", "estándar"),
    ],
    "stand",
  );
  assert.equal(results[0].id, "standard");
});

test("word-boundary match beats a mid-word substring match", () => {
  const results = rankConceptSearchResults(
    [
      candidate("if-clause", "if", "si"),
      candidate("gift", "gift", "regalo"),
      candidate("as-if", "as if", "como si"),
    ],
    "if",
  );
  // exact ("if") first, then the word-boundary match ("as if"), then the
  // mid-word substring match ("gift") last.
  assert.deepEqual(
    results.map((r) => r.id),
    ["if-clause", "as-if", "gift"],
  );
});

test("ignores bracketed placeholders and accents", () => {
  const results = rankConceptSearchResults(
    [candidate("si-accent", "if", "sí")],
    "si",
  );
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "si-accent");
});

test("ties break by curriculum priority, then label length", () => {
  const results = rankConceptSearchResults(
    [
      candidate("longer-p5", "with regard to", "con respecto a", "P5"),
      candidate("shorter-p1", "with", "con", "P1"),
      candidate("shorter-p2", "with", "con", "P2"),
    ],
    "with",
  );
  assert.deepEqual(
    results.map((r) => r.id),
    ["shorter-p1", "shorter-p2", "longer-p5"],
  );
});

test("non-matching candidates are dropped", () => {
  const results = rankConceptSearchResults(
    [candidate("unrelated", "banana", "plátano")],
    "with",
  );
  assert.equal(results.length, 0);
});
