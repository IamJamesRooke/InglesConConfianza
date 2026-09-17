import assert from "node:assert/strict";
import test from "node:test";

import { validateFeedbackPayload } from "../../src/lib/feedback/validate";

const basePayload = {
  moduleId: "module_1",
  moduleName: "Módulo 1",
  lessonId: "lesson_1",
  lessonName: "Lección 1",
  slideIndex: 2,
  slideCount: 5,
  slideKind: "sentence",
  slideId: "block_1",
  slide: {
    instruction: "Completa la frase.",
    pieces: [
      { spanish: "Quiero saber algo.", acceptedAnswers: ["I want to know something."], given: false },
    ],
  },
  answers: [{ index: 0, typed: "I want to know something.", correct: true }],
  hintsUsed: 1,
  secondsOnSlide: 12,
  muted: false,
  speakerId: "us-man",
  progress: { lessonsCompleted: 1, lessonsTotal: 10 },
  viewport: { w: 1280, h: 800 },
  language: "es-CO",
  pointer: "mouse",
  message: "El botón de continuar no responde en móvil.",
  who: "Ana",
  page: "/practice?lesson=lesson_1",
  userAgent: "test-agent",
  appVersion: "abc1234",
  at: "2026-09-17T00:00:00.000Z",
};

test("accepts a well-formed payload and trims message/who", () => {
  const result = validateFeedbackPayload({
    ...basePayload,
    message: "  space padded  ",
    who: "  Ana  ",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.message, "space padded");
  assert.equal(result.value.who, "Ana");
  assert.equal(result.value.lessonId, "lesson_1");
  assert.equal(result.value.slideIndex, 2);
  assert.equal(result.value.moduleId, "module_1");
  assert.equal(result.value.slideCount, 5);
  assert.deepEqual(result.value.answers, [
    { index: 0, typed: "I want to know something.", correct: true },
  ]);
  assert.equal(result.value.hintsUsed, 1);
  assert.equal(result.value.secondsOnSlide, 12);
  assert.equal(result.value.muted, false);
  assert.equal(result.value.speakerId, "us-man");
  assert.deepEqual(result.value.progress, { lessonsCompleted: 1, lessonsTotal: 10 });
  assert.deepEqual(result.value.viewport, { w: 1280, h: 800 });
  assert.equal(result.value.language, "es-CO");
  assert.equal(result.value.pointer, "mouse");
  assert.equal(result.value.appVersion, "abc1234");
  assert.deepEqual(result.value.slide, basePayload.slide);
});

test("rejects an empty message", () => {
  const result = validateFeedbackPayload({ ...basePayload, message: "   " });
  assert.equal(result.ok, false);
});

test("rejects a message over 2000 characters", () => {
  const result = validateFeedbackPayload({
    ...basePayload,
    message: "a".repeat(2001),
  });
  assert.equal(result.ok, false);
});

test("accepts a message at exactly the 2000 character boundary", () => {
  const result = validateFeedbackPayload({
    ...basePayload,
    message: "a".repeat(2000),
  });
  assert.equal(result.ok, true);
});

test("rejects a who over 80 characters", () => {
  const result = validateFeedbackPayload({
    ...basePayload,
    who: "a".repeat(81),
  });
  assert.equal(result.ok, false);
});

test("who is optional and defaults to null", () => {
  const { who, ...withoutWho } = basePayload;
  void who;
  const result = validateFeedbackPayload(withoutWho);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.who, null);
});

test("coerces missing contextual fields to nulls/defaults instead of rejecting", () => {
  const result = validateFeedbackPayload({ message: "Solo un comentario." });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.lessonId, null);
  assert.equal(result.value.lessonName, null);
  assert.equal(result.value.slideIndex, null);
  assert.equal(result.value.slide, null);
  assert.equal(result.value.slideKind, "unknown");
  assert.equal(result.value.page, "");
  assert.equal(result.value.userAgent, "");
  assert.equal(result.value.appVersion, "dev");
  assert.equal(result.value.answers.length, 0);
  assert.equal(result.value.progress, null);
  assert.equal(result.value.viewport, null);
  assert.equal(result.value.pointer, null);
  assert.equal(typeof result.value.at, "string");
});

test("rejects a non-object body", () => {
  const result = validateFeedbackPayload("not an object");
  assert.equal(result.ok, false);
});

test("rejects a slide snapshot over 8KB serialized", () => {
  const result = validateFeedbackPayload({
    ...basePayload,
    slide: { markdown: "a".repeat(9 * 1024) },
  });
  assert.equal(result.ok, false);
});

test("accepts a slide snapshot at the 8KB boundary and drops malformed answer entries", () => {
  const result = validateFeedbackPayload({
    ...basePayload,
    slide: { markdown: "a" },
    answers: [
      { index: 0, typed: "hi", correct: true },
      { typed: "no index" },
      "not an object",
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.answers, [{ index: 0, typed: "hi", correct: true }]);
});
