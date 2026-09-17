import assert from "node:assert/strict";
import test from "node:test";

import { validateFeedbackPayload } from "../../src/lib/feedback/validate";

const basePayload = {
  lessonId: "lesson_1",
  lessonName: "Lección 1",
  slideIndex: 2,
  slideKind: "sentence",
  slideText: "Quiero saber algo. / I want to know something.",
  message: "El botón de continuar no responde en móvil.",
  who: "Ana",
  page: "/practice?lesson=lesson_1",
  userAgent: "test-agent",
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
  assert.equal(result.value.slideText, null);
  assert.equal(result.value.slideKind, "unknown");
  assert.equal(result.value.page, "");
  assert.equal(result.value.userAgent, "");
  assert.equal(typeof result.value.at, "string");
});

test("rejects a non-object body", () => {
  const result = validateFeedbackPayload("not an object");
  assert.equal(result.ok, false);
});
