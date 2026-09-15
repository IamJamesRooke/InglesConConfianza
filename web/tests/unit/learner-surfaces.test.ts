import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonDashboard } from "../../src/components/learner/lesson-dashboard";
import { PracticeMarkdown } from "../../src/components/practice/practice-markdown";
import { SentencePracticeCard } from "../../src/components/practice/sentence-practice-card";
import {
  isAnswerAccepted,
  normalizeAnswer,
} from "../../src/lib/lesson-builder/utils";

const lesson = {
  id: "hello",
  lessonNumber: 1,
  moduleLessonNumber: 1,
  name: "Hello James!",
  previewText: "Hola James!",
  stepCount: 4,
  concepts: [],
};
const modules = [
  {
    id: "welcome",
    name: "Tu primera conversación",
    kind: "onboarding" as const,
    lessonCount: 1,
    concepts: [],
    lessons: [lesson],
  },
  {
    id: "plans",
    name: "Planes de todos los días",
    kind: "course" as const,
    lessonCount: 1,
    concepts: [],
    lessons: [{ ...lesson, id: "tomorrow", name: "Tomorrow", stepCount: 0 }],
  },
];

test("public course renders lesson destinations without any admin navigation", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules }),
  );
  assert.match(html, /href="\/practice\?lesson=hello"/);
  assert.match(html, /Hola James!/);
  assert.doesNotMatch(
    html,
    /href="\/admin|Lesson Builder|Curriculum|Concepts Taught/,
  );
  assert.match(html, /aria-selected="true"/);
});

test("an explicit module selection survives page load and unavailable lessons have no practice link", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules, initialModuleId: "plans" }),
  );
  assert.match(html, /aria-labelledby="module-tab-plans"/);
  assert.match(html, /Próximamente/);
  assert.doesNotMatch(html, /href="\/practice\?lesson=tomorrow"/);
});

test("the empty course gives learners a meaningful state without authoring instructions", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules: [] }),
  );
  assert.match(html, /Nos vemos pronto/);
  assert.doesNotMatch(html, /\/practice\?|\/admin|Lesson Builder/);
});

test("practice markdown keeps the established paragraph and inline fixtures", () => {
  const html = renderToStaticMarkup(createElement(PracticeMarkdown, {
    markdown: "First line\nsecond line\n\n**bold** and *italic* [[es:hola]] [[en:hello]]",
  }));
  assert.match(html, /<p[^>]*>First line<\/p><p[^>]*>second line<\/p>/);
  assert.match(html, /<strong[^>]*>bold<\/strong>/);
  assert.match(html, /<em[^>]*>italic<\/em>/);
  assert.match(html, /data-language="es"[^>]*>hola<\/mark>/);
  assert.match(html, /data-language="en"[^>]*>hello<\/mark>/);
});

test("an empty explanation renders an empty markdown content container", () => {
  const html = renderToStaticMarkup(createElement(PracticeMarkdown, { markdown: "" }));
  assert.match(html, /^<div class="practice-markdown-content /);
  assert.doesNotMatch(html, /<p/);
});

test("normalizeAnswer folds case in addition to trimming whitespace", () => {
  assert.equal(normalizeAnswer("To do"), normalizeAnswer("to do"));
  assert.equal(normalizeAnswer("I'm hungry"), normalizeAnswer("i'm hungry"));
  assert.notEqual(
    normalizeAnswer("I want to buy"),
    normalizeAnswer("I want to buy it"),
  );
});

test("isAnswerAccepted is case-insensitive and splits legacy semicolon-joined alternates", () => {
  assert.ok(isAnswerAccepted("To do", ["to do"]));
  assert.ok(isAnswerAccepted("i'm hungry", ["I'm hungry"]));
  assert.ok(!isAnswerAccepted("I want to buy it", ["I want to buy"]));
  // Legacy content joins alternates in one literal string instead of two
  // array entries — matching must still accept each half on its own.
  assert.ok(
    isAnswerAccepted("I want to buy", ["I want to buy; I wanna buy"]),
  );
  assert.ok(
    isAnswerAccepted("i wanna buy", ["I want to buy; I wanna buy"]),
  );
  assert.ok(!isAnswerAccepted("", ["I want to buy; I wanna buy"]));
});

test("the sentence practice card skips a dangling fully-blank language block", () => {
  const html = renderToStaticMarkup(
    createElement(SentencePracticeCard, {
      sentence: {
        id: "s1",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "real",
            spanish: "hola",
            callout: null,
            acceptedAnswers: ["hello"],
          },
          {
            id: "phantom",
            spanish: "",
            callout: null,
            acceptedAnswers: [""],
          },
        ],
      },
    }),
  );
  // Only the real block's Spanish prompt should render; the phantom blank
  // block must not produce a second, unlabeled input.
  assert.match(html, /hola/);
  const inputCount = (html.match(/<input/g) ?? []).length;
  assert.equal(inputCount, 1);
});
