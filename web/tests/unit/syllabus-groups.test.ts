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

type Item = { id: string; pos?: string };

function item(id: string, pos?: string): Item {
  return { id, pos };
}

const posOf = (entry: Item) => entry.pos;

test("group order is fixed and ends in Untagged", () => {
  assert.deepEqual(
    SYLLABUS_GROUPS.map((group) => group.label),
    ["Pronouns", "Verbs", "Connectors", "Prepositions, time and place", "Words", "Untagged"],
  );
});

test("syllabusGroupOf maps every known pos, bare or prefixed", () => {
  assert.equal(syllabusGroupOf("pronoun"), "pronouns");
  assert.equal(syllabusGroupOf("pos:verb"), "verbs");
  assert.equal(syllabusGroupOf("connector"), "connectors");
  assert.equal(syllabusGroupOf("adverb"), "time-place-degree");
  assert.equal(syllabusGroupOf("preposition"), "time-place-degree");
  for (const pos of ["noun", "adjective", "determiner", "number", "quantifier", "interjection"]) {
    assert.equal(syllabusGroupOf(pos), "words");
  }
  assert.equal(syllabusGroupLabel(syllabusGroupOf("pos:pronoun")), "Pronouns");
});

test("unknown, empty and absent pos all fall to Untagged", () => {
  assert.equal(syllabusGroupOf("particle"), "untagged");
  assert.equal(syllabusGroupOf("pos:particle"), "untagged");
  assert.equal(syllabusGroupOf(""), "untagged");
  assert.equal(syllabusGroupOf(undefined), "untagged");
  assert.equal(syllabusGroupOf(null), "untagged");
});

test("grouping keeps the flat order within a group and carries the flat index", () => {
  const items = [
    item("estar", "verb"),
    item("yo", "pronoun"),
    item("querer", "verb"),
    item("freehand"),
    item("conmigo", "pronoun"),
  ];
  const groups = groupSyllabusItems(items, posOf);
  assert.deepEqual(
    groups.map((group) => group.label),
    ["Pronouns", "Verbs", "Untagged"],
  );
  // Within Pronouns: "yo" (flat 1) before "conmigo" (flat 4) — flat order.
  assert.deepEqual(
    groups[0].entries.map((entry) => [entry.item.id, entry.index]),
    [
      ["yo", 1],
      ["conmigo", 4],
    ],
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
    [["freehand", 3]],
  );
});

test("empty groups are omitted; an empty list yields no groups", () => {
  assert.deepEqual(groupSyllabusItems([], posOf), []);
  const groups = groupSyllabusItems([item("porque", "connector")], posOf);
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
    estar: { spanish: "estar", english: "to be", pos: "verb" },
    querer: { spanish: "querer", english: "to want", pos: "verb" },
    yo: { spanish: "yo", english: "I", pos: "pronoun" },
    conmigo: { spanish: "conmigo", english: "with me", pos: "pronoun" },
  };
  const grouped = groupSyllabusItems(main, (entry) =>
    entry.conceptId ? displays[entry.conceptId]?.pos : undefined,
  );
  // Pronouns renders "yo" then "conmigo"; the teacher drags the Verbs pill
  // "querer" (flat 2) onto "yo" (flat 1) and drops it before.
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
    estar: { spanish: "estar [en un lugar]", english: "to be [somewhere]", role: "P1", pos: "verb" },
    yo: { spanish: "yo", english: "I", role: "P1", pos: "pronoun" },
    porque: { spanish: "porque", english: "because", role: "P2", pos: "connector" },
  };
  const brief = moduleBrief(modules[0], 0, [], buildCourseTimeline(modules, []), displays);
  assert.match(brief, /Pronouns:\n2\. yo — I \[Level 1\]/);
  assert.match(brief, /Verbs:\n1\. estar \[en un lugar\] — to be \[somewhere\] \[Level 1\]/);
  assert.match(brief, /Connectors:\n- porque — because \[Level 2\]/);
  // Pronouns before Verbs, the fixed group order, even though "estar" is
  // first in the flat teaching order.
  assert.ok(brief.indexOf("Pronouns:") < brief.indexOf("Verbs:"));
});
