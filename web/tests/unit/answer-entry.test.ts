import assert from "node:assert/strict";
import test from "node:test";

import {
  formatAnswerEntry,
  parseAnswerEntry,
} from "../../src/lib/lesson-builder/answer-entry";

test("formatAnswerEntry joins with ' / ' and parseAnswerEntry reverses it", () => {
  const stored = ["go", "to go"];
  const formatted = formatAnswerEntry(stored);
  assert.equal(formatted, "go / to go");
  assert.deepEqual(parseAnswerEntry(formatted), stored);
});

test("escaped slash round-trips as a literal character (fraction)", () => {
  const stored = ["1/2"];
  const formatted = formatAnswerEntry(stored);
  assert.equal(formatted, "1\\/2");
  assert.deepEqual(parseAnswerEntry(formatted), stored);
});

test("escaped slash round-trips as a literal character (URL)", () => {
  const stored = ["http://example.com/path"];
  const formatted = formatAnswerEntry(stored);
  assert.equal(formatted, "http:\\/\\/example.com\\/path");
  assert.deepEqual(parseAnswerEntry(formatted), stored);
});

test("escaped semicolon round-trips as a literal character", () => {
  const stored = ["wait; then go"];
  const formatted = formatAnswerEntry(stored);
  assert.equal(formatted, "wait\\; then go");
  assert.deepEqual(parseAnswerEntry(formatted), stored);
});

test("escaped backslash round-trips as a literal character", () => {
  const stored = ["C:\\path"];
  const formatted = formatAnswerEntry(stored);
  assert.equal(formatted, "C:\\\\path");
  assert.deepEqual(parseAnswerEntry(formatted), stored);
});

test("multiple answers each carrying their own escaped delimiters round-trip together", () => {
  const stored = ["1/2", "he said \"hi\"; bye", "a\\b"];
  const formatted = formatAnswerEntry(stored);
  assert.deepEqual(parseAnswerEntry(formatted), stored);
});

test("an unknown escape (backslash before a non-delimiter character) is kept literally", () => {
  // Not producible by formatAnswerEntry itself — this is pre-existing/typed
  // content the parser must not corrupt by silently eating the backslash.
  assert.deepEqual(parseAnswerEntry("caf\\e"), ["caf\\e"]);
});

test("a trailing lone backslash is kept literally", () => {
  assert.deepEqual(parseAnswerEntry("go\\"), ["go\\"]);
});

test("legacy unescaped semicolon still splits into separate answers", () => {
  assert.deepEqual(parseAnswerEntry("go; to go"), ["go", "to go"]);
});

test("unescaped slash still splits into separate answers", () => {
  assert.deepEqual(parseAnswerEntry("go / to go"), ["go", "to go"]);
});

test("mixed unescaped legacy semicolon and new slash separators in one entry", () => {
  assert.deepEqual(parseAnswerEntry("go; to go / to be going"), [
    "go",
    "to go",
    "to be going",
  ]);
});

test("empty and whitespace-only entries are trimmed and dropped", () => {
  assert.deepEqual(parseAnswerEntry("go //  / to go"), ["go", "to go"]);
  assert.deepEqual(parseAnswerEntry(""), []);
  assert.deepEqual(parseAnswerEntry("   "), []);
  assert.deepEqual(parseAnswerEntry(" / ; "), []);
});

test("exact duplicates are deduped, case differences are preserved", () => {
  assert.deepEqual(parseAnswerEntry("go / go / Go / go"), ["go", "Go"]);
});

test("surrounding whitespace around either delimiter is trimmed", () => {
  assert.deepEqual(parseAnswerEntry("go;to go /to be going"), [
    "go",
    "to go",
    "to be going",
  ]);
});

test("formatAnswerEntry on an empty array yields an empty string", () => {
  assert.equal(formatAnswerEntry([]), "");
  assert.deepEqual(parseAnswerEntry(formatAnswerEntry([])), []);
});

test("formatAnswerEntry never re-splits an already-malformed stored entry", () => {
  // A pre-existing stored array entry that itself contains a raw semicolon
  // (e.g. authored before this single-field UI existed) must be escaped for
  // display, not split into two stored answers just by being formatted.
  const stored = ["cat; dog"];
  const formatted = formatAnswerEntry(stored);
  assert.equal(formatted, "cat\\; dog");
  assert.equal(stored.length, 1, "format must not mutate/split the input array");
});

test("parse(format(stored)) preserves literal content for realistic distinct answers", () => {
  const stored = [
    "I'm going to go",
    "I am going to go",
    "1/2 of the group",
    "wait; see",
  ];
  assert.deepEqual(parseAnswerEntry(formatAnswerEntry(stored)), stored);
});

test("formatAnswerEntry does not mutate its input array", () => {
  const stored = ["a/b", "c"];
  const copy = [...stored];
  formatAnswerEntry(stored);
  assert.deepEqual(stored, copy);
});
