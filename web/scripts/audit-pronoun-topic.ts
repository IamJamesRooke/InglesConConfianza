import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// The full English pronoun set that should be reachable from some Spanish concept.
const ENGLISH_PRONOUNS = [
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
];

const SUBCATEGORY = /grammar:(subject-pronoun|object-pronoun|direct-object-pronoun|indirect-object-pronoun|prepositional-pronoun|reflexive-pronoun|reciprocal-pronoun|possessive-determiner|possessive-pronoun|demonstrative-determiner|demonstrative-pronoun|interrogative-pronoun|relative-pronoun|indefinite-pronoun|subordinate-subject-pronoun|exclamative)/;

export async function auditPronounTopic() {
  const concepts = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      collections: { some: { collectionName: "topic:pronoun" } },
    },
    include: { collections: { select: { collectionName: true } } },
  });

  const problems: string[] = [];
  const englishSeen = new Set<string>();

  for (const c of concepts) {
    const tags = c.collections.map((x) => x.collectionName);
    const label = `${c.spanish} → ${c.english}`;
    if (c.spanish.includes("/")) problems.push(`SLASH        ${label}`);
    if (!tags.some((t) => t.startsWith("pos:")))
      problems.push(`NO pos:      ${label}`);
    if (
      !tags.some((t) => SUBCATEGORY.test(t)) &&
      !tags.some((t) => t.startsWith("contrast:"))
    )
      problems.push(`NO subcat    ${label}   {${tags.filter((t) => t.startsWith("grammar:")).join(", ")}}`);
    // Contrast anchors are meta bilingual sentences; skip the head-in-example check.
    if (tags.some((t) => t.startsWith("contrast:"))) {
      englishSeen.add(c.english.toLowerCase());
      continue;
    }
    if (!tags.some((t) => t.startsWith("en:")))
      problems.push(`NO en:       ${label}`);
    // Example should contain the Spanish head word (first token, minus brackets/punct).
    const head = c.spanish
      .replace(/[¿¡().]/g, "")
      .replace(/\[[^\]]*\]/g, "")
      .trim()
      .split(/\s+/)[0]
      ?.toLowerCase();
    if (
      head &&
      head.length > 1 &&
      !c.exampleSpanish.toLowerCase().includes(head)
    ) {
      problems.push(`EXAMPLE      ${label}   ("${c.exampleSpanish}" lacks "${head}")`);
    }
    englishSeen.add(c.english.toLowerCase());
  }

  const missingEnglish = ENGLISH_PRONOUNS.filter(
    (word) => !englishSeen.has(word.toLowerCase()),
  );

  // Compound indefinites must carry their prefix/suffix morphology.
  for (const c of concepts) {
    const m = c.english.match(/^(some|any|no|every)\s?(body|one|thing|where)$/);
    if (!m) continue;
    const tags = c.collections.map((x) => x.collectionName);
    if (!tags.includes(`morphology:prefix-${m[1]}`))
      problems.push(`NO prefix    ${c.spanish} → ${c.english}`);
    if (!tags.includes(`morphology:suffix-${m[2]}`))
      problems.push(`NO suffix    ${c.spanish} → ${c.english}`);
  }

  return { count: concepts.length, problems: problems.sort(), missingEnglish };
}

async function main() {
  const { count, problems, missingEnglish } = await auditPronounTopic();
  console.log(`${count} topic:pronoun concepts.\n`);
  if (problems.length) {
    console.log("--- concept problems ---");
    for (const p of problems) console.log(p);
    console.log();
  }
  if (missingEnglish.length) {
    console.log("--- English pronouns with no Spanish source ---");
    console.log(missingEnglish.join(", "));
    console.log();
  }
  const total = problems.length + missingEnglish.length;
  console.log(total === 0 ? "PASS — pronoun topic is clean." : `${total} findings.`);
  process.exitCode = total === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("audit-pronoun-topic.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
