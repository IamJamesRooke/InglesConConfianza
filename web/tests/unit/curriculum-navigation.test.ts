import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCurriculumFamilies,
  resolveCurriculumPath,
} from "../../src/lib/curriculum/navigation";
import { CURRICULUM_TOPICS } from "../../src/lib/curriculum/topics";

test("every configured curriculum facet appears once in the browser", () => {
  for (const topic of CURRICULUM_TOPICS) {
    const families = buildCurriculumFamilies(topic);
    const leaves = families.flatMap((family) => family.leaves);
    assert.equal(leaves.length, topic.facetButtons.length, topic.slug);
    assert.equal(
      new Set(leaves.map((leaf) => leaf.collection)).size,
      leaves.length,
      topic.slug,
    );
    assert.equal(
      new Set(families.map((family) => family.id)).size,
      families.length,
      topic.slug,
    );
  }
});

test("verbs are split into meaningful middle-level families", () => {
  const topic = CURRICULUM_TOPICS.find((entry) => entry.slug === "verbs")!;
  const families = buildCurriculumFamilies(topic);
  const communication = families.find(
    (family) => family.label === "Communication",
  )!;

  assert.ok(communication.leaves.length > 5);
  assert.ok(
    communication.leaves.some(
      (leaf) => leaf.collection === "topic:verb-communication-saying-1",
    ),
  );
  assert.ok(families.some((family) => family.label === "Movement"));
});

test("a legacy single-facet link resolves to its browser path", () => {
  const topic = CURRICULUM_TOPICS.find((entry) => entry.slug === "verbs")!;
  const resolved = resolveCurriculumPath(
    topic,
    "",
    "",
    ["topic:verb-communication-saying-1"],
  );

  assert.equal(resolved.family?.label, "Communication");
  assert.equal(
    resolved.leaf?.collection,
    "topic:verb-communication-saying-1",
  );
});

test("dictionary-like topics use stable alphabetic families", () => {
  const topic = CURRICULUM_TOPICS.find((entry) => entry.slug === "mappings")!;
  const families = buildCurriculumFamilies(topic);

  assert.deepEqual(
    families.map((family) => family.label),
    ["A–E", "F–J", "P–T", "U–Z", "Common confusions"],
  );
});

test("confusion groups appear only on the two Mappings topics", () => {
  for (const topic of CURRICULUM_TOPICS) {
    const families = buildCurriculumFamilies(topic);
    const confusion = families.find(
      (family) => family.label === "Common confusions",
    );
    if (topic.slug === "mappings" || topic.slug === "en-mappings") {
      assert.ok(confusion, `${topic.slug} should have a Common confusions family`);
    } else {
      assert.equal(confusion, undefined, topic.slug);
      for (const facet of topic.facetButtons) {
        assert.ok(
          !facet.collection.startsWith("contrast:") &&
            !facet.collection.startsWith("topic:confusable-"),
          `${topic.slug} still has a confusion facet: ${facet.collection}`,
        );
      }
    }
  }
});
