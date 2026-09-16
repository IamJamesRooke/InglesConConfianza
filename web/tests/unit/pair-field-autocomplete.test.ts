import assert from "node:assert/strict";
import test from "node:test";

import { isAcceptedMatch, nextHighlight } from "../../src/components/lesson-builder/pair-field-autocomplete";

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

// Regression for the owner-reported bug: the popover pre-highlighted its
// first suggestion, so typing "Quiero" and pressing Enter/Tab replaced it
// with "quiero decir". -1 ("nothing highlighted") must be the resting state
// every fresh search lands on — only ArrowDown enters the list.
test("nextHighlight: no default selection — resting state is -1", () => {
  assert.equal(nextHighlight(-1, 0, 5), -1);
});

test("nextHighlight: ArrowDown from -1 enters the list at index 0", () => {
  assert.equal(nextHighlight(-1, 1, 5), 0);
});

test("nextHighlight: ArrowDown walks forward through the results", () => {
  assert.equal(nextHighlight(0, 1, 5), 1);
});

test("nextHighlight: ArrowDown never passes the last result", () => {
  assert.equal(nextHighlight(4, 1, 5), 4);
});

test("nextHighlight: ArrowUp from index 0 leaves the list (back to -1)", () => {
  assert.equal(nextHighlight(0, -1, 5), -1);
});

test("nextHighlight: ArrowUp never goes below -1", () => {
  assert.equal(nextHighlight(-1, -1, 5), -1);
});
