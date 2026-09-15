import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ModuleNavigator,
  searchModuleNavigator,
} from "../../src/components/lesson-builder/module-navigator";
import type {
  Lesson,
  LessonBlock,
  LessonModule,
} from "../../src/lib/lesson-builder/types";

function explanation(id: string, contentMarkdown: string): LessonBlock {
  return { id, type: "explanation", contentMarkdown };
}

function sentence(
  id: string,
  promptText: string,
  languageBlocks: { spanish: string; acceptedAnswers: string[] }[],
): LessonBlock {
  return {
    id,
    type: "sentence",
    promptText,
    promptLabel: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: languageBlocks.map((lb, index) => ({
      id: `${id}-lb-${index}`,
      spanish: lb.spanish,
      callout: null,
      acceptedAnswers: lb.acceptedAnswers,
    })),
  };
}

function lesson(id: string, name: string, blocks: LessonBlock[] = []): Lesson {
  return { id, name, concepts: [], blocks };
}

/** Synthetic 100-module course, 3 lessons per module — the scale this
 * feature exists for. Module 42's second lesson carries the interesting
 * cases: a lesson title unrelated to its module, an accented Spanish piece,
 * an alternative (non-primary) English answer, plain explanation text, and
 * an attached concept — one target per required search category. */
function bigFixture(): { modules: LessonModule[]; lessons: Lesson[] } {
  const modules: LessonModule[] = [];
  const lessons: Lesson[] = [];
  for (let m = 0; m < 100; m++) {
    const moduleId = `module_${m}`;
    const lessonIds: string[] = [];
    for (let l = 0; l < 3; l++) {
      const lessonId = `lesson_${m}_${l}`;
      lessonIds.push(lessonId);
      if (m === 42 && l === 1) {
        const target = lesson(lessonId, "Ordering food at a restaurant", [
          explanation("b_explain", "Use *quisiera* to sound extra polite."),
          sentence("b_sentence", "Say it like you mean it", [
            { spanish: "Quisiéramos la cuenta, por favor.", acceptedAnswers: [
              "We would like the check, please.",
              "Could we get the bill, please?",
            ] },
          ]),
        ]);
        target.concepts = [
          { id: "c1", conceptId: null, label: "polite requests" },
        ];
        lessons.push(target);
      } else {
        lessons.push(lesson(lessonId, `Module ${m} lesson ${l}`));
      }
    }
    modules.push({ id: moduleId, name: `Module ${m}`, lessonIds });
  }
  return { modules, lessons };
}

test("empty query returns no results (browse mode)", () => {
  const { modules, lessons } = bigFixture();
  assert.deepEqual(searchModuleNavigator(modules, lessons, "   "), []);
});

test("query matching nothing returns an empty list, not a throw", () => {
  const { modules, lessons } = bigFixture();
  assert.deepEqual(searchModuleNavigator(modules, lessons, "xyzxyzxyz"), []);
});

test("finds a module by title across 100 modules, ranked as a title hit", () => {
  const { modules, lessons } = bigFixture();
  const results = searchModuleNavigator(modules, lessons, "module 77");
  const hit = results.find((r) => r.module.id === "module_77");
  assert.ok(hit);
  assert.equal(hit?.field, "module-title");
  assert.equal(hit?.isTitleHit, true);
});

test("finds a lesson whose title doesn't match its module's title, in a nonselected module", () => {
  const { modules, lessons } = bigFixture();
  const results = searchModuleNavigator(modules, lessons, "restaurant");
  const hit = results.find((r) => r.field === "lesson-title");
  assert.ok(hit);
  assert.equal(hit?.lesson?.id, "lesson_42_1");
  assert.equal(hit?.module.id, "module_42");
});

test("title hits rank before content hits", () => {
  const { modules, lessons } = bigFixture();
  // "module 42" is both a module title and appears nowhere else; force a
  // query that hits a title AND unrelated content to check ordering.
  const results = searchModuleNavigator(modules, lessons, "quisiera");
  // "quisiera" only appears in content (explanation), not any title.
  assert.ok(results.every((r) => !r.isTitleHit));

  const mixed = searchModuleNavigator(modules, lessons, "module 5");
  const firstContentIndex = mixed.findIndex((r) => !r.isTitleHit);
  const lastTitleIndex = mixed.map((r) => r.isTitleHit).lastIndexOf(true);
  if (firstContentIndex !== -1 && lastTitleIndex !== -1) {
    assert.ok(lastTitleIndex < firstContentIndex);
  }
});

test("finds accented Spanish text via an unaccented query, and vice versa", () => {
  const { modules, lessons } = bigFixture();
  const withoutAccent = searchModuleNavigator(modules, lessons, "quisieramos");
  const withAccent = searchModuleNavigator(modules, lessons, "quisiéramos");
  assert.ok(withoutAccent.some((r) => r.field === "spanish"));
  assert.ok(withAccent.some((r) => r.field === "spanish"));
});

test("finds an alternative (non-primary) English answer", () => {
  const { modules, lessons } = bigFixture();
  const results = searchModuleNavigator(modules, lessons, "get the bill");
  const hit = results.find((r) => r.field === "english-answer");
  assert.ok(hit);
  assert.equal(hit?.excerpt.hit.toLowerCase(), "get the bill");
});

test("finds plain-text explanation content and strips authored markup from the excerpt", () => {
  const { modules, lessons } = bigFixture();
  const results = searchModuleNavigator(modules, lessons, "sound extra polite");
  const hit = results.find((r) => r.field === "explanation");
  assert.ok(hit);
  assert.ok(!hit?.excerpt.before.includes("*"));
  assert.ok(!hit?.excerpt.after.includes("*"));
});

test("finds a concept attached to the lesson", () => {
  const { modules, lessons } = bigFixture();
  const results = searchModuleNavigator(modules, lessons, "polite requests");
  const hit = results.find((r) => r.field === "concept");
  assert.ok(hit);
  assert.equal(hit?.lesson?.id, "lesson_42_1");
});

test("a content-match result carries the target slide's block id", () => {
  const { modules, lessons } = bigFixture();
  const explanationHit = searchModuleNavigator(
    modules,
    lessons,
    "sound extra polite",
  ).find((r) => r.field === "explanation");
  assert.equal(explanationHit?.blockId, "b_explain");

  const spanishHit = searchModuleNavigator(modules, lessons, "cuenta").find(
    (r) => r.field === "spanish",
  );
  assert.equal(spanishHit?.blockId, "b_sentence");
});

test("does not surface helperText/answerFeedback or raw ids", () => {
  const modules: LessonModule[] = [{ id: "m1", name: "M1", lessonIds: ["l1"] }];
  const block = sentence("b1", "instruction", [
    { spanish: "hola", acceptedAnswers: ["hello"] },
  ]) as Extract<LessonBlock, { type: "sentence" }>;
  block.helperText = "retired helper text with secretword";
  block.answerFeedback = "retired feedback with secretword";
  const lessons: Lesson[] = [lesson("l1", "L1", [block])];
  assert.deepEqual(
    searchModuleNavigator(modules, lessons, "secretword"),
    [],
  );
});

test("untitled modules/lessons don't crash on null names", () => {
  const modules: LessonModule[] = [{ id: "m1", name: null, lessonIds: ["l1"] }];
  const lessons: Lesson[] = [lesson("l1", "", [])];
  assert.deepEqual(searchModuleNavigator(modules, lessons, "anything"), []);
});

test("result count is bounded even for a query that matches broadly", () => {
  const modules: LessonModule[] = [];
  const lessons: Lesson[] = [];
  for (let i = 0; i < 300; i++) {
    modules.push({ id: `m${i}`, name: `Common ${i}`, lessonIds: [] });
  }
  const results = searchModuleNavigator(modules, lessons, "common");
  assert.ok(results.length <= 150);
});

// --- Regression coverage for the reported "la tienda" bug -----------------
// Reported symptom: query "la tienda" surfaced unrelated highlighted
// fragments ("que", "h") from other lessons. Reproduced against the actual
// searchModuleNavigator with a fixture modeling the real lesson content
// (a sentence block split into "Necesito" / "ir a la tienda" / "porque"
// blanks) — the function itself returns exactly one, correct match. The
// actual defect was a duplicate React `key` (field + lesson + blockId
// collided whenever one block had two matches of the same field), which is
// the mechanism by which React can show a stale sibling's content — fixed by
// switching to a plain per-render index key.
function realisticStoreLessonFixture(): { modules: LessonModule[]; lessons: Lesson[] } {
  const modules: LessonModule[] = [
    { id: "m1", name: "Module I", lessonIds: ["l1", "l2", "l3"] },
  ];
  const lessons: Lesson[] = [
    lesson("l1", "I think I am going to be able to do it, but…", [
      sentence("b1", "", [
        { spanish: "Creo", acceptedAnswers: ["I think"] },
        { spanish: "que", acceptedAnswers: ["that"] },
      ]),
    ]),
    lesson("l2", "I need to go to the store.", [
      sentence("b2", "", [
        { spanish: "Necesito", acceptedAnswers: ["I need"] },
        { spanish: "ir a la tienda", acceptedAnswers: ["to go to the store"] },
        { spanish: "porque", acceptedAnswers: ["because"] },
      ]),
    ]),
    lesson("l3", "I want to be able to do it.", [
      sentence("b3", "", [{ spanish: "hacerlo", acceptedAnswers: ["to do it"] }]),
    ]),
  ];
  return { modules, lessons };
}

test("exact multiword phrase 'la tienda' matches only the real occurrence, nothing else", () => {
  const { modules, lessons } = realisticStoreLessonFixture();
  const results = searchModuleNavigator(modules, lessons, "la tienda");
  assert.equal(results.length, 1);
  assert.equal(results[0].lesson?.id, "l2");
  assert.equal(results[0].excerpt.hit.toLowerCase(), "la tienda");
  // The exact unrelated fragments from the bug report must NOT appear.
  assert.ok(!results.some((r) => r.excerpt.hit.toLowerCase() === "que"));
  assert.ok(!results.some((r) => r.excerpt.hit.toLowerCase() === "h"));
});

test("sequential rapid query changes never leak a prior query's results", () => {
  const { modules, lessons } = realisticStoreLessonFixture();
  const sequence = ["q", "qu", "que", "quee", "la", "la ", "la t", "la tienda"];
  const perQueryResults = sequence.map((q) =>
    searchModuleNavigator(modules, lessons, q),
  );
  // Each call is independent and pure — recomputing with the same query
  // later in the sequence must give the identical result set, proving there
  // is no shared mutable state or memoized staleness across calls.
  assert.deepEqual(
    searchModuleNavigator(modules, lessons, "que"),
    perQueryResults[2],
  );
  // The final, real query's results must be exactly the correct one, not a
  // leftover from an earlier partial query in the sequence.
  const final = perQueryResults.at(-1)!;
  assert.equal(final.length, 1);
  assert.equal(final[0].excerpt.hit.toLowerCase(), "la tienda");
});

test("clearing the query returns to empty results (browse mode)", () => {
  const { modules, lessons } = realisticStoreLessonFixture();
  assert.ok(searchModuleNavigator(modules, lessons, "la tienda").length > 0);
  assert.deepEqual(searchModuleNavigator(modules, lessons, ""), []);
});

test("partial-word substrings still match (not whole-word only)", () => {
  const { modules, lessons } = realisticStoreLessonFixture();
  const results = searchModuleNavigator(modules, lessons, "tiend");
  assert.equal(results.length, 1);
  assert.equal(results[0].excerpt.hit.toLowerCase(), "tiend");
});

test("literal regex metacharacters in the query are treated as plain text, not a pattern", () => {
  const modules: LessonModule[] = [{ id: "m1", name: "M1", lessonIds: ["l1"] }];
  const lessons: Lesson[] = [
    lesson("l1", "L1", [
      sentence("b1", "", [
        { spanish: "3.5 kilos (approx.)", acceptedAnswers: ["about 3.5 kilograms"] },
      ]),
    ]),
  ];
  // A literal "." must not act as a regex wildcard: "3x5" must NOT match
  // "3.5", even though /3.5/ as a regex would match it.
  assert.deepEqual(searchModuleNavigator(modules, lessons, "3x5"), []);
  // The literal parenthesised text must be found as typed, and must not
  // throw despite containing regex-special characters.
  assert.doesNotThrow(() =>
    searchModuleNavigator(modules, lessons, "(approx.)"),
  );
  const results = searchModuleNavigator(modules, lessons, "(approx.)");
  assert.equal(results.length, 1);
  assert.equal(results[0].excerpt.hit, "(approx.)");
});

test("a block with two matches of the same field produces two distinct, non-corrupted results", () => {
  const modules: LessonModule[] = [{ id: "m1", name: "M1", lessonIds: ["l1"] }];
  const lessons: Lesson[] = [
    lesson("l1", "L1", [
      sentence("b1", "", [
        { spanish: "vamos", acceptedAnswers: ["let's go"] },
        { spanish: "vámonos ya", acceptedAnswers: ["let's go now"] },
      ]),
    ]),
  ];
  const results = searchModuleNavigator(modules, lessons, "vam");
  assert.equal(results.length, 2);
  assert.equal(results[0].blockId, "b1");
  assert.equal(results[1].blockId, "b1");
  // Each keeps its own distinct source text — no cross-contamination.
  const hits = results.map((r) => r.excerpt.before + r.excerpt.hit + r.excerpt.after);
  assert.notEqual(hits[0], hits[1]);
});

test("each result carries the exact ids its click handler needs (correct click target)", () => {
  const { modules, lessons } = realisticStoreLessonFixture();
  const [result] = searchModuleNavigator(modules, lessons, "la tienda");
  // This is what ModuleNavigator's selectResult() reads to call
  // onSelectLesson(lessonId, blockId) — verifying the data a click would act
  // on, since renderToStaticMarkup can't simulate a real click.
  assert.equal(result.module.id, "m1");
  assert.equal(result.lesson?.id, "l2");
  assert.equal(result.blockId, "b2");
});

test("ModuleNavigator renders all 100 modules in browse mode without throwing", () => {
  const { modules, lessons } = bigFixture();
  const markup = renderToStaticMarkup(
    createElement(ModuleNavigator, {
      modules,
      lessons,
      conceptDisplays: {},
      activeModuleId: "module_0",
      onSelectModule: () => {},
      onSelectLesson: () => {},
      onAddModule: () => {},
      onReorderModule: () => {},
      saveLabel: "All changes saved",
      saveFailed: false,
      canUndo: false,
      canRedo: false,
      onUndo: () => {},
      onRedo: () => {},
      onRetrySave: () => {},
      onImported: () => {},
    }),
  );
  assert.ok(markup.includes("Module 0"));
  assert.ok(markup.includes("Module 99"));
  assert.ok(markup.includes("Add module"));
  assert.ok(markup.includes("Search lessons, phrases, or concepts…"));
});

test("ModuleNavigator marks the active module row", () => {
  const { modules, lessons } = bigFixture();
  const markup = renderToStaticMarkup(
    createElement(ModuleNavigator, {
      modules,
      lessons,
      conceptDisplays: {},
      activeModuleId: "module_5",
      onSelectModule: () => {},
      onSelectLesson: () => {},
      onAddModule: () => {},
      onReorderModule: () => {},
      saveLabel: "All changes saved",
      saveFailed: false,
      canUndo: false,
      canRedo: false,
      onUndo: () => {},
      onRedo: () => {},
      onRetrySave: () => {},
      onImported: () => {},
    }),
  );
  assert.ok(markup.includes('class="module-navigator-row active"'));
});
