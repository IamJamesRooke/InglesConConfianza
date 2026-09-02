import "dotenv/config";

import { writeFile } from "node:fs/promises";

import { prisma } from "../src/lib/database/prisma";

const ES_ARTICLES = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "lo",
  "al",
  "del",
  "el/la",
  "la/el",
  "un/una",
  "una/un",
  "no",
  "se",
]);

// Conjugated Spanish forms that appear as concept headwords -> infinitive.
const ES_CONJUGATED: Record<string, string> = {
  hay: "haber",
  hace: "hacer",
  había: "haber",
  habría: "haber",
  habrá: "haber",
  hubo: "haber",
  puede: "poder",
  podía: "poder",
  podría: "poder",
  podrá: "poder",
  pudo: "poder",
  tiene: "tener",
  tenía: "tener",
  quiere: "querer",
  quiso: "querer",
  quisiera: "querer",
  quiero: "querer",
  quieras: "querer",
  queriendo: "querer",
  digamos: "decir",
  dice: "decir",
  sabe: "saber",
  supe: "saber",
  sé: "saber",
  sepa: "saber",
  va: "ir",
  vas: "ir",
  fue: "ir",
  fuera: "ser",
  soy: "ser",
  es: "ser",
  era: "ser",
  está: "estar",
  estaba: "estar",
  estoy: "estar",
  solía: "soler",
  gustaría: "gustar",
  encantaría: "encantar",
};
const EN_ARTICLES = new Set(["a", "an", "the", "to"]);
const EN_STOP = new Set([
  "be",
  "not",
  "no",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "would",
  "will",
  "can",
  "could",
  "may",
  "might",
  "should",
  "shall",
  "must",
]);

function stripEdges(token: string) {
  return token.replace(/^[¿¡"'«»(]+/, "").replace(/[.,;:!?"'»)]+$/, "");
}

function esLemma(spanish: string): string | null {
  const lower = spanish.toLowerCase().replace(/[¿¡]/g, "");
  // "pasado de X" / "participio de X" -> the base verb is X.
  const formMatch = lower.match(/^(?:pasado|participio) de ([a-záéíóúñ/]+)/);
  if (formMatch) return formMatch[1].split("/")[0];

  const words = lower
    .replace(/\[[^\]]*\]/g, " ")
    .split(/\s+/)
    .map(stripEdges)
    .filter(Boolean);
  let index = 0;
  while (index < words.length && ES_ARTICLES.has(words[index])) index += 1;
  let head = words[index];
  if (!head) return null;
  if (ES_CONJUGATED[head]) return ES_CONJUGATED[head];
  // Fold a reflexive/clitic verb onto its base infinitive.
  const clitic = head.match(/^(.*?(?:ar|er|ir))(se|me|te|nos|le|lo|la)$/);
  if (clitic && clitic[1].length >= 3) head = clitic[1];
  if (head.length < 2) return null;
  return head.split("/")[0];
}

function enLemma(english: string): string | null {
  const words = english
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/=+>/g, " ")
    .split(/\s+/)
    .map(stripEdges)
    .filter(Boolean);
  let index = 0;
  while (
    index < words.length &&
    (EN_ARTICLES.has(words[index]) ||
      (EN_STOP.has(words[index]) && index < words.length - 1))
  ) {
    index += 1;
  }
  const head = words[index] ?? words[words.length - 1];
  if (!head || head.length < 2 || /^[^a-z]/.test(head)) return null;
  return head.replace(/'s$/, "");
}

async function main() {
  const out = process.argv[2];
  if (!out) {
    throw new Error(
      "Usage: tsx scripts/derive-lemma-collections.ts <out.tsv> [--report]",
    );
  }
  const report = process.argv.includes("--report");

  const concepts = await prisma.curriculumConcept.findMany({
    orderBy: { sortOrder: "asc" },
    include: { collections: { orderBy: { position: "asc" } } },
  });

  const lines: string[] = [];
  const lowConfidence: string[] = [];
  const esCount = new Map<string, number>();
  const enCount = new Map<string, number>();

  for (const concept of concepts) {
    if (concept.curriculumRole === "trash") continue;
    const formBase = concept.spanish
      .toLowerCase()
      .match(/^(?:pasado|participio) de ([a-z]+)/);
    const es = esLemma(concept.spanish);
    // For "pasado de become" the English base verb is written in the Spanish field.
    const en = formBase ? formBase[1] : enLemma(concept.english);
    const add: string[] = [];
    if (es) {
      add.push(`es:${es}`);
      esCount.set(es, (esCount.get(es) ?? 0) + 1);
    }
    if (en) {
      add.push(`en:${en}`);
      enCount.set(en, (enCount.get(en) ?? 0) + 1);
    }
    if (add.length === 0) {
      lowConfidence.push(`${concept.id}\tNO HEAD\t${concept.spanish}\t${concept.english}`);
      continue;
    }
    lines.push(
      [
        concept.id,
        concept.spanish,
        concept.english,
        concept.curriculumRole,
        add.join("|"),
        "lemma facet derived from headword",
      ].join("\t"),
    );
    // Flag rows where the Spanish head is a bracket placeholder or very short idiom.
    if (
      /^[¿¡]?\[/.test(concept.spanish) ||
      concept.spanish.split(/\s+/).length >= 5
    ) {
      lowConfidence.push(
        `${concept.id}\t${add.join("|")}\t${concept.spanish}\t${concept.english}`,
      );
    }
  }

  await writeFile(out, lines.join("\n") + "\n", "utf8");

  if (report) {
    console.log(`${lines.length} concepts tagged, ${lowConfidence.length} flagged.`);
    console.log(`distinct es: ${esCount.size}, distinct en: ${enCount.size}`);
    console.log("\n--- singleton es: lemmas (first 40) ---");
    console.log(
      [...esCount.entries()]
        .filter(([, n]) => n === 1)
        .slice(0, 40)
        .map(([k]) => k)
        .join(", "),
    );
    console.log("\n--- flagged rows (first 40) ---");
    console.log(lowConfidence.slice(0, 40).join("\n"));
  } else {
    console.log(`Wrote ${lines.length} rows to ${out}.`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
