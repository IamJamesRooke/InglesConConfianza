import assert from "node:assert/strict";
import test from "node:test";

import {
  SYLLABUS_GROUPS,
  groupSyllabusItems,
  syllabusGroupLabel,
  syllabusGroupOf,
} from "../../src/lib/lesson-builder/syllabus-groups";
import {
  buildCourseTimeline,
  moduleBrief,
  reorderMainItems,
} from "../../src/lib/lesson-builder/syllabus";
import type {
  ConceptDisplayLookup,
  LessonConcept,
  LessonModule,
} from "../../src/lib/lesson-builder/types";

type Item = { id: string; collections?: string[] };

function item(id: string, collections?: string[]): Item {
  return { id, collections };
}

const collectionsOf = (entry: Item) => entry.collections;

test("group order is fixed and ends in Untagged", () => {
  assert.deepEqual(
    SYLLABUS_GROUPS.map((group) => group.label),
    [
      "People",
      "Verbs",
      "Sentence patterns",
      "Connectors",
      "Prepositions and phrases",
      "Time and place",
      "Things and describing words",
      "Untagged",
    ],
  );
});

// The ten rows the owner flagged (2026-09-16 regrouping): each must land in
// the group the fixed precedence rules assign it, not wherever a naive
// "first pos:* wins" reading would put it.
test("syllabusGroupOf resolves the owner's ten flagged rows", () => {
  // yo / me lo — plain and object pronouns -> People.
  assert.equal(syllabusGroupOf(["pos:pronoun"]), "people");
  assert.equal(syllabusGroupOf(["pos:pronoun", "grammar:object-pronoun"]), "people");
  // querer -> Verbs.
  assert.equal(syllabusGroupOf(["pos:verb"]), "verbs");
  // que yo [haga algo] -> Sentence patterns, despite also carrying pos:pronoun.
  assert.equal(
    syllabusGroupOf(["pos:pronoun", "construction:object-control", "grammar:subjunctive"]),
    "patterns",
  );
  // porque -> Connectors.
  assert.equal(syllabusGroupOf(["pos:connector"]), "connectors");
  // para mí / conmigo -> Prepositions and phrases, despite also carrying pos:pronoun.
  assert.equal(
    syllabusGroupOf(["pos:pronoun", "grammar:prepositional-pronoun"]),
    "prepositions",
  );
  // para [hacer algo] -> Prepositions and phrases.
  assert.equal(
    syllabusGroupOf(["pos:preposition", "grammar:purpose", "construction:followed-by-full-infinitive"]),
    "prepositions",
  );
  // algo -> Things and describing words, despite also carrying pos:pronoun.
  assert.equal(
    syllabusGroupOf(["pos:pronoun", "grammar:indefinite-pronoun"]),
    "things",
  );
  // [la] cosa, algún -> Things and describing words.
  assert.equal(syllabusGroupOf(["pos:noun"]), "things");
  assert.equal(syllabusGroupOf(["pos:determiner"]), "things");
  // a row with no facets -> Untagged.
  assert.equal(syllabusGroupOf([]), "untagged");
  assert.equal(syllabusGroupOf(undefined), "untagged");
});

test("syllabusGroupOf maps every known bare or prefixed token", () => {
  assert.equal(syllabusGroupOf("pronoun"), "people");
  assert.equal(syllabusGroupOf("pos:verb"), "verbs");
  assert.equal(syllabusGroupOf("connector"), "connectors");
  assert.equal(syllabusGroupOf("preposition"), "prepositions");
  assert.equal(syllabusGroupOf("adverb"), "time-place");
  for (const pos of ["noun", "adjective", "determiner", "number", "quantifier", "interjection"]) {
    assert.equal(syllabusGroupOf(pos), "things");
  }
  assert.equal(syllabusGroupLabel(syllabusGroupOf("pos:pronoun")), "People");
});

test("unknown, empty and absent collections all fall to Untagged", () => {
  assert.equal(syllabusGroupOf(["pos:particle"]), "untagged");
  assert.equal(syllabusGroupOf("particle"), "untagged");
  assert.equal(syllabusGroupOf(""), "untagged");
  assert.equal(syllabusGroupOf(undefined), "untagged");
  assert.equal(syllabusGroupOf(null), "untagged");
  assert.equal(syllabusGroupOf([]), "untagged");
});

test("grouping keeps the flat order within a group and carries the flat index", () => {
  const items = [
    item("estar", ["pos:verb"]),
    item("yo", ["pos:pronoun"]),
    item("querer", ["pos:verb"]),
    item("freehand"),
    item("conmigo", ["pos:pronoun", "grammar:prepositional-pronoun"]),
  ];
  const groups = groupSyllabusItems(items, collectionsOf);
  assert.deepEqual(
    groups.map((group) => group.label),
    ["People", "Verbs", "Prepositions and phrases", "Untagged"],
  );
  assert.deepEqual(
    groups[0].entries.map((entry) => [entry.item.id, entry.index]),
    [["yo", 1]],
  );
  assert.deepEqual(
    groups[1].entries.map((entry) => [entry.item.id, entry.index]),
    [
      ["estar", 0],
      ["querer", 2],
    ],
  );
  assert.deepEqual(
    groups[2].entries.map((entry) => [entry.item.id, entry.index]),
    [["conmigo", 4]],
  );
  assert.deepEqual(
    groups[3].entries.map((entry) => [entry.item.id, entry.index]),
    [["freehand", 3]],
  );
});

test("empty groups are omitted; an empty list yields no groups", () => {
  assert.deepEqual(groupSyllabusItems([], collectionsOf), []);
  const groups = groupSyllabusItems([item("porque", ["pos:connector"])], collectionsOf);
  assert.deepEqual(groups.map((group) => group.id), ["connectors"]);
});

// The card renders the groups, but `syllabus.main` stays one flat array:
// dropping a pill on a pill in another group must land it at that pill's
// FLAT index, which is what the panel's drop handler asks reorderMainItems
// for (target id + before/after), not at a per-group index.
test("a cross-group drop lands at the target's flat index", () => {
  const concept = (id: string): LessonConcept => ({ id: `syl_${id}`, conceptId: id, label: id });
  const main = ["estar", "yo", "querer", "conmigo"].map(concept);
  const displays: ConceptDisplayLookup = {
    estar: { spanish: "estar", english: "to be", collections: ["pos:verb"] },
    querer: { spanish: "querer", english: "to want", collections: ["pos:verb"] },
    yo: { spanish: "yo", english: "I", collections: ["pos:pronoun"] },
    conmigo: {
      spanish: "conmigo",
      english: "with me",
      collections: ["pos:pronoun", "grammar:prepositional-pronoun"],
    },
  };
  const grouped = groupSyllabusItems(main, (entry) =>
    entry.conceptId ? displays[entry.conceptId]?.collections : undefined,
  );
  // People renders "yo" alone (flat 1); the teacher drags the Verbs pill
  // "querer" (flat 2) onto it and drops it before.
  assert.equal(grouped[0].entries[0].index, 1);
  const next = reorderMainItems({ main, review: [] }, "syl_querer", "syl_yo", "before");
  assert.deepEqual(
    next.main.map((entry) => entry.conceptId),
    ["estar", "querer", "yo", "conmigo"],
  );
});

test("moduleBrief carries the group headings and the level of each entry", () => {
  const concept = (id: string): LessonConcept => ({ id: `syl_${id}`, conceptId: id, label: id });
  const modules: LessonModule[] = [
    {
      id: "m1",
      name: "Confianza I",
      lessonIds: [],
      syllabus: { main: [concept("estar"), concept("yo")], review: [concept("porque")] },
    },
  ];
  const displays: ConceptDisplayLookup = {
    estar: { spanish: "estar [en un lugar]", english: "to be [somewhere]", role: "P1", collections: ["pos:verb"] },
    yo: { spanish: "yo", english: "I", role: "P1", collections: ["pos:pronoun"] },
    porque: { spanish: "porque", english: "because", role: "P2", collections: ["pos:connector"] },
  };
  const brief = moduleBrief(modules[0], 0, [], buildCourseTimeline(modules, []), displays);
  assert.match(brief, /People:\n2\. yo — I \[Level 1\]/);
  assert.match(brief, /Verbs:\n1\. estar \[en un lugar\] — to be \[somewhere\] \[Level 1\]/);
  assert.match(brief, /Connectors:\n- porque — because \[Level 2\]/);
  // People before Verbs, the fixed group order, even though "estar" is
  // first in the flat teaching order.
  assert.ok(brief.indexOf("People:") < brief.indexOf("Verbs:"));
});
