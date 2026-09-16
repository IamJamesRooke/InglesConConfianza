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

test("among example-only matches, a shared Spanish head-word prefix outranks unrelated example hits", () => {
  const results = rankConceptSearchResults(
    [
      candidate("tan", "so", "tan", "Unranked", {
        spanish: "Estoy tan cansado.",
        english: "I am so tired.",
      }),
      candidate("ahora", "now", "ahora", "Unranked", {
        spanish: "Estoy ahora mismo ocupado.",
        english: "I am busy right now.",
      }),
      candidate("estar-ocupado", "[to be] busy", "[estar] ocupado", "Unranked", {
        spanish: "Estoy ocupado.",
        english: "I am busy.",
      }),
      candidate(
        "estar-lugar",
        "to be [in a place]",
        "estar [en un lugar]",
        "Unranked",
        { spanish: "Estoy en casa.", english: "I am at home." },
      ),
      candidate(
        "estar-gerundio",
        "to be [doing something]",
        "estar [haciendo algo]",
        "Unranked",
        { spanish: "Estoy trabajando.", english: "I am working." },
      ),
      candidate("estoy-label", "I am [somewhere]", "estoy [en un lugar]"),
    ],
    "estoy",
  );
  assert.deepEqual(
    results.map((r) => r.id),
    ["estoy-label", "estar-lugar", "estar-gerundio", "tan", "ahora", "estar-ocupado"],
  );
});

test("'tengo' ranks 'tener [algo]' above an unrelated example match", () => {
  const results = rankConceptSearchResults(
    [
      candidate("tan", "so", "tan", "Unranked", {
        spanish: "Tengo tan poco tiempo.",
        english: "I have so little time.",
      }),
      candidate("tener-algo", "to have [something]", "tener [algo]", "Unranked", {
        spanish: "Tengo un perro.",
        english: "I have a dog.",
      }),
    ],
    "tengo",
  );
  assert.deepEqual(
    results.map((r) => r.id),
    ["tener-algo", "tan"],
  );
});

test("a query shorter than 3 letters never triggers the head-word bonus", () => {
  const results = rankConceptSearchResults(
    [
      // Spanish head word "quedarse" would share a 2-letter prefix with the
      // query, but the rule requires 3 — and never fires below a 3-letter
      // query anyway.
      candidate("quedarse-casa", "to stay [at home]", "quedarse en casa", "P5", {
        spanish: "Es en casa.",
        english: "It's at home.",
      }),
      candidate("otro", "other", "otro", "P1", {
        spanish: "Es otro día.",
        english: "It's another day.",
      }),
    ],
    "es",
  );
  // Without the head-word bonus, priority alone decides the tie: P1 first.
  assert.deepEqual(
    results.map((r) => r.id),
    ["otro", "quedarse-casa"],
  );
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
