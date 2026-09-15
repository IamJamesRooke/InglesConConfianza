import assert from "node:assert/strict";
import test from "node:test";

import { isAcceptedMatch } from "../../src/components/lesson-builder/pair-field-autocomplete";

// Regression test for the autocomplete false-positive: the popover must be
// suppressed only when the field's current text matches the concept the
// teacher previously ACCEPTED in this exact field — never merely because a
// search result happens to share the same stripped text (e.g. typing
// "hacer" should never suppress the popover just because a curriculum
// concept's own text also strips down to "hacer").
test("isAcceptedMatch: false when nothing has been accepted yet", () => {
  assert.equal(isAcceptedMatch("hacer", null), false);
});

test("isAcceptedMatch: false while the typed text differs from what was accepted", () => {
  assert.equal(isAcceptedMatch("hace", "hacer"), false);
  assert.equal(isAcceptedMatch("hacer", "hace"), false);
});

test("isAcceptedMatch: true once the field's text matches the accepted concept exactly", () => {
  assert.equal(isAcceptedMatch("hacer", "hacer"), true);
});

test("isAcceptedMatch: case- and whitespace-insensitive", () => {
  assert.equal(isAcceptedMatch("  Hacer  ", "hacer"), true);
  assert.equal(isAcceptedMatch("hacer", "  HACER "), true);
});

test("isAcceptedMatch: stops matching once the teacher edits away from the accepted text", () => {
  assert.equal(isAcceptedMatch("hacer algo", "hacer"), false);
});
