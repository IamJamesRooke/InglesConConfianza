import assert from "node:assert/strict";
import test from "node:test";

import { planAcceptedAnswersCommit } from "../../src/lib/lesson-builder/answer-commit-plan";

test("unchanged draft produces zero operations (no history noise)", () => {
  assert.deepEqual(planAcceptedAnswersCommit(["hello", "hi"], ["hello", "hi"]), []);
});

test("edited value in place produces a single update at its index", () => {
  assert.deepEqual(planAcceptedAnswersCommit(["hello", "hi"], ["hello", "yo"]), [
    { kind: "update", index: 1, value: "yo" },
  ]);
});

test("growing the array appends only the new trailing entries", () => {
  assert.deepEqual(planAcceptedAnswersCommit(["hello"], ["hello", "hi", "yo"]), [
    { kind: "append", index: 1, value: "hi" },
    { kind: "append", index: 2, value: "yo" },
  ]);
});

test("shrinking the array removes only the dropped trailing entries, highest index first", () => {
  assert.deepEqual(planAcceptedAnswersCommit(["hello", "hi", "yo"], ["hello"]), [
    { kind: "remove", index: 2 },
    { kind: "remove", index: 1 },
  ]);
});

test("shrink and edit combine: overlapping index updates first, then removals", () => {
  assert.deepEqual(planAcceptedAnswersCommit(["hello", "hi", "yo"], ["hey"]), [
    { kind: "update", index: 0, value: "hey" },
    { kind: "remove", index: 2 },
    { kind: "remove", index: 1 },
  ]);
});

test("growing from empty-slot invariant appends from index 1", () => {
  assert.deepEqual(planAcceptedAnswersCommit([""], ["hello", "hi"]), [
    { kind: "update", index: 0, value: "hello" },
    { kind: "append", index: 1, value: "hi" },
  ]);
});
