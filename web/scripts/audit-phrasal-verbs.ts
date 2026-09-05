import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";
import { KNOWN_PARTICLE_VALUES } from "../src/lib/curriculum/collections";

// Enforces the invariants from docs/curation/phrasal-verbs-plan-2026-09-05.md:
// the mechanism meant to make a silent phrasal/prepositional-verb tagging gap
// (like the 926 rows found missing across five fragmented, unreconciled
// tagging schemes) unshippable in the future. Two things are checked:
//
//   1. Every row already carrying topic:phrasal-verb is completely and
//      correctly tagged (a classification, a root, and every particle it
//      claims).
//   2. No row OUTSIDE topic:phrasal-verb has an English gloss shaped like a
//      phrasal/prepositional verb — this is the regression guard. New
//      curriculum content that looks like "to VERB PARTICLE" but was never
//      given the topic tag will show up here.
//
// The discovery sweep in (2) is a heuristic over gloss text, so it produces
// some structurally-identical-looking rows that are not phrasal verbs (full-
// infinitive complements like "to plan to do something", or a Spanish
// preposition whose meaning got absorbed into a plain English transitive
// verb). Known cases of that shape are named in SWEEP_EXEMPTIONS with a
// reason, mirroring audit-cognates.ts's SMALL_FAMILY_EXEMPTIONS — the
// friction of adding a new one deliberately is the point.

const PARTICLES = [...KNOWN_PARTICLE_VALUES].sort((a, b) => b.length - a.length);
const PARTICLE_ALT = PARTICLES.join("|");

// "to VERB PARTICLE" / "[to] VERB PARTICLE", particle immediately after the verb.
const RE_ADJACENT = new RegExp(`^\\[?to\\]?\\s+([a-z]+)\\s+(${PARTICLE_ALT})\\b`, "i");
// Separable form: "to VERB [object] PARTICLE".
const RE_SEPARABLE = new RegExp(`^\\[?to\\]?\\s+([a-z]+)\\s+\\[[^\\]]+\\]\\s+(${PARTICLE_ALT})\\b`, "i");
// Copula + particle idiom: "to be ... PARTICLE" on an es:estar/es:ser/en:be row.
const RE_BE_PARTICLE = new RegExp(`\\bto be\\b[^.]*\\b(${PARTICLE_ALT})\\b`, "i");
// A "to VERB to [infinitive complement]" shape is a modal/object-control
// construction, not a prepositional verb — "to" here is the infinitive
// marker, not a particle. Recognized by the bracket holding a verb-phrase
// placeholder rather than a noun/pronoun one.
const RE_INFINITIVE_COMPLEMENT_TO = /\bto\s+\[(do|doing|done|have|be)\b/i;

const SWEEP_EXEMPTIONS: Record<string, string> = {
  "para empezar|to begin with": "fixed discourse connector (already pos:connector), not a verb+particle idiom",
  "buscar a [alguien]|to want [somebody] for questioning": "one-off legal idiom (\"wanted for questioning\"), not a generalizable prepositional-verb pattern",
  "conocer mejor a [alguien]|to get to know [somebody]": "\"get to + infinitive\" semi-modal construction, not a particle/preposition unit",
  "detenerse para [hacer algo]|to stop to [do something]": "purpose infinitive (\"stop to do X\" = pause in order to do X), the grammar contrast with \"stop doing X\" is the teaching point, not a phrasal verb",
  "tardar [tiempo] en [hacer algo]|to take [an amount of time] to [do something]": "\"take + time + to + infinitive\" construction, not a prepositional verb",
  "conocer [un lugar] por primera vez|to visit [a place] for the first time": "\"for the first time\" is a time adverbial, not a particle",
  "ayudarse de [algo]|to use [something] to help oneself": "purpose infinitive (\"use X to do Y\" = in order to), not a prepositional verb",
  "querer saber por qué [alguien] no [hace algo]|to want to know why [somebody] doesn't [do something]": "\"want to know\" full-infinitive complement with an embedded question, not a prepositional verb",
  "querer saber si [alguien] [hace algo]|to want to know if [somebody] [does something]": "\"want to know\" full-infinitive complement with an embedded question, not a prepositional verb",
  "querer saber si hay [algo]|to want to know if there is [something]": "\"want to know\" full-infinitive complement with an embedded question, not a prepositional verb",
  "ser [hecho] por [alguien]|to be [done] by [somebody]": "passive-voice marker (grammar:passive), not a phrasal verb",
  "pedir [comida] para llevar|to order [food] to go": "\"to go\" is a fixed takeout idiom modifying \"food\", not a verb+particle unit",
  "estar [en un estado]|to be [in a state]": "generic template row — \"[en]\" is a placeholder for any preposition, not a concrete particle",
  "estar [en un lugar]|to be [in a place]": "generic template row — \"[en]\" is a placeholder for any preposition, not a concrete particle",
  "quedar con [alguien]|to arrange to meet [somebody]": "\"arrange to meet\" is a full-infinitive complement; the English gloss has no surviving particle",
  "traer [algo] consigo|to have [something] with you": "\"have with you\" is a generic possession construction, not a prepositional verb",
};

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

function looksLikePhrasalVerb(spanish: string, english: string, tags: string[]): boolean {
  if (english.includes("==") || spanish.includes("==")) return false;
  if (RE_INFINITIVE_COMPLEMENT_TO.test(english)) return false;
  if (RE_ADJACENT.test(english)) return true;
  if (RE_SEPARABLE.test(english)) return true;
  if (RE_BE_PARTICLE.test(english) && (tags.includes("es:estar") || tags.includes("es:ser") || tags.includes("en:be"))) return true;
  return false;
}

export async function auditPhrasalVerbs() {
  const allConcepts = await prisma.curriculumConcept.findMany({
    where: { curriculumRole: { not: "trash" } },
    select: {
      id: true,
      spanish: true,
      english: true,
      collections: { select: { collectionName: true } },
    },
  });

  const problems: string[] = [];
  const label = (r: Row) => `${r.id}  ${r.spanish} → ${r.english}`;

  const tagged = allConcepts.filter((r) => tagsOf(r).includes("topic:phrasal-verb"));
  const untagged = allConcepts.filter((r) => !tagsOf(r).includes("topic:phrasal-verb"));

  // --- Completeness of every already-tagged row ---
  for (const row of tagged) {
    const tags = tagsOf(row);

    const hasClassification = tags.includes("grammar:phrasal-verb") || tags.includes("construction:prepositional-verb");
    if (!hasClassification) {
      problems.push(`[no-classification] ${label(row)} — topic:phrasal-verb but neither grammar:phrasal-verb nor construction:prepositional-verb`);
    }

    const particles = valuesOf(tags, "particle");
    if (particles.length === 0) {
      problems.push(`[no-particle] ${label(row)} — topic:phrasal-verb but no particle: tag`);
    }

    const enTags = valuesOf(tags, "en");
    const rootTags = enTags.filter((v) => !particles.includes(v));
    if (rootTags.length === 0) {
      problems.push(`[no-root] ${label(row)} — topic:phrasal-verb but no en: tag other than its own particle(s) {${enTags.join(",")}}`);
    }
  }

  // --- Regression guard: nothing outside topic:phrasal-verb looks like one ---
  for (const row of untagged) {
    const key = `${row.spanish}|${row.english}`;
    if (key in SWEEP_EXEMPTIONS) continue;
    if (looksLikePhrasalVerb(row.spanish, row.english, tagsOf(row))) {
      problems.push(`[untagged-candidate] ${label(row)} — looks like a phrasal/prepositional verb but has no topic:phrasal-verb tag`);
    }
  }

  // --- Exemptions must still exist and still actually match the sweep ---
  // (an exemption for a row that got edited or deleted is dead weight).
  const byKey = new Map(allConcepts.map((r) => [`${r.spanish}|${r.english}`, r]));
  for (const key of Object.keys(SWEEP_EXEMPTIONS)) {
    const row = byKey.get(key);
    if (!row) {
      problems.push(`[stale-exemption] "${key}" — no concept matches this exemption any more, remove it`);
      continue;
    }
    if (tagsOf(row).includes("topic:phrasal-verb")) {
      problems.push(`[stale-exemption] ${label(row)} — now carries topic:phrasal-verb, its sweep exemption is no longer needed`);
    }
  }

  return {
    taggedCount: tagged.length,
    problems: problems.sort(),
  };
}

async function main() {
  const { taggedCount, problems } = await auditPhrasalVerbs();
  console.log(`${taggedCount} rows carry topic:phrasal-verb.\n`);
  if (problems.length) {
    console.log("--- problems ---");
    for (const p of problems) console.log(p);
    console.log();
  }
  console.log(problems.length === 0 ? "PASS — phrasal verbs are complete and clean." : `${problems.length} findings.`);
  process.exitCode = problems.length === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("audit-phrasal-verbs.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
