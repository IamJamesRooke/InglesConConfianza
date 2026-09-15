import assert from "node:assert/strict";
import test from "node:test";

import { proposePairsFromMarkdown } from "../../src/lib/lesson-builder/pair-proposals";

test("simple adjacent pair", () => {
  const markdown = "[[es:quiero]] es [[en:I want]]";
  assert.deepEqual(proposePairsFromMarkdown(markdown), [
    { spanish: "quiero", english: "I want" },
  ]);
});

test("two Spanish marks sharing one trailing English mark", () => {
  const markdown = "[[es:algún]] o [[es:alguna]] es [[en:some]]";
  assert.deepEqual(proposePairsFromMarkdown(markdown), [
    { spanish: "algún", english: "some" },
    { spanish: "alguna", english: "some" },
  ]);
});

test("two pairs across a paragraph break", () => {
  const markdown = "[[es:con]] es [[en:with]]\n\n[[es:conmigo]] es [[en:with me]]";
  assert.deepEqual(proposePairsFromMarkdown(markdown), [
    { spanish: "con", english: "with" },
    { spanish: "conmigo", english: "with me" },
  ]);
});

test("no marks at all -> no pairs", () => {
  assert.deepEqual(proposePairsFromMarkdown("Just plain text, no marks."), []);
});

test("empty markdown -> no pairs", () => {
  assert.deepEqual(proposePairsFromMarkdown(""), []);
});

test("unbalanced/unterminated mark -> no pair", () => {
  // Missing closing "]]" — the regex never matches it, so it's simply not a
  // mark at all; nothing to pair it with.
  const markdown = "[[es:foo]] es [[en:bar";
  assert.deepEqual(proposePairsFromMarkdown(markdown), []);
});

test("English mark before the Spanish mark -> no pair", () => {
  const markdown = "[[en:Y]] es [[es:X]]";
  assert.deepEqual(proposePairsFromMarkdown(markdown), []);
});

test("a Spanish comment/aside after the pair does not affect it", () => {
  const markdown = "[[es:hacer]] es [[en:to do]] (verbo irregular).";
  assert.deepEqual(proposePairsFromMarkdown(markdown), [
    { spanish: "hacer", english: "to do" },
  ]);
});

test("a disallowed gap breaks the connection", () => {
  // "en general" between the marks is not just "es"/"o"/punctuation, so no
  // pair is proposed for this pair of marks.
  const markdown = "[[es:hacer]] en general significa [[en:to do]]";
  assert.deepEqual(proposePairsFromMarkdown(markdown), []);
});

test("a lone Spanish mark with nothing after it -> no pair", () => {
  const markdown = "Vamos a repasar [[es:querer]].";
  assert.deepEqual(proposePairsFromMarkdown(markdown), []);
});

test("comma as connector punctuation", () => {
  const markdown = "[[es:bien]], [[en:well]]";
  assert.deepEqual(proposePairsFromMarkdown(markdown), [
    { spanish: "bien", english: "well" },
  ]);
});
