import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonDashboard } from "../../src/components/learner/lesson-dashboard";
import { PracticeMarkdown } from "../../src/components/practice/practice-markdown";
import { SentencePracticeCard } from "../../src/components/practice/sentence-practice-card";
import { learnerLabel } from "../../src/lib/learner/presentation";
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
  outcomeEnglish: "Hello James!",
  stepCount: 4,
};
const modules = [
  {
    id: "welcome",
    name: "Tu primera conversación",
    kind: "onboarding" as const,
    lessonCount: 1,
    lessons: [lesson],
  },
  {
    id: "plans",
    name: "Planes de todos los días",
    kind: "course" as const,
    lessonCount: 1,
    lessons: [{ ...lesson, id: "tomorrow", name: "Tomorrow", stepCount: 0 }],
  },
];

test("learnerLabel strips curriculum bracket notation into plain words", () => {
  assert.equal(learnerLabel("[the] day"), "the day");
  assert.equal(learnerLabel("[el] día"), "el día");
  assert.equal(
    learnerLabel("[to do something] on purpose"),
    "to do something on purpose",
  );
  assert.equal(learnerLabel("hello"), "hello");
});

test("a single-module course hides the module rail but still lists its lessons", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules: [modules[0]] }),
  );
  assert.doesNotMatch(html, /role="tablist"/);
  assert.match(html, /Tu primera conversación/);
});

test("the hero and lesson row carry no concept chips, minute counts, or status labels", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules }),
  );
  assert.doesNotMatch(html, /learner-concept|Vas a aprender/);
  assert.doesNotMatch(html, /\bmin\b/);
  assert.doesNotMatch(html, /Completada|Repasar|Omitir módulo|Reiniciar módulo/);
  // "Empieza aquí" is a legitimate first-visit hero eyebrow now — just not
  // the old lesson-row status label.
  assert.match(html, /class="learner-eyebrow">Empieza aquí/);
});

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

test("a given middle piece renders as static text, skips the input, and never blocks completion", () => {
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
          { id: "l1", spanish: "Quiero", callout: null, acceptedAnswers: ["I want"] },
          { id: "l2", spanish: "saber", callout: null, acceptedAnswers: ["to know"] },
          { id: "l3", spanish: "si", callout: null, acceptedAnswers: ["if"] },
          {
            id: "l4",
            spanish: "...",
            callout: null,
            acceptedAnswers: ["..."],
            given: true,
          },
        ],
      },
    }),
  );
  // Three testable blanks, not four — the given piece gets no input.
  const inputCount = (html.match(/<input/g) ?? []).length;
  assert.equal(inputCount, 3);
  // Its Spanish and English both still render, as static text.
  assert.match(html, /answer-given-text/);
  assert.match(html, /\.\.\.[\s\S]*\.\.\./);
});
