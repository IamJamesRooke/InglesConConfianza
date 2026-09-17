import assert from "node:assert/strict";
import test from "node:test";

import {
  groupFeedback,
  parseFeedbackJsonl,
  renderReportMarkdown,
  type FeedbackNoteRecord,
} from "../../src/lib/feedback/report";

const fixture: FeedbackNoteRecord[] = [
  {
    moduleId: "module_1",
    moduleName: "Módulo 1",
    lessonId: "lesson_1",
    lessonName: "Lección 1",
    slideIndex: 0,
    slideKind: "explanation",
    slideId: "block_1",
    slide: { markdown: "Say hello." },
    who: "Ana",
    message: "El texto está mal escrito.",
    at: "2026-09-17T10:00:00.000Z",
  },
  {
    moduleId: "module_1",
    moduleName: "Módulo 1",
    lessonId: "lesson_1",
    lessonName: "Lección 1",
    slideIndex: 1,
    slideKind: "sentence",
    slideId: "block_2",
    slide: {
      instruction: "Completa la frase.",
      pieces: [
        { spanish: "Quiero saber algo.", acceptedAnswers: ["I want to know something."], given: false },
      ],
    },
    answers: [{ index: 0, typed: "I want to know something.", correct: true }],
    hintsUsed: 1,
    who: "Beto",
    message: "El botón no responde.",
    at: "2026-09-17T10:05:00.000Z",
  },
  {
    // A second note on the same slide as the first — should land in the
    // same slide group, not a duplicate one.
    moduleId: "module_1",
    moduleName: "Módulo 1",
    lessonId: "lesson_1",
    lessonName: "Lección 1",
    slideIndex: 0,
    slideKind: "explanation",
    slideId: "block_1",
    slide: { markdown: "Say hello." },
    who: null,
    message: "Confuso.",
    at: "2026-09-17T10:10:00.000Z",
  },
];

test("groupFeedback nests by module -> lesson -> slide and keeps every note", () => {
  const groups = groupFeedback(fixture);
  assert.equal(groups.length, 1);
  const [moduleGroup] = groups;
  assert.equal(moduleGroup.moduleName, "Módulo 1");
  assert.equal(moduleGroup.lessons.length, 1);
  const [lessonGroup] = moduleGroup.lessons;
  assert.equal(lessonGroup.lessonName, "Lección 1");
  assert.equal(lessonGroup.slides.length, 2);
  // Sorted by slideIndex.
  assert.equal(lessonGroup.slides[0].slideIndex, 0);
  assert.equal(lessonGroup.slides[1].slideIndex, 1);
  // Both notes on slide 0 land in the same group.
  assert.equal(lessonGroup.slides[0].notes.length, 2);
  assert.equal(lessonGroup.slides[1].notes.length, 1);
});

test("groupFeedback buckets notes with no module/lesson under null groups", () => {
  const homeNote: FeedbackNoteRecord = {
    slideKind: "home",
    slide: { nextLessonId: "lesson_1" },
    message: "Me gustaría ver mi progreso.",
  };
  const groups = groupFeedback([homeNote]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].moduleId, null);
  assert.equal(groups[0].lessons[0].lessonId, null);
  assert.equal(groups[0].lessons[0].slides[0].notes.length, 1);
});

test("renderReportMarkdown includes slide text, notes, and a summary table", () => {
  const markdown = renderReportMarkdown(groupFeedback(fixture));
  assert.match(markdown, /Módulo 1/);
  assert.match(markdown, /Lección 1/);
  assert.match(markdown, /Say hello\./);
  assert.match(markdown, /Quiero saber algo\. → I want to know something\./);
  assert.match(markdown, /\*\*Ana\*\*/);
  assert.match(markdown, /El texto está mal escrito\./);
  assert.match(markdown, /## Resumen/);
  assert.match(markdown, /Slides con más comentarios/);
});

test("parseFeedbackJsonl parses one record per line and skips malformed lines", () => {
  const contents = [
    JSON.stringify({ message: "uno" }),
    "not json",
    JSON.stringify({ message: "dos" }),
    "",
  ].join("\n");
  const records = parseFeedbackJsonl(contents);
  assert.equal(records.length, 2);
  assert.equal(records[0].message, "uno");
  assert.equal(records[1].message, "dos");
});
