import assert from "node:assert/strict";
import test from "node:test";

import {
  closestAcceptedAnswer,
  diffAgainstAnswer,
} from "../../src/lib/learner/answer-diff";

function fix(segments: ReturnType<typeof diffAgainstAnswer>) {
  return segments
    .filter((segment) => segment.status === "fix")
    .map((segment) => segment.text)
    .join("|");
}

function plainText(segments: ReturnType<typeof diffAgainstAnswer>) {
  return segments.map((segment) => segment.text).join("");
}

test("exact prefix: rest of the answer is marked as missing", () => {
  const segments = diffAgainstAnswer("hel", "hello");
  assert.equal(plainText(segments), "hello");
  assert.equal(fix(segments), "lo");
  assert.deepEqual(segments, [
    { text: "hel", status: "same" },
    { text: "lo", status: "fix" },
  ]);
});

test("one wrong letter in the middle marks only that letter", () => {
  const segments = diffAgainstAnswer("hallo", "hello");
  assert.equal(plainText(segments), "hello");
  assert.equal(fix(segments), "e");
});

test("missing last letter marks exactly that letter", () => {
  const segments = diffAgainstAnswer("helo", "hello");
  assert.deepEqual(segments, [
    { text: "hel", status: "same" },
    { text: "l", status: "fix" },
    { text: "o", status: "same" },
  ]);
});

test("extra letters typed leave the answer fully unmarked", () => {
  const segments = diffAgainstAnswer("hellooo", "hello");
  assert.deepEqual(segments, [{ text: "hello", status: "same" }]);
});

test("missing full stop is marked (punctuation is required)", () => {
  const segments = diffAgainstAnswer("hello", "Hello.");
  assert.equal(plainText(segments), "Hello.");
  assert.equal(fix(segments), ".");
});

test("missing comma mid-sentence is marked", () => {
  const segments = diffAgainstAnswer(
    "Well I dont know",
    "Well, I don't know",
  );
  assert.equal(plainText(segments), "Well, I don't know");
  assert.ok(fix(segments).includes(","));
});

test("capitals are forgiven — no marks from case alone", () => {
  const segments = diffAgainstAnswer("HELLO", "hello");
  assert.deepEqual(segments, [{ text: "hello", status: "same" }]);
});

test("curly apostrophe is forgiven both directions", () => {
  assert.deepEqual(diffAgainstAnswer("don't", "don’t"), [
    { text: "don’t", status: "same" },
  ]);
  assert.deepEqual(diffAgainstAnswer("don’t", "don't"), [
    { text: "don't", status: "same" },
  ]);
});

test("far-off input shows the plain answer without marking", () => {
  const segments = diffAgainstAnswer("xyz123", "hello");
  assert.deepEqual(segments, [{ text: "hello", status: "same" }]);
});

test("nothing typed (or whitespace only) shows the plain answer", () => {
  assert.deepEqual(diffAgainstAnswer("", "hello"), [
    { text: "hello", status: "same" },
  ]);
  assert.deepEqual(diffAgainstAnswer("   ", "hello"), [
    { text: "hello", status: "same" },
  ]);
});

test("multi-word piece diffs across the space", () => {
  const segments = diffAgainstAnswer("how are yu", "how are you");
  assert.equal(plainText(segments), "how are you");
  assert.equal(fix(segments), "o");
});

test("closestAcceptedAnswer: 'hii' points at 'hi', not 'hello'", () => {
  assert.equal(closestAcceptedAnswer("hii", ["hello", "hi"]), "hi");
});

test("closestAcceptedAnswer: 'helo' points at 'hello'", () => {
  assert.equal(closestAcceptedAnswer("helo", ["hello", "hi"]), "hello");
});

test("closestAcceptedAnswer: a tie goes to the earlier alternative", () => {
  // "cat" is edit-distance 1 from both "car" and "can" — the earlier one wins.
  assert.equal(closestAcceptedAnswer("cat", ["car", "can"]), "car");
});

test("closestAcceptedAnswer: nothing typed returns the primary answer", () => {
  assert.equal(closestAcceptedAnswer("", ["hello", "hi"]), "hello");
  assert.equal(closestAcceptedAnswer("   ", ["hello", "hi"]), "hello");
});

test("closestAcceptedAnswer: a single accepted answer is always returned", () => {
  assert.equal(closestAcceptedAnswer("whatever", ["hello"]), "hello");
});
