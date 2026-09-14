import assert from "node:assert/strict";
import test from "node:test";

import { wrapTrimmed } from "../../src/lib/lesson-builder/serialize-explanation";

// `wrapTrimmed` is the piece of `serializeExplanation` that decides where the
// `**`/`*`/`[[es:…]]`/`==…==` delimiters actually land. It's pure (no DOM),
// so it's testable directly — the surrounding DOM-walking serializer that
// calls it needs a browser and is exercised via `npm run ux:check` instead.
//
// Bug: a selection with a leading/trailing space (an ordinary outcome of
// keyboard word-selection, e.g. Ctrl+Shift+ArrowRight) used to serialize the
// space *inside* the delimiters — `** text**`, `* text*` — which is not
// valid CommonMark emphasis/strong and silently fails to parse back on the
// next render, dropping the formatting with no error.

test("wrapTrimmed moves a leading space outside the delimiters", () => {
  assert.equal(wrapTrimmed(" to be able", "*", "*"), " *to be able*");
});

test("wrapTrimmed moves a trailing space outside the delimiters", () => {
  assert.equal(wrapTrimmed("to be able ", "*", "*"), "*to be able* ");
});

test("wrapTrimmed moves whitespace on both sides outside the delimiters", () => {
  assert.equal(wrapTrimmed("  poder  ", "**", "**"), "  **poder**  ");
});

test("wrapTrimmed handles tabs/newlines as whitespace too", () => {
  assert.equal(wrapTrimmed("\tpoder\n", "**", "**"), "\t**poder**\n");
});

test("wrapTrimmed leaves content with no surrounding whitespace untouched but wrapped", () => {
  assert.equal(wrapTrimmed("poder", "**", "**"), "**poder**");
});

test("wrapTrimmed returns all-whitespace content unwrapped — nothing to emphasize", () => {
  assert.equal(wrapTrimmed("   ", "*", "*"), "   ");
});

test("wrapTrimmed returns empty content unwrapped", () => {
  assert.equal(wrapTrimmed("", "*", "*"), "");
});

test("wrapTrimmed works with the bracketed mark delimiters", () => {
  assert.equal(wrapTrimmed(" quiero ", "[[es:", "]]"), " [[es:quiero]] ");
});
