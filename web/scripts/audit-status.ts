import "dotenv/config";

import { CURRICULUM_TOPICS } from "../src/lib/curriculum/topics";
import { prisma } from "../src/lib/database/prisma";

// Token-cheap resume point for the full-database audit
// (docs/curation/full-audit-plan.md). State lives in the DB (the
// audit:reviewed tag), not in a markdown checklist, so it can't drift from
// the data it describes. Run this first in any session before reading
// anything else — it tells you exactly where to pick up.
//
//   npm run curriculum:audit:status            # next 10 incomplete units
//   npm run curriculum:audit:status -- --all   # every incomplete unit
//   npm run curriculum:audit:status -- --n=25  # next 25

const ORDER = [
  "pronouns", "determiners", "interrogatives", "questions-negation", "imperatives",
  "nouns", "adjectives", "adverbs", "verbs", "numbers", "connectors", "prepositions",
  "expressions", "collocations",
  "verb-patterns", "verb-forms", "transformations",
  "mappings", "en-mappings",
  "phrasal-verbs-by-root", "phrasal-verbs-by-particle",
  "cognates",
];

// Five priority tiers (Phase 3, docs/curation/role-granularity/plan.md).
// `core` is the WHOLE grammatical operating system on a limited vocabulary: the
// full pronoun / determiner / connector sets, the question words, and the verb
// machinery (ser/estar/tener/ir/haber conjugation, negation, questions, the
// perfect, the modals, comparison). ~10% of the catalog — the rest is
// vocabulary at various teaching priorities. High frequency is NOT what puts a
// row in `core`; "querer" is core (carries structure), "comer" is not (a
// dictionary + the grammar covers it). Bands below are provisional until P3-4
// fills `extended` and P3-5 tunes them against the real shape.
const ROLE_TARGETS: Record<string, [number, number]> = {
  core: [8, 13],
  essential: [6, 14],
  common: [18, 30],
  extended: [16, 28],
  rare: [18, 32],
  trash: [3, 6],
};

async function main() {
  const args = process.argv.slice(2);
  const showAll = args.includes("--all");
  const nArg = args.find((a) => a.startsWith("--n="));
  const n = nArg ? Number.parseInt(nArg.slice(4), 10) : 10;

  type Unit = { slug: string; title: string; collection: string; label: string; total: number; reviewed: number };
  const units: Unit[] = [];

  for (const slug of ORDER) {
    const topic = CURRICULUM_TOPICS.find((t) => t.slug === slug);
    if (!topic) continue;
    for (const f of topic.facetButtons) {
      const total = await prisma.curriculumConcept.count({
        where: { curriculumRole: { not: "trash" }, collections: { some: { collectionName: f.collection } } },
      });
      const reviewed = await prisma.curriculumConcept.count({
        where: {
          curriculumRole: { not: "trash" },
          collections: {
            some: { collectionName: f.collection },
          },
          AND: { collections: { some: { collectionName: "audit:reviewed" } } },
        },
      });
      units.push({ slug, title: topic.title, collection: f.collection, label: f.label, total, reviewed });
    }
  }

  const done = units.filter((u) => u.total > 0 && u.reviewed >= u.total);
  const incomplete = units.filter((u) => !(u.total > 0 && u.reviewed >= u.total));

  console.log(`=== Full audit status ===`);
  console.log(`Track A units: ${done.length}/${units.length} fully reviewed`);

  const totalConcepts = await prisma.curriculumConcept.count({ where: { curriculumRole: { not: "trash" } } });
  const reviewedConcepts = await prisma.curriculumConcept.count({
    where: { curriculumRole: { not: "trash" }, collections: { some: { collectionName: "audit:reviewed" } } },
  });
  const flaggedConcepts = await prisma.curriculumConcept.count({
    where: { collections: { some: { collectionName: "audit:flagged" } } },
  });
  console.log(`Track B concepts: ${reviewedConcepts}/${totalConcepts} reviewed (${((reviewedConcepts / totalConcepts) * 100).toFixed(1)}%)`);
  console.log(`Flagged for user review: ${flaggedConcepts} (see full-audit-findings.md)`);

  console.log(`\n=== Role distribution vs. guardrail ===`);
  const roles = await prisma.curriculumConcept.groupBy({ by: ["curriculumRole"], _count: true });
  const grandTotal = roles.reduce((s, r) => s + r._count, 0);
  for (const r of roles) {
    const pct = (r._count / grandTotal) * 100;
    const target = ROLE_TARGETS[r.curriculumRole];
    const flag = target && (pct < target[0] || pct > target[1]) ? "  <-- outside target range" : "";
    console.log(`  ${r.curriculumRole}\t${r._count}\t${pct.toFixed(1)}%${target ? ` (target ${target[0]}-${target[1]}%)` : ""}${flag}`);
  }

  console.log(`\n=== Next ${showAll ? "all" : n} incomplete units (in priority order) ===`);
  for (const u of (showAll ? incomplete : incomplete.slice(0, n))) {
    console.log(`[ ] ${u.title} / \`${u.collection}\` — ${u.label} (${u.reviewed}/${u.total} reviewed)`);
  }
  if (!showAll && incomplete.length > n) {
    console.log(`... and ${incomplete.length - n} more incomplete units (--all to see all, --n=N for a different count)`);
  }
}
main().then(() => prisma.$disconnect());
