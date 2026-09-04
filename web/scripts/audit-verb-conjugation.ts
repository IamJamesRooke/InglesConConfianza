import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// Enforces the four invariants from docs/curation/verb-organization-plan-2026-09-05.md
// §4.3 — the mechanism meant to make a silent sense-drop (like the original
// missing "estoy [haciendo algo]") unshippable. Checks every row carrying a
// `sense:` or `conjugation:` tag; does not touch the ~700 other pos:verb rows
// that are correctly untagged infinitives.

const PERSONS = ["1sg", "2sg", "3sg", "1pl", "3pl"] as const;

// Senses with no infinitive-shaped anchor by design (documented in the plan,
// JC #5): haber-existencia's rows (hay/no hay/¿hay?/había) are all already
// finite — Spanish existential "hay" has no infinitive of its own (haber the
// true infinitive means something else, the perfect auxiliary).
const NO_ANCHOR_REQUIRED = new Set(["haber-existencia"]);

// Senses that are structurally impersonal — Spanish "hay" never conjugates by
// person at all, so a 5-slot person paradigm will never exist for it. Exempt
// from invariant #4 the same way NO_ANCHOR_REQUIRED exempts invariant #1.
const IMPERSONAL_ONLY = new Set(["haber-existencia"]);

type Row = {
  id: string;
  spanish: string;
  english: string;
  collections: { collectionName: string }[];
};

function tagsOf(row: Row): string[] {
  return row.collections.map((c) => c.collectionName);
}

function valuesOf(tags: string[], facet: string): string[] {
  const prefix = `${facet}:`;
  return tags.filter((t) => t.startsWith(prefix)).map((t) => t.slice(prefix.length));
}

export async function auditVerbConjugation() {
  const rows = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      OR: [
        { collections: { some: { collectionName: { startsWith: "sense:" } } } },
        { collections: { some: { collectionName: { startsWith: "conjugation:" } } } },
      ],
    },
    select: {
      id: true,
      spanish: true,
      english: true,
      collections: { select: { collectionName: true } },
    },
  });

  const problems: string[] = [];
  const label = (r: Row) => `${r.id}  ${r.spanish} → ${r.english}`;

  // Invariant 2 & 3: per-row shape.
  for (const row of rows) {
    const tags = tagsOf(row);
    const senses = valuesOf(tags, "sense");
    const persons = valuesOf(tags, "conjugation").filter((v) =>
      (PERSONS as readonly string[]).includes(v),
    );
    const tenses = valuesOf(tags, "conjugation").filter(
      (v) => !(PERSONS as readonly string[]).includes(v) && v !== "infinitive" && v !== "deferred" && v !== "irregular",
    );

    if (senses.length > 0) {
      const lemmas = valuesOf(tags, "es");
      if (lemmas.length !== 1) {
        problems.push(
          `[inv2] ${label(row)} — has sense:${senses.join(",")} but ${lemmas.length} es: lemma(s) {${lemmas.join(",")}}, need exactly 1`,
        );
      } else {
        for (const sense of senses) {
          const lemma = sense.split("-")[0];
          if (lemma !== lemmas[0]) {
            problems.push(
              `[inv2] ${label(row)} — sense:${sense} does not match its es:${lemmas[0]} lemma`,
            );
          }
        }
      }
    }

    if (persons.length > 0) {
      if (persons.length !== 1) {
        problems.push(`[inv3] ${label(row)} — ${persons.length} person tags, need exactly 1`);
      }
      if (tenses.length !== 1) {
        problems.push(
          `[inv3] ${label(row)} — has a person tag but ${tenses.length} tense tag(s), need exactly 1`,
        );
      }
      if (senses.length === 0) {
        problems.push(`[inv3] ${label(row)} — has a person tag but no sense: tag`);
      }
    }
  }

  // Invariant 1 & 4: per-sense paradigm shape.
  const bySense = new Map<string, Row[]>();
  for (const row of rows) {
    for (const sense of valuesOf(tagsOf(row), "sense")) {
      if (!bySense.has(sense)) bySense.set(sense, []);
      bySense.get(sense)!.push(row);
    }
  }

  for (const [sense, members] of bySense) {
    const anchors = members.filter((r) => tagsOf(r).includes("conjugation:infinitive"));
    if (anchors.length > 1) {
      problems.push(
        `[inv1] sense:${sense} — ${anchors.length} rows tagged conjugation:infinitive, need exactly 1: ${anchors.map((r) => r.id).join(", ")}`,
      );
    } else if (anchors.length === 0 && !NO_ANCHOR_REQUIRED.has(sense)) {
      problems.push(`[inv1] sense:${sense} — no row tagged conjugation:infinitive (no exemption on file)`);
    }

    const deferred = members.some((r) => tagsOf(r).includes("conjugation:deferred"));
    if (deferred) continue; // explicitly not building a paradigm yet — allowed
    if (IMPERSONAL_ONLY.has(sense)) continue; // never has a 5-person paradigm by nature

    const byTense = new Map<string, Set<string>>();
    for (const row of members) {
      const tags = tagsOf(row);
      const person = valuesOf(tags, "conjugation").find((v) =>
        (PERSONS as readonly string[]).includes(v),
      );
      const tense = valuesOf(tags, "conjugation").find(
        (v) => v !== "infinitive" && v !== "deferred" && v !== "irregular" && !(PERSONS as readonly string[]).includes(v),
      );
      if (!person || !tense) continue;
      if (!byTense.has(tense)) byTense.set(tense, new Set());
      byTense.get(tense)!.add(person);
    }

    const completeTense = [...byTense.entries()].find(
      ([, persons]) => PERSONS.every((p) => persons.has(p)),
    );
    if (!completeTense) {
      const summary = [...byTense.entries()]
        .map(([tense, persons]) => `${tense}: {${[...persons].sort().join(",")}}`)
        .join("; ");
      problems.push(
        `[inv4] sense:${sense} — no tense has all 5 persons, and not tagged conjugation:deferred. Have: ${summary || "(no conjugated members)"}`,
      );
    }
  }

  return { count: rows.length, senseCount: bySense.size, problems: problems.sort() };
}

async function main() {
  const { count, senseCount, problems } = await auditVerbConjugation();
  console.log(`${count} rows carry sense:/conjugation: tags, across ${senseCount} senses.\n`);
  if (problems.length) {
    console.log("--- problems ---");
    for (const p of problems) console.log(p);
    console.log();
  }
  console.log(problems.length === 0 ? "PASS — verb conjugation is clean." : `${problems.length} findings.`);
  process.exitCode = problems.length === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("audit-verb-conjugation.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
