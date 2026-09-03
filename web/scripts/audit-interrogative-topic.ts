import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// English question words that should be reachable from some topic:interrogative
// concept.
const ENGLISH_INTERROGATIVES = [
  "what", "who", "whom", "whose", "which",
  "when", "where", "why", "how",
  "how much", "how many",
];

const SUBCATEGORY =
  /grammar:interrogative-(pronoun|determiner|adverb)/;

function headWord(spanish: string): string | undefined {
  return spanish
    .replace(/[¿?¡().]/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase();
}

export async function auditInterrogativeTopic() {
  const concepts = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      collections: { some: { collectionName: "topic:interrogative" } },
    },
    include: { collections: { select: { collectionName: true } } },
  });

  const problems: string[] = [];
  const englishSeen = new Set<string>();

  for (const concept of concepts) {
    const tags = concept.collections.map((m) => m.collectionName);
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
    if (
      head &&
      head.length > 1 &&
      !concept.exampleSpanish.toLowerCase().includes(head)
    ) {
      problems.push(
        `EXAMPLE      ${label}   ("${concept.exampleSpanish}" lacks "${head}")`,
      );
    }

    const lower = concept.english.toLowerCase();
    for (const word of ENGLISH_INTERROGATIVES) {
      if (new RegExp(`\\b${word.replace(/ /g, "\\s")}\\b`).test(lower)) {
        englishSeen.add(word);
      }
    }
  }

  const missingEnglish = ENGLISH_INTERROGATIVES.filter(
    (word) => !englishSeen.has(word),
  );

  return { count: concepts.length, problems: problems.sort(), missingEnglish };
}

async function main() {
  const { count, problems, missingEnglish } = await auditInterrogativeTopic();
  console.log(`${count} topic:interrogative concepts.\n`);
  if (problems.length) {
    console.log("--- concept problems ---");
    for (const problem of problems) console.log(problem);
    console.log();
  }
  if (missingEnglish.length) {
    console.log("--- English interrogatives with no Spanish source ---");
    console.log(missingEnglish.join(", "));
    console.log();
  }
  const total = problems.length + missingEnglish.length;
  console.log(
    total === 0 ? "PASS — interrogative topic is clean." : `${total} findings.`,
  );
  process.exitCode = total === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("audit-interrogative-topic.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
