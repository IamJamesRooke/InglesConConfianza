import assert from "node:assert/strict";
import test from "node:test";
import { CURRICULUM_TOPICS } from "../../src/lib/curriculum/topics";
import {
  facetGroup,
  presentFacet,
} from "../../src/components/curriculum/topic-presentation";

test("word-building examples emphasize the actual prefix or suffix", () => {
  const facets = CURRICULUM_TOPICS.find(
    (topic) => topic.slug === "transformations",
  )!.facetButtons;
  const hood = presentFacet(
    facets.find((facet) => facet.collection === "morphology:suffix-hood")!,
  );
  assert.equal(hood.label, "neighborhood");
  assert.equal(hood.before, "neighbor");
  assert.equal(hood.emphasis, "hood");
  const un = presentFacet(
    facets.find((facet) => facet.collection === "morphology:prefix-un")!,
  );
  assert.equal(un.label, "unhappy");
  assert.equal(un.before, "");
  assert.equal(un.emphasis, "un");
  const survivor = presentFacet(
    facets.find((facet) => facet.collection === "morphology:suffix-er-or")!,
  );
  assert.equal(survivor.emphasis, "or");
});

test("presentation keeps each topic's choices distinct and preserves source labels", () => {
  for (const topic of CURRICULUM_TOPICS) {
    const labels = new Set<string>();
    for (const facet of topic.facetButtons) {
      const display = presentFacet(facet);
      assert.equal(display.description, facet.label);
      assert.equal(
        display.before + display.emphasis + display.after,
        display.label,
      );
      assert.ok(
        !labels.has(display.label),
        `${topic.slug}: duplicate label ${display.label}`,
      );
      labels.add(display.label);
    }
  }
});

test("subtopics are grouped by purpose without changing filter values", () => {
  assert.equal(
    facetGroup("transformations", "morphology:suffix-hood"),
    "Endings",
  );
  assert.equal(
    facetGroup("transformations", "morphology:prefix-un"),
    "Prefixes",
  );
  assert.equal(
    facetGroup("cognates", "cognate:plicar-to-ply"),
    "-ar verb cognates (preparAR → prepare)",
  );
  assert.equal(facetGroup("nouns", "gender:invariant"), "Articles & gender");
});
