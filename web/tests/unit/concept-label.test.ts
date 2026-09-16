import assert from "node:assert/strict";
import test from "node:test";

import { splitConceptLabel } from "../../src/lib/lesson-builder/concept-label";

test("a label with no brackets is one plain segment", () => {
  assert.deepEqual(splitConceptLabel("estar"), [{ text: "estar", placeholder: false }]);
});

test("bracketed placeholders split out in source order, with no empty segments", () => {
  assert.deepEqual(splitConceptLabel("querer que [alguien] [haga algo]"), [
    { text: "querer que ", placeholder: false },
    { text: "[alguien]", placeholder: true },
    { text: " ", placeholder: false },
    { text: "[haga algo]", placeholder: true },
  ]);
});

test("a leading placeholder does not produce an empty leading segment", () => {
  assert.deepEqual(splitConceptLabel("[alguien] quiere"), [
    { text: "[alguien]", placeholder: true },
    { text: " quiere", placeholder: false },
  ]);
});

test("an empty label yields no segments", () => {
  assert.deepEqual(splitConceptLabel(""), []);
});

test("the segments always rejoin to the original text", () => {
  for (const label of ["estar [en un lugar]", "no [hacer algo] todavía", "[a] [b]", "plain"]) {
    assert.equal(
      splitConceptLabel(label)
        .map((segment) => segment.text)
        .join(""),
      label,
    );
  }
});
