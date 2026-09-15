import assert from "node:assert/strict";
import test from "node:test";

import {
  alsoTaughtAndReviewed,
  buildCourseTimeline,
  computeModuleWarnings,
  coverageOfItem,
  courseProgress,
  isModuleDone,
  knownSetAtLesson,
  moduleBrief,
  moduleStartLesson,
  reviewPriority,
  addMainItem,
  removeMainItem,
  reorderMainItems,
  addReviewItem,
  removeReviewItem,
  promoteToMain,
  emptySyllabus,
} from "../../src/lib/lesson-builder/syllabus";
import type {
  ConceptDisplayLookup,
  Lesson,
  LessonConcept,
  LessonModule,
} from "../../src/lib/lesson-builder/types";

function concept(conceptId: string | null, label: string, id?: string): LessonConcept {
  return { id: id ?? `lc_${conceptId ?? label}`, conceptId, label };
}

function lesson(id: string, concepts: LessonConcept[] = [], name: string | null = null): Lesson {
  return { id, name, concepts, blocks: [] };
}

function module(
  id: string,
  lessonIds: string[],
  syllabus?: { main: LessonConcept[]; review: LessonConcept[] },
): LessonModule {
  return { id, name: id, lessonIds, ...(syllabus ? { syllabus } : {}) };
}

test("buildCourseTimeline: first/last taught, modulesCovering, deliberate", () => {
  const querer = concept("querer", "querer [algo]");
  const comer = concept("comer", "comer");
  const lessons = [
    lesson("l1", [querer]),
    lesson("l2", [comer]),
    lesson("l3", [querer]), // module 2, re-taught
  ];
  const modules = [
    module("m1", ["l1", "l2"], { main: [querer], review: [] }),
    module("m2", ["l3"]),
  ];
  const timeline = buildCourseTimeline(modules, lessons);
  const querido = timeline.entries.get("querer")!;
  assert.equal(querido.firstTaughtLesson, 1);
  assert.equal(querido.lastTaughtLesson, 3);
  assert.equal(querido.modulesCovering, 2);
  assert.equal(querido.deliberate, 3); // main in m1
  const comido = timeline.entries.get("comer")!;
  assert.equal(comido.deliberate, 1); // never in a syllabus
});

test("knownSetAtLesson: only concepts taught strictly before k", () => {
  const querer = concept("querer", "querer");
  const comer = concept("comer", "comer");
  const lessons = [lesson("l1", [querer]), lesson("l2", [comer])];
  const modules = [module("m1", ["l1", "l2"])];
  const timeline = buildCourseTimeline(modules, lessons);
  assert.deepEqual([...knownSetAtLesson(timeline, 1)], []);
  assert.deepEqual([...knownSetAtLesson(timeline, 2)], ["querer"]);
  assert.deepEqual([...knownSetAtLesson(timeline, 3)].sort(), ["comer", "querer"]);
});

test("moduleStartLesson counts every lesson in earlier modules, even for a module with none of its own", () => {
  const lessons = [lesson("l1"), lesson("l2"), lesson("l3")];
  const modules = [module("m1", ["l1", "l2"]), module("m2", []), module("m3", ["l3"])];
  const timeline = buildCourseTimeline(modules, lessons);
  assert.equal(moduleStartLesson(timeline, 0), 1);
  assert.equal(moduleStartLesson(timeline, 1), 3);
  assert.equal(moduleStartLesson(timeline, 2), 3);
});

test("coverageOfItem: covered when some lesson in the module has the concept", () => {
  const querer = concept("querer", "querer");
  const lessons = [lesson("l1", [querer], "Lesson one")];
  assert.equal(coverageOfItem(querer, lessons).covered, true);
  assert.equal(coverageOfItem(concept("comer", "comer"), lessons).covered, false);
});

test("alsoTaughtAndReviewed: first-ever coverage not on main is also-taught; earlier coverage is reviewed", () => {
  const querer = concept("querer", "querer [algo]");
  const arete = concept("arete", "arete");
  const comer = concept("comer", "comer");
  const lessons = [
    lesson("l1", [querer, arete]), // module 1: querer is main, arete is a bonus first-time
    lesson("l2", [comer, querer]), // module 2: comer is new (also taught), querer is reviewed
  ];
  const modules = [
    module("m1", ["l1"], { main: [querer], review: [] }),
    module("m2", ["l2"]),
  ];
  const timeline = buildCourseTimeline(modules, lessons);

  const m1 = alsoTaughtAndReviewed(modules[0], 0, lessons, timeline);
  assert.deepEqual(m1.alsoTaught.map((i) => i.conceptId), ["arete"]);
  assert.deepEqual(m1.reviewed, []);

  const m2 = alsoTaughtAndReviewed(modules[1], 1, lessons, timeline);
  assert.deepEqual(m2.alsoTaught.map((i) => i.conceptId), ["comer"]);
  assert.deepEqual(m2.reviewed.map((i) => i.conceptId), ["querer"]);
});

test("module with zero lessons: 0/N derived coverage, not done unless it has no requirements", () => {
  const querer = concept("querer", "querer");
  const modules = [module("m1", [], { main: [querer], review: [] })];
  const lessons: Lesson[] = [];
  assert.equal(isModuleDone(modules[0], lessons), false);
  const progress = courseProgress(modules, lessons);
  assert.deepEqual(progress, { done: 0, total: 1 });
});

test("worked review-priority check from the spec", () => {
  // querer: main in module 1, covered once, last covered 20 lessons before
  // module 6 starts.
  // sietemodulos: covered in 7 modules, also last covered 20 lessons ago —
  // the doubling interval should push it far below querer.
  // incidental: covered once, only 3 lessons ago — recent enough that it
  // still loses to querer despite the small gap.
  const querer = concept("querer", "querer [algo]");
  const sietemodulos = concept("sietemodulos", "sietemodulos");
  const incidental = concept("incidental", "incidental");

  const lessons: Lesson[] = [];
  // Module 1: querer taught (main) + sietemodulos's first appearance.
  lessons.push(lesson("l1", [querer, sietemodulos]));
  // Modules 2-7: sietemodulos re-taught in six more modules (7 total).
  for (let i = 2; i <= 7; i++) lessons.push(lesson(`l${i}`, [sietemodulos]));
  // Padding lessons so querer/sietemodulos are ~20 lessons stale by module 9.
  for (let i = 8; i <= 20; i++) lessons.push(lesson(`l${i}`));
  // incidental taught 3 lessons before module 9 starts (lesson 20).
  lessons.push(lesson("l21", [incidental]));
  for (let i = 22; i <= 23; i++) lessons.push(lesson(`l${i}`));

  const modules: LessonModule[] = [
    module("m1", ["l1"], { main: [querer], review: [] }),
    module("m2", ["l2"]),
    module("m3", ["l3"]),
    module("m4", ["l4"]),
    module("m5", ["l5"]),
    module("m6", ["l6"]),
    module("m7", ["l7"]),
    module("m8", ["l8", "l9", "l10", "l11", "l12", "l13", "l14", "l15", "l16", "l17", "l18", "l19", "l20", "l21", "l22", "l23"]),
    module("m9", []), // the module proposing review
  ];

  const timeline = buildCourseTimeline(modules, lessons);
  const ranked = reviewPriority(8, timeline); // module index 8 = "m9"
  const rank = (conceptId: string) => ranked.findIndex((c) => c.item.conceptId === conceptId);

  assert.ok(rank("querer") >= 0, "querer should be a review candidate");
  assert.ok(rank("sietemodulos") >= 0);
  assert.ok(rank("incidental") >= 0);
  assert.ok(
    rank("querer") < rank("sietemodulos"),
    "querer (deliberate, 1 module) should outrank a word reviewed in 7 modules",
  );
  assert.ok(
    rank("querer") < rank("incidental"),
    "querer should outrank an incidental word even though it's staler",
  );
});

test("computeModuleWarnings: not-introduced-yet, not-new, never-taught, missing", () => {
  const querer = concept("querer", "querer [algo]");
  const futuro = concept("futuro", "futuro"); // taught too early relative to known set
  const lessons = [
    lesson("l1", [querer]),
    lesson("l2", [futuro]), // futuro not known and not this module's main point
  ];
  const modules = [
    module("m1", ["l1"], { main: [querer], review: [] }),
    module("m2", ["l2"], { main: [], review: [querer, concept("nope", "never taught")] }),
  ];
  const timeline = buildCourseTimeline(modules, lessons);
  const displays: ConceptDisplayLookup = {
    querer: { spanish: "querer", english: "to want", role: "core" },
    futuro: { spanish: "futuro", english: "future", role: "trash" },
  };

  const w1 = computeModuleWarnings(modules[0], 0, lessons, timeline, displays);
  assert.deepEqual(w1.notIntroducedYet, []);

  const w2 = computeModuleWarnings(modules[1], 1, lessons, timeline, displays);
  assert.equal(w2.notIntroducedYet.length, 1);
  assert.equal(w2.notIntroducedYet[0].conceptKey, "futuro");
  assert.deepEqual(w2.neverTaught.map((i) => i.conceptId), ["nope"]);
  assert.deepEqual(w2.notNew, []); // no main points in m2

  const w1Missing = computeModuleWarnings(modules[0], 0, lessons, timeline, {
    querer: { spanish: "querer", english: "to want", role: "trash" },
  });
  assert.deepEqual(w1Missing.missing.map((i) => i.conceptId), ["querer"]);
});

test("module reorder recomputes warnings: a concept becomes not-introduced-yet after a reorder", () => {
  const querer = concept("querer", "querer");
  const original = [
    module("m1", ["l1"]),
    module("m2", ["l2"], { main: [querer], review: [] }), // declared as m2's main point
  ];
  const lessons = [lesson("l1"), lesson("l2", [querer])];
  const before = buildCourseTimeline(original, lessons);
  const beforeWarnings = computeModuleWarnings(original[1], 1, lessons, before, {});
  assert.deepEqual(beforeWarnings.notIntroducedYet, []); // querer is declared here, fine

  // Swap module order: now l2 (with querer) comes first, l1 second — l1 is
  // untouched, but if a later lesson used querer before this swap it would
  // now show as not-introduced-yet. Demonstrate with a 3rd lesson instead.
  const withThird = [
    module("m1", ["l2"]), // teaches querer first
    module("m2", ["l1", "l3"]),
  ];
  const lessonsWithThird = [...lessons, lesson("l3", [querer])];
  const afterTimeline = buildCourseTimeline(withThird, lessonsWithThird);
  const afterWarnings = computeModuleWarnings(withThird[1], 1, lessonsWithThird, afterTimeline, {});
  assert.deepEqual(afterWarnings.notIntroducedYet, []); // querer now known by l3

  // Reverse it: teach querer only in module 2, after it's used in module 1.
  const reversed = [
    module("m1", ["l1", "l3"]), // l3 uses querer before it's ever taught
    module("m2", ["l2"]), // l2 introduces querer, too late
  ];
  const reversedTimeline = buildCourseTimeline(reversed, lessonsWithThird);
  const reversedWarnings = computeModuleWarnings(reversed[0], 0, lessonsWithThird, reversedTimeline, {});
  assert.equal(reversedWarnings.notIntroducedYet.length, 1);
  assert.equal(reversedWarnings.notIntroducedYet[0].conceptKey, "querer");
});

test("moduleBrief lists main, review, known set, and the naturalness policy", () => {
  const querer = concept("querer", "querer [algo]");
  const saber = concept("saber", "saber [algo]");
  const lessons = [lesson("l1", [querer])];
  const modules = [
    module("m1", ["l1"], { main: [querer], review: [] }),
    module("m2", [], { main: [], review: [saber] }),
  ];
  const timeline = buildCourseTimeline(modules, lessons);
  const displays: ConceptDisplayLookup = {
    querer: { spanish: "querer [algo]", english: "to want [something]" },
  };
  const brief = moduleBrief(modules[0], 0, lessons, timeline, displays);
  assert.match(brief, /Main teaching points/);
  assert.match(brief, /1\. querer \[algo\] — to want \[something\]/);
  assert.match(brief, /Known set at the start of this module \(0 concepts\)/);
  assert.match(brief, /Naturalness policy/);
});

test("reducer-facing mutations: add/remove/reorder/promote, dedup guard", () => {
  const querer = concept("querer", "querer");
  const comer = concept("comer", "comer", "lc_second");
  let syllabus = emptySyllabus();
  syllabus = addMainItem(syllabus, querer);
  syllabus = addMainItem(syllabus, comer);
  assert.equal(syllabus.main.length, 2);
  // duplicate concept id rejected
  syllabus = addMainItem(syllabus, concept("querer", "querer, again", "lc_dup"));
  assert.equal(syllabus.main.length, 2);

  // addMainItem mints its own id rather than reusing the id on the item it
  // was given (a lesson concept's id must never be copied onto a syllabus
  // item), so read the ids actually stored, not `querer.id`/`comer.id`.
  const [storedQuerer, storedComer] = syllabus.main;
  assert.notEqual(storedQuerer.id, querer.id);
  assert.notEqual(storedComer.id, comer.id);

  syllabus = reorderMainItems(syllabus, storedComer.id, storedQuerer.id, "before");
  assert.deepEqual(syllabus.main.map((i) => i.id), [storedComer.id, storedQuerer.id]);

  syllabus = removeMainItem(syllabus, storedComer.id);
  assert.deepEqual(syllabus.main.map((i) => i.id), [storedQuerer.id]);

  const saber = concept("saber", "saber");
  syllabus = addReviewItem(syllabus, saber);
  assert.equal(syllabus.review.length, 1);
  const storedSaber = syllabus.review[0];
  syllabus = removeReviewItem(syllabus, storedSaber.id);
  assert.equal(syllabus.review.length, 0);

  // Promote an also-taught item (not previously in main or review) to main.
  const arete = concept("arete", "arete");
  syllabus = promoteToMain(syllabus, arete);
  assert.deepEqual(syllabus.main.map((i) => i.conceptId), ["querer", "arete"]);

  // Promoting a review item removes it from review as it lands in main.
  syllabus = addReviewItem(syllabus, saber);
  syllabus = promoteToMain(syllabus, saber);
  assert.deepEqual(syllabus.review, []);
  assert.ok(syllabus.main.some((i) => i.conceptId === "saber"));
});
