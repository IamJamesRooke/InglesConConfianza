import assert from "node:assert/strict";
import test from "node:test";
import { CURRICULUM_TOPICS } from "../../src/lib/curriculum/topics";
import {
  facetGroup,
  presentFacet,
} from "../../src/components/curriculum/topic-presentation";

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
    facetGroup("cognates", "cognate:plicar-to-ply"),
    "-ar verb cognates (preparAR → prepare)",
  );
  assert.equal(facetGroup("nouns", "gender:invariant"), "Articles & gender");
  assert.equal(
    facetGroup("verbs", "topic:verb-modal-ability"),
    "Modals, wishes & possibility",
  );
});
