import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { CURRICULUM_TOPICS } from "../src/lib/curriculum/topics";
import { buildCurriculumFamilies } from "../src/lib/curriculum/navigation";
import { prisma } from "../src/lib/database/prisma";

// Reusable curriculum taxonomy inventory for the 2026-09-07 three-level
// browser cleanup (docs/curation/taxonomy-cleanup-2026-09-07/).
//
//   npm run curriculum:inventory            # writes JSON + prints summary
//
// Reachability mirrors the real page query in
// src/lib/curriculum/server/curriculum-store.ts:
//   topic scope  = baseCollection (AND)
//   group (leaf) = baseCollection AND leaf.collection
//   family scope = baseCollection AND (some leaf.collection of that family)
//   "outside families" = baseCollection AND NOT (any leaf.collection)
// A concept is meaningfully reachable iff it has the base tag AND >=1 of the
// topic's facet-button collections.

// Repo-root-relative regardless of cwd (scripts/ -> web/ -> repo root).
const OUT_JSON = resolve(
  __dirname,
  "../../docs/curation/taxonomy-cleanup-2026-09-07/inventory.json",
);

type Row = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
  collections: string[];
};

function isConfusion(collection: string, label: string) {
  return (
    collection.startsWith("contrast:") ||
    collection.startsWith("topic:confusable") ||
    /confus/i.test(label)
  );
}

async function main() {
  const rows: Row[] = (
    await prisma.curriculumConcept.findMany({
      include: { collections: { select: { collectionName: true } } },
    })
  ).map((r) => ({
    id: r.id,
    spanish: r.spanish,
    english: r.english,
    curriculumRole: r.curriculumRole,
    collections: r.collections.map((c) => c.collectionName),
  }));

  const byId = new Map(rows.map((r) => [r.id, r]));
  const nonTrash = rows.filter((r) => r.curriculumRole !== "trash");
  const has = (r: Row, c: string) => r.collections.includes(c);

  // All collections referenced by any topic baseCollection.
  const allBases = new Set(CURRICULUM_TOPICS.map((t) => t.baseCollection));

  const topics = CURRICULUM_TOPICS.map((topic) => {
    const families = buildCurriculumFamilies(topic);
    const leafCollections = families.flatMap((f) =>
      f.leaves.map((l) => l.collection),
    );
    const base = nonTrash.filter((r) => has(r, topic.baseCollection));
    const baseIds = new Set(base.map((r) => r.id));
    const reachableIds = new Set(
      base
        .filter((r) => leafCollections.some((c) => has(r, c)))
        .map((r) => r.id),
    );
    const gapIds = [...baseIds].filter((id) => !reachableIds.has(id));

    const familyReport = families.map((f) => ({
      id: f.id,
      label: f.label,
      confusion: f.leaves.every((l) => isConfusion(l.collection, l.label)),
      groups: f.leaves.map((l) => {
        const members = base.filter((r) => has(r, l.collection));
        return {
          collection: l.collection,
          label: l.label,
          count: members.length,
          confusion: isConfusion(l.collection, l.label),
          coreCount: members.filter((m) => m.curriculumRole === "core").length,
        };
      }),
    }));

    return {
      slug: topic.slug,
      title: topic.title,
      baseCollection: topic.baseCollection,
      baseCount: base.length,
      reachableCount: reachableIds.size,
      withinTopicGapCount: gapIds.length,
      withinTopicGapIds: gapIds,
      families: familyReport,
      emptyGroups: familyReport
        .flatMap((f) => f.groups)
        .filter((g) => g.count === 0)
        .map((g) => g.collection),
      confusionGroups: familyReport
        .flatMap((f) => f.groups)
        .filter((g) => g.confusion)
        .map((g) => ({ collection: g.collection, label: g.label, count: g.count })),
    };
  });

  // Global orphans: non-trash concepts carrying none of the topic base tags.
  const globalOrphans = nonTrash.filter(
    (r) => ![...allBases].some((b) => has(r, b)),
  );

  const MAPPING_TOPICS = new Set(["mappings", "en-mappings"]);
  const confusionOutsideMappings = topics
    .filter((t) => !MAPPING_TOPICS.has(t.slug))
    .flatMap((t) =>
      t.confusionGroups.map((g) => ({ topic: t.slug, ...g })),
    );

  const summary = {
    generatedAt: new Date().toISOString(),
    totals: {
      allConcepts: rows.length,
      nonTrash: nonTrash.length,
      byRole: Object.fromEntries(
        ["core", "supporting", "reference", "trash"].map((role) => [
          role,
          rows.filter((r) => r.curriculumRole === role).length,
        ]),
      ),
    },
    globalOrphanCount: globalOrphans.length,
    confusionOutsideMappingsCount: confusionOutsideMappings.length,
    topics: topics.map((t) => ({
      slug: t.slug,
      baseCount: t.baseCount,
      reachableCount: t.reachableCount,
      withinTopicGapCount: t.withinTopicGapCount,
      emptyGroupCount: t.emptyGroups.length,
      confusionGroupCount: t.confusionGroups.length,
    })),
  };

  writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        summary,
        topics,
        globalOrphans: globalOrphans.map((r) => ({
          id: r.id,
          spanish: r.spanish,
          english: r.english,
          role: r.curriculumRole,
          collections: r.collections,
        })),
        confusionOutsideMappings,
      },
      null,
      2,
    ),
  );

  console.log("=== Curriculum taxonomy inventory ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nGlobal orphans (${globalOrphans.length}):`);
  for (const r of globalOrphans.slice(0, 40)) {
    console.log(`  ${r.id}  ${r.spanish} -> ${r.english} [${r.curriculumRole}]`);
  }
  if (globalOrphans.length > 40) console.log(`  ... +${globalOrphans.length - 40} more`);
  console.log(`\nConfusion groups outside the two Mappings topics (${confusionOutsideMappings.length}):`);
  for (const g of confusionOutsideMappings) {
    console.log(`  ${g.topic}: ${g.label}  (${g.collection}, ${g.count} rows)`);
  }
  console.log("\nPer-topic within-group gaps:");
  for (const t of topics) {
    console.log(
      `  ${t.slug.padEnd(24)} base=${String(t.baseCount).padStart(4)}  reachable=${String(t.reachableCount).padStart(4)}  gap=${String(t.withinTopicGapCount).padStart(4)}  emptyGroups=${t.emptyGroups.length}`,
    );
  }
  console.log(`\nWrote ${OUT_JSON}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
