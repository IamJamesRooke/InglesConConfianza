import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// The English determiners that should be reachable from some Spanish concept
// tagged topic:determiner. "a"/"an" count as one; numbers beyond three are
// optional (taught as needed).
const ENGLISH_DETERMINERS = [
  "the", "a",
  "some", "any", "no",
  "this", "that", "these", "those",
  "my", "your", "his", "her", "its", "our", "their", "whose",
  "all", "every", "each", "both", "another", "other",
  "much", "many", "more", "less", "few", "little", "enough", "several",
  "such", "half",
  "how much", "how many", "what",
  "one", "two", "three",
];

const SUBCATEGORY =
  /grammar:(definite-article|indefinite-article|neuter-article|contraction|demonstrative-determiner|possessive-determiner|quantifier|cardinal-number|interrogative-determiner|relative-determiner|exclamative)/;

// Head word of a Spanish form: first token, minus brackets / articles / punct /
// the "/a" "/os" agreement suffix the quantifier rows use (mucho/a -> mucho).
function headWord(spanish: string): string | undefined {
  return spanish
    .replace(/[¿¡().]/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\b(el|la|los|las)\b/g, "")
    .trim()
    .split(/\s+/)[0]
    ?.split("/")[0]
    ?.toLowerCase();
}

// Which ENGLISH_DETERMINERS an english field satisfies (handles "a lot of",
// "the whole", plurals like "nouns", and the a/an pair).
function matchedDeterminers(english: string): string[] {
  const lower = english.toLowerCase();
  return ENGLISH_DETERMINERS.filter((word) => {
    if (word === "a") return /\b(a|an)\b/.test(lower);
    return new RegExp(`\\b${word.replace(/ /g, "\\s")}\\b`).test(lower);
  });
}

export async function auditDeterminerTopic() {
  const concepts = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      collections: { some: { collectionName: "topic:determiner" } },
    },
    include: { collections: { select: { collectionName: true } } },
  });

  const problems: string[] = [];
  const englishSeen = new Set<string>();

  for (const concept of concepts) {
    const tags = concept.collections.map((membership) => membership.collectionName);
    const label = `${concept.spanish} → ${concept.english}`;

    if (!tags.some((tag) => tag.startsWith("pos:"))) {
      problems.push(`NO pos:      ${label}`);
    }
    if (!tags.some((tag) => SUBCATEGORY.test(tag))) {
      problems.push(
        `NO subcat    ${label}   {${tags.filter((t) => t.startsWith("grammar:")).join(", ")}}`,
      );
    }

    const head = headWord(concept.spanish);
    // Cardinal numbers were bulk-imported with a shared placeholder example;
    // fixing those sentences is tracked separately, not by this topic.
    const isNumber = tags.includes("grammar:cardinal-number");
    if (
      head &&
      head.length > 1 &&
      !isNumber &&
      !concept.exampleSpanish.toLowerCase().includes(head)
    ) {
      problems.push(
        `EXAMPLE      ${label}   ("${concept.exampleSpanish}" lacks "${head}")`,
      );
    }

    for (const word of matchedDeterminers(concept.english)) {
      englishSeen.add(word);
    }
  }

  const missingEnglish = ENGLISH_DETERMINERS.filter(
    (word) => !englishSeen.has(word),
  );

  return { count: concepts.length, problems: problems.sort(), missingEnglish };
}

async function main() {
  const { count, problems, missingEnglish } = await auditDeterminerTopic();
  console.log(`${count} topic:determiner concepts.\n`);
  if (problems.length) {
    console.log("--- concept problems ---");
    for (const problem of problems) console.log(problem);
    console.log();
  }
  if (missingEnglish.length) {
    console.log("--- English determiners with no Spanish source ---");
    console.log(missingEnglish.join(", "));
    console.log();
  }
  const total = problems.length + missingEnglish.length;
  console.log(
    total === 0 ? "PASS — determiner topic is clean." : `${total} findings.`,
  );
  process.exitCode = total === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("audit-determiner-topic.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
