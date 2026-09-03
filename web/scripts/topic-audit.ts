import "dotenv/config";

import { CURRICULUM_TOPICS } from "../src/lib/curriculum/topics";
import { prisma } from "../src/lib/database/prisma";

// One auditor for every curriculum macrotag. Each topic in TOPIC_AUDIT_SPECS
// says which English words must be reachable, which grammar: subcategory every
// row needs, and any per-topic quirks. `npm run curriculum:audit [slug]` runs
// one or all; tests/topic-audits.test.ts asserts each is clean.

type ConceptRow = {
  spanish: string;
  english: string;
  exampleSpanish: string;
  collections: { collectionName: string }[];
};

export type TopicAuditSpec = {
  slug: string;
  englishTargets: string[];
  subcategory: RegExp;
  // "exact": an English target is met when some row's english equals it.
  // "phrase": met when some row's english contains it as a whole word.
  matchMode: "exact" | "phrase";
  // phrase mode: extra spellings that satisfy a target (e.g. a -> a|an).
  englishAliases?: Record<string, string[]>;
  requireEn?: boolean; // every row needs an en: lemma tag
  rejectSlash?: boolean; // "/" in a Spanish form is an error
  stripSlashInHead?: boolean; // mucho/a -> mucho when checking the example
  // rows matching this skip the head-word-in-example check
  skipExampleWhen?: (tags: string[]) => boolean;
  // "anchor" rows (e.g. contrast pseudo-sentences) still count toward English
  // coverage but are exempt from the subcategory / en: / example checks
  anchorWhen?: (tags: string[]) => boolean;
  extraChecks?: (concepts: ConceptRow[]) => string[];
};

export const TOPIC_AUDIT_SPECS: TopicAuditSpec[] = [
  {
    slug: "pronouns",
    matchMode: "exact",
    requireEn: true,
    rejectSlash: true,
    subcategory:
      /grammar:(subject-pronoun|object-pronoun|direct-object-pronoun|indirect-object-pronoun|prepositional-pronoun|reflexive-pronoun|reciprocal-pronoun|possessive-determiner|possessive-pronoun|demonstrative-determiner|demonstrative-pronoun|interrogative-pronoun|relative-pronoun|indefinite-pronoun|subordinate-subject-pronoun|exclamative)/,
    anchorWhen: (tags) => tags.some((t) => t.startsWith("contrast:")),
    englishTargets: [
      "I", "me", "my", "mine", "myself",
      "you", "your", "yours", "yourself", "yourselves",
      "he", "him", "his", "himself",
      "she", "her", "hers", "herself",
      "it", "its", "itself",
      "we", "us", "our", "ours", "ourselves",
      "they", "them", "their", "theirs", "themselves",
      "this", "that", "these", "those", "this one", "that one",
      "who", "whom", "whose", "what", "which",
      "to me", "to you", "to him", "to her", "to it", "to us", "to them",
      "somebody", "something", "somewhere",
      "anybody", "anything", "anywhere",
      "nobody", "nothing", "nowhere",
      "everybody", "everything", "everywhere",
      "one", "none", "each", "both", "several", "each other",
    ],
    extraChecks: (concepts) => {
      const out: string[] = [];
      for (const c of concepts) {
        const m = c.english.match(/^(some|any|no|every)\s?(body|one|thing|where)$/);
        if (!m) continue;
        const tags = c.collections.map((x) => x.collectionName);
        if (!tags.includes(`morphology:prefix-${m[1]}`))
          out.push(`NO prefix    ${c.spanish} → ${c.english}`);
        if (!tags.includes(`morphology:suffix-${m[2]}`))
          out.push(`NO suffix    ${c.spanish} → ${c.english}`);
      }
      return out;
    },
  },
  {
    slug: "determiners",
    matchMode: "phrase",
    englishAliases: { a: ["a", "an"] },
    stripSlashInHead: true,
    subcategory:
      /grammar:(definite-article|indefinite-article|neuter-article|contraction|demonstrative-determiner|possessive-determiner|quantifier|cardinal-number|interrogative-determiner|relative-determiner|exclamative)/,
    skipExampleWhen: (tags) => tags.includes("grammar:cardinal-number"),
    englishTargets: [
      "the", "a",
      "some", "any", "no",
      "this", "that", "these", "those",
      "my", "your", "his", "her", "its", "our", "their", "whose",
      "all", "every", "each", "both", "another", "other",
      "much", "many", "more", "less", "few", "little", "enough", "several",
      "such", "half",
      "how much", "how many", "what",
      "one", "two", "three",
    ],
  },
  {
    slug: "interrogatives",
    matchMode: "phrase",
    subcategory: /grammar:interrogative-(pronoun|determiner|adverb)/,
    englishTargets: [
      "what", "who", "whom", "whose", "which",
      "when", "where", "why", "how",
      "how much", "how many",
    ],
  },
];

function headWord(spanish: string, stripSlash: boolean): string | undefined {
  let head = spanish
    .replace(/[¿?¡().]/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\b(el|la|los|las)\b/g, "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase();
  if (head && stripSlash) head = head.split("/")[0];
  return head;
}

function meetsTarget(
  spec: TopicAuditSpec,
  englishValues: Set<string>,
  target: string,
): boolean {
  if (spec.matchMode === "exact") return englishValues.has(target.toLowerCase());
  const spellings = spec.englishAliases?.[target] ?? [target];
  const patterns = spellings.map(
    (s) => new RegExp(`\\b${s.replace(/ /g, "\\s")}\\b`),
  );
  for (const english of englishValues) {
    if (patterns.some((re) => re.test(english))) return true;
  }
  return false;
}

export async function auditTopic(spec: TopicAuditSpec) {
  const baseCollection =
    CURRICULUM_TOPICS.find((t) => t.slug === spec.slug)?.baseCollection ??
    `topic:${spec.slug}`;

  const concepts = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      collections: { some: { collectionName: baseCollection } },
    },
    select: {
      spanish: true,
      english: true,
      exampleSpanish: true,
      collections: { select: { collectionName: true } },
    },
  });

  const problems: string[] = [];
  const englishValues = new Set<string>();

  for (const concept of concepts) {
    const tags = concept.collections.map((m) => m.collectionName);
    const label = `${concept.spanish} → ${concept.english}`;
    englishValues.add(concept.english.toLowerCase());

    if (spec.rejectSlash && concept.spanish.includes("/")) {
      problems.push(`SLASH        ${label}`);
    }
    if (!tags.some((t) => t.startsWith("pos:"))) {
      problems.push(`NO pos:      ${label}`);
    }

    if (spec.anchorWhen?.(tags)) continue;

    if (!tags.some((t) => spec.subcategory.test(t))) {
      problems.push(
        `NO subcat    ${label}   {${tags.filter((t) => t.startsWith("grammar:")).join(", ")}}`,
      );
    }
    if (spec.requireEn && !tags.some((t) => t.startsWith("en:"))) {
      problems.push(`NO en:       ${label}`);
    }

    if (!spec.skipExampleWhen?.(tags)) {
      const head = headWord(concept.spanish, spec.stripSlashInHead ?? false);
      if (
        head &&
        head.length > 1 &&
        !concept.exampleSpanish.toLowerCase().includes(head)
      ) {
        problems.push(
          `EXAMPLE      ${label}   ("${concept.exampleSpanish}" lacks "${head}")`,
        );
      }
    }
  }

  if (spec.extraChecks) problems.push(...spec.extraChecks(concepts));

  const missingEnglish = spec.englishTargets.filter(
    (target) => !meetsTarget(spec, englishValues, target),
  );

  return { count: concepts.length, problems: problems.sort(), missingEnglish };
}

async function main() {
  const wanted = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const specs = wanted.length
    ? TOPIC_AUDIT_SPECS.filter((s) => wanted.includes(s.slug))
    : TOPIC_AUDIT_SPECS;
  if (specs.length === 0) {
    throw new Error(
      `Unknown topic. Known: ${TOPIC_AUDIT_SPECS.map((s) => s.slug).join(", ")}`,
    );
  }

  let findings = 0;
  for (const spec of specs) {
    const { count, problems, missingEnglish } = await auditTopic(spec);
    console.log(`\n=== ${spec.slug} — ${count} concepts ===`);
    for (const problem of problems) console.log(problem);
    if (missingEnglish.length) {
      console.log(`English with no Spanish source: ${missingEnglish.join(", ")}`);
    }
    const topicFindings = problems.length + missingEnglish.length;
    findings += topicFindings;
    console.log(topicFindings === 0 ? "PASS" : `${topicFindings} findings.`);
  }
  process.exitCode = findings === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("topic-audit.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
