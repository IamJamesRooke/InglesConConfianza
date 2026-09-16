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
  example?: { spanish: string; english: string },
): ConceptSearchCandidate {
  return {
    id,
    english,
    spanish,
    curriculumRole,
    exampleSpanish: example?.spanish,
    exampleEnglish: example?.english,
  };
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

test("a conjugated query finds an infinitive concept via its example, ranked below a label match", () => {
  const results = rankConceptSearchResults(
    [
      candidate(
        "estar-lugar",
        "to be [in a place]",
        "estar [en un lugar]",
        "Unranked",
        { spanish: "Estoy en casa.", english: "I am at home." },
      ),
      candidate("estoy-label", "I am [somewhere]", "estoy [en un lugar]"),
    ],
    "estoy",
  );
  assert.deepEqual(
    results.map((r) => r.id),
    ["estoy-label", "estar-lugar"],
  );
  assert.equal(results[0].matchedVia, "label");
  assert.equal(results[1].matchedVia, "example");
  assert.equal(results[1].matchedExample, "Estoy en casa.");
});

test("a P1 example-match ranks above an Unranked example-match", () => {
  const results = rankConceptSearchResults(
    [
      candidate("unranked-example", "to be tired", "estar cansado", "Unranked", {
        spanish: "Estoy cansado.",
        english: "I am tired.",
      }),
      candidate("p1-example", "to be at home", "estar en casa", "P1", {
        spanish: "Estoy en casa.",
        english: "I am home.",
      }),
    ],
    "estoy",
  );
  assert.deepEqual(
    results.map((r) => r.id),
    ["p1-example", "unranked-example"],
  );
  assert.ok(results.every((r) => r.matchedVia === "example"));
});

test("an example matches only at a word start — 'melo' never surfaces 'gemelos'", () => {
  const rows = [
    {
      id: "twins",
      spanish: "distinguir a [alguien] de [alguien]",
      english: "to tell [somebody] apart",
      curriculumRole: "Unranked",
      exampleSpanish: "No puedo distinguir a los gemelos.",
      exampleEnglish: "I can't tell the twins apart.",
    },
    {
      id: "melo",
      spanish: "decir [algo]",
      english: "to say [something]",
      curriculumRole: "Unranked",
      exampleSpanish: "Me lo dijo ayer.",
      exampleEnglish: "He told it to me yesterday.",
    },
  ];
  const ids = rankConceptSearchResults(rows, "melo").map((r) => r.id);
  assert.deepEqual(ids, []);
  const wordStart = rankConceptSearchResults(rows, "me lo").map((r) => r.id);
  assert.deepEqual(wordStart, ["melo"]);
});
