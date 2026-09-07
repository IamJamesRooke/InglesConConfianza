import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { buildCurriculumFamilies } from "../src/lib/curriculum/navigation";
import { CURRICULUM_TOPICS } from "../src/lib/curriculum/topics";
import { prisma } from "../src/lib/database/prisma";

// Guards the three-level browser (Topic -> Family -> Group) after the
// 2026-09-07 taxonomy cleanup. Reachability mirrors the real page query in
// src/lib/curriculum/server/curriculum-store.ts: a concept shows under a group
// only if it carries BOTH the topic base tag and that group's collection.
// See docs/curation/taxonomy-cleanup-2026-09-07/.

type Row = { id: string; spanish: string; english: string; role: string; cols: Set<string> };

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

const label = (r: Row) => `${r.id} "${r.spanish}" -> "${r.english}" [${r.role}]`;

test("no non-trash concept is a global orphan (every one carries a topic base tag)", () => {
  const bases = CURRICULUM_TOPICS.map((t) => t.baseCollection);
  const orphans = nonTrash.filter((r) => !bases.some((b) => r.cols.has(b)));
  assert.deepEqual(orphans.map(label), [], `${orphans.length} global orphans`);
});

test("every non-trash concept in a topic reaches a Topic -> Family -> Group path", () => {
  const offenders: string[] = [];
  for (const topic of CURRICULUM_TOPICS) {
    const leaves = buildCurriculumFamilies(topic).flatMap((f) =>
      f.leaves.map((l) => l.collection),
    );
    for (const r of nonTrash) {
      if (!r.cols.has(topic.baseCollection)) continue;
      if (!leaves.some((c) => r.cols.has(c))) {
        offenders.push(`${topic.slug}: ${label(r)}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `${offenders.length} within-topic gaps`);
});

test("every core concept is reachable through a real group", () => {
  const core = nonTrash.filter((r) => r.role === "core");
  const bases = new Map(
    CURRICULUM_TOPICS.map((t) => [
      t.baseCollection,
      buildCurriculumFamilies(t).flatMap((f) => f.leaves.map((l) => l.collection)),
    ]),
  );
  const unreachable = core.filter((r) => {
    for (const [base, leaves] of bases) {
      if (r.cols.has(base) && leaves.some((c) => r.cols.has(c))) return false;
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
        (r) => r.cols.has(topic.baseCollection) && r.cols.has(f.collection),
      ).length;
      if (n === 0) empty.push(`${topic.slug}: ${f.label} (${f.collection})`);
    }
  }
  assert.deepEqual(empty, [], `${empty.length} stale/empty groups`);
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
          .filter(
            (r) => r.cols.has(topic.baseCollection) && r.cols.has(leaf.collection),
          )
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
