import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCurriculumFamilies,
  resolveCurriculumPath,
} from "../src/lib/curriculum/navigation";
import { conceptInTopicScope } from "../src/lib/curriculum/scope";
import { CURRICULUM_TOPICS } from "../src/lib/curriculum/topics";
import { prisma } from "../src/lib/database/prisma";

// Guards the three-level browser (Topic -> Family -> Group) after the
// 2026-09-07 taxonomy cleanup. Reachability mirrors the real page query in
// src/lib/curriculum/server/curriculum-store.ts: a concept shows under a group
// only if it carries BOTH the topic base tag and that group's collection.
// See docs/curation/taxonomy-cleanup-2026-09-07/.

type Row = {
  id: string;
  spanish: string;
  english: string;
  role: string;
  cols: Set<string>;
};

let rows: Row[];
let nonTrash: Row[];

test.before(async () => {
  const raw = await prisma.curriculumConcept.findMany({
    include: { collections: { select: { collectionName: true } } },
  });
  rows = raw.map((r) => ({
    id: r.id,
    spanish: r.spanish,
    english: r.english,
    role: r.curriculumRole,
    cols: new Set(r.collections.map((c) => c.collectionName)),
  }));
  nonTrash = rows.filter((r) => r.role !== "trash");
});

test.after(async () => {
  await prisma.$disconnect();
});

const label = (r: Row) =>
  `${r.id} "${r.spanish}" -> "${r.english}" [${r.role}]`;

// Topic scope = base collection minus the topic's declared exclusions. The page
// query and the inventory script use the same predicate
// (src/lib/curriculum/scope.ts), so this test measures what the page shows.
const inScope = (topic: (typeof CURRICULUM_TOPICS)[number], r: Row) =>
  conceptInTopicScope(topic, { curriculumRole: r.role, collections: r.cols });

test("no non-trash concept is a global orphan (every one carries a topic base tag)", () => {
  const orphans = nonTrash.filter(
    (r) => !CURRICULUM_TOPICS.some((t) => inScope(t, r)),
  );
  assert.deepEqual(orphans.map(label), [], `${orphans.length} global orphans`);
});

test("every non-trash concept in a topic reaches a Topic -> Family -> Group path", () => {
  const offenders: string[] = [];
  for (const topic of CURRICULUM_TOPICS) {
    const leaves = buildCurriculumFamilies(topic).flatMap((f) =>
      f.leaves.map((l) => l.collection),
    );
    for (const r of nonTrash) {
      if (!inScope(topic, r)) continue;
      if (!leaves.some((c) => r.cols.has(c))) {
        offenders.push(`${topic.slug}: ${label(r)}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `${offenders.length} within-topic gaps`);
});

test("every core concept is reachable through a real group", () => {
  const core = nonTrash.filter((r) => r.role === "core");
  const leavesByTopic = CURRICULUM_TOPICS.map(
    (t) =>
      [
        t,
        buildCurriculumFamilies(t).flatMap((f) =>
          f.leaves.map((l) => l.collection),
        ),
      ] as const,
  );
  const unreachable = core.filter((r) => {
    for (const [topic, leaves] of leavesByTopic) {
      if (inScope(topic, r) && leaves.some((c) => r.cols.has(c))) return false;
    }
    return true;
  });
  assert.deepEqual(
    unreachable.map(label),
    [],
    `${unreachable.length} core concepts reach no group`,
  );
});

test("no dedicated confusion group outside the two Mappings topics", () => {
  const offenders: string[] = [];
  for (const topic of CURRICULUM_TOPICS) {
    if (topic.slug === "mappings" || topic.slug === "en-mappings") continue;
    for (const f of topic.facetButtons) {
      if (
        f.collection.startsWith("contrast:") ||
        f.collection.startsWith("topic:confusable-")
      ) {
        offenders.push(`${topic.slug}: ${f.collection}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("every configured facet button has at least one member concept", () => {
  const empty: string[] = [];
  for (const topic of CURRICULUM_TOPICS) {
    for (const f of topic.facetButtons) {
      const n = nonTrash.filter(
        (r) => inScope(topic, r) && r.cols.has(f.collection),
      ).length;
      if (n === 0) empty.push(`${topic.slug}: ${f.label} (${f.collection})`);
    }
  }
  assert.deepEqual(empty, [], `${empty.length} stale/empty groups`);
});

// --- Family-structure snapshot (Batch 1, 2026-09-07 semantic re-audit) ---
// The exact {topic: [[family label, group count], ...]} map. Every batch that
// re-groups families updates this deliberately, so the diff is reviewed.
// Regenerate the current value with:
//   npx tsx scripts/curriculum-inventory.ts --structure
const EXPECTED_FAMILY_STRUCTURE: Record<string, Array<[string, number]>> = {
  pronouns: [["Pronoun types", 20]],
  determiners: [["Determiner types", 16]],
  interrogatives: [["Question-word roles", 3]],
  verbs: [
    ["Being & existence", 5],
    ["Modals, wishes & possibility", 8],
    ["Communication", 7],
    ["Thinking & learning", 6],
    ["Perception & feelings", 6],
    ["Movement", 8],
    ["Possession & transfer", 12],
    ["Daily life & work", 5],
    ["Making, changing & home", 6],
    ["Social life & conflict", 3],
    ["Specialized actions", 4],
  ],
  cognates: [
    ["-ar verb cognates (preparAR → prepare)", 6],
    ["-er verb cognates (defendER → defend)", 6],
    ["-ir verb cognates (decidIR → decide)", 15],
    ["Noun cognates", 19],
    ["Adjective cognates", 16],
    ["Adverb cognates", 1],
    ["Verb form endings", 4],
    ["How close is it?", 3],
    ["Latin roots — not yet sorted by stem", 1],
  ],
  nouns: [
    ["Articles & gender", 11],
    ["People & family", 5],
    ["Places", 2],
    ["Time & calendar", 3],
    ["Domains", 14],
    ["Objects & things", 3],
    ["Abstract nouns by suffix", 5],
    ["Other abstract nouns", 1],
  ],
  adjectives: [
    ["Adjective endings", 8],
    ["Semantic themes", 13],
    ["How it's used", 3],
    ["Comparison", 6],
    ["Other descriptive adjectives", 1],
  ],
  adverbs: [
    ["Word types", 8],
    ["Meaning & context", 4],
  ],
  numbers: [["Number groups", 8]],
  expressions: [["Expression groups", 7]],
  connectors: [["Connector types", 11]],
  prepositions: [["Preposition groups", 5]],
  mappings: [
    ["A–E", 16],
    ["F–J", 4],
    ["P–T", 20],
    ["U–Z", 4],
    ["Common confusions", 5],
  ],
  "en-mappings": [
    ["A–E", 24],
    ["F–J", 21],
    ["K–O", 21],
    ["P–T", 31],
    ["U–Z", 10],
    ["Common confusions", 2],
  ],
  "phrasal-verbs-by-root": [
    ["A–E", 43],
    ["F–J", 24],
    ["K–O", 22],
    ["P–T", 48],
    ["U–Z", 9],
  ],
  "phrasal-verbs-by-particle": [
    ["A–E", 19],
    ["F–J", 5],
    ["K–O", 7],
    ["P–T", 5],
    ["U–Z", 3],
  ],
  transformations: [
    ["Endings", 23],
    ["Word types", 14],
  ],
  "verb-forms": [
    ["Regular endings", 3],
    ["Irregular patterns", 50],
  ],
  "verb-patterns": [
    ["Sentence patterns", 10],
    ["Verb complements", 8],
  ],
  "questions-negation": [["Question & negative patterns", 6]],
  imperatives: [["Command types", 4]],
  collocations: [["Verb groups", 5]],
};

test("family structure matches the reviewed snapshot", () => {
  const actual = Object.fromEntries(
    CURRICULUM_TOPICS.map((t) => [
      t.slug,
      buildCurriculumFamilies(t).map(
        (f) => [f.label, f.leaves.length] as [string, number],
      ),
    ]),
  );
  assert.deepEqual(actual, EXPECTED_FAMILY_STRUCTURE);
});

// --- Duplicate-axis guard (Batch 1) ---
// Two facet buttons on the same topic whose member sets are near-identical in
// BOTH directions (Jaccard > 0.8) are one axis entered twice. The adjectives
// `topic:adj-abs-*` pairs (P2-3) and the Transformations suffix/POS-change
// pairs (P2-7) have been merged; the allow-list is now empty. A small group
// fully contained in a big one (Jaccard low) is a normal subset, not a
// duplicate, and is deliberately not flagged.
const DUPLICATE_AXIS_ALLOWLIST = new Set<string>();

test("no two facet buttons on a topic are the same axis entered twice", () => {
  const offenders: string[] = [];
  for (const topic of CURRICULUM_TOPICS) {
    const buttons = topic.facetButtons.map((f) => ({
      collection: f.collection,
      members: nonTrash
        .filter((r) => inScope(topic, r) && r.cols.has(f.collection))
        .map((r) => r.id),
    }));
    for (let i = 0; i < buttons.length; i++) {
      for (let j = i + 1; j < buttons.length; j++) {
        const a = buttons[i];
        const b = buttons[j];
        if (a.members.length < 5 || b.members.length < 5) continue;
        const aSet = new Set(a.members);
        const shared = b.members.filter((id) => aSet.has(id)).length;
        const jaccard = shared / (a.members.length + b.members.length - shared);
        if (jaccard <= 0.8) continue;
        const key = [a.collection, b.collection].sort().join(" ~ ");
        if (DUPLICATE_AXIS_ALLOWLIST.has(key)) continue;
        offenders.push(
          `${topic.slug}: ${a.collection} (${a.members.length}) ~ ${b.collection} (${b.members.length}) Jaccard ${Math.round(jaccard * 100)}%`,
        );
      }
    }
  }
  assert.deepEqual(offenders, [], `${offenders.length} duplicate axes`);
});

// --- Deep-link family resolution (Batch 1) ---
// A rename changes a family's slug id, breaking bare ?family=<slug> links. A
// link that also carries a leaf must still resolve its family, because
// resolveCurriculumPath derives the family from the leaf. This pins that so
// later family renames stay safe.
test("a leaf-bearing deep link resolves its family regardless of the family label", () => {
  for (const topic of CURRICULUM_TOPICS) {
    const families = buildCurriculumFamilies(topic);
    for (const family of families) {
      for (const leaf of family.leaves) {
        const resolved = resolveCurriculumPath(
          topic,
          "a-slug-that-does-not-exist",
          leaf.collection,
          [],
        );
        assert.equal(
          resolved.family?.id,
          family.id,
          `${topic.slug}/${leaf.collection}: family not resolved from leaf`,
        );
        assert.equal(resolved.leaf?.collection, leaf.collection);
      }
    }
  }
});

test("family counts are distinct-concept unions, not leaf-count sums", () => {
  // Where two groups in one family share concepts, the family tab must not
  // double-count. Spot-check every family that has >1 leaf.
  for (const topic of CURRICULUM_TOPICS) {
    for (const family of buildCurriculumFamilies(topic)) {
      if (family.leaves.length < 2) continue;
      const union = new Set<string>();
      let sum = 0;
      for (const leaf of family.leaves) {
        const ids = nonTrash
          .filter((r) => inScope(topic, r) && r.cols.has(leaf.collection))
          .map((r) => r.id);
        sum += ids.length;
        for (const id of ids) union.add(id);
      }
      assert.ok(
        union.size <= sum,
        `${topic.slug}/${family.label}: union ${union.size} > sum ${sum}`,
      );
    }
  }
});
