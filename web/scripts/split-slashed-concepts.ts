import "dotenv/config";

import { randomBytes } from "node:crypto";

import { prisma } from "../src/lib/database/prisma";

const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
function newId(): string {
  let id = "";
  for (const byte of randomBytes(10)) id += ID_ALPHABET[byte % ID_ALPHABET.length];
  return id;
}

type Row = {
  id: string;
  spanish: string;
  english: string;
  exampleSpanish: string;
  exampleEnglish: string;
  curriculumRole: "core" | "supporting" | "reference" | "trash";
  collections: { collectionName: string }[];
};

// A closed set of function words we keep as separate rows rather than fold.
const SPLIT_HEADS = /^(ambos|muchos|cuántos|otros|todos|unos|pocos|varios|algunos|los|las|el|la|un|una|nuestros?|vuestros?|este|ese|aquel|estos|esos|aquellos)\b/i;

function feminize(masc: string, femPart: string): string {
  if (/^(a|as|os)$/i.test(femPart)) {
    const plural = /s$/i.test(masc);
    const stem = masc.replace(/o?s?$/i, "");
    return plural ? `${stem}as` : `${stem}a`;
  }
  return femPart;
}

type Plan =
  | { kind: "normalize"; spanish: string; addTag: string }
  | { kind: "split"; forms: { spanish: string; english: string }[] }
  | { kind: "skip" };

function planFor(row: Row): Plan {
  const s = row.spanish.trim();
  const e = row.english.trim();

  // "el/la X" / "el X / la Y"  ->  split into the two gendered forms
  const artLead = s.match(/^(el|la|un|una|los|las)\s*\/\s*(el|la|un|una|los|las)\s+(.+)$/i);
  if (artLead) {
    return {
      kind: "split",
      forms: [
        { spanish: `${artLead[1]} ${artLead[3]}`, english: e },
        { spanish: `${artLead[2]} ${artLead[3]}`, english: e },
      ],
    };
  }
  const artPair = s.match(/^((?:el|la|un|una)\s+\S.+?)\s+\/\s+((?:el|la|un|una)\s+\S.+)$/i);
  if (artPair) {
    return {
      kind: "split",
      forms: [
        { spanish: artPair[1].trim(), english: e },
        { spanish: artPair[2].trim(), english: e },
      ],
    };
  }

  // "-o/-a" style gender agreement on the head word
  const suffix = s.match(/^(.*?)([a-záéíóúñ]+)\s*\/\s*([a-záéíóúñ]+)(\s*\[.*|\s+.+|$)/i);
  if (suffix) {
    const [, prefix, masc, femPart, tail] = suffix;
    const fem = feminize(masc, femPart);
    if (fem.includes("/")) return { kind: "skip" };
    // Closed-set function words: keep both as rows.
    if (SPLIT_HEADS.test(`${prefix}${masc}`.trim()) || SPLIT_HEADS.test(masc)) {
      return {
        kind: "split",
        forms: [
          { spanish: `${prefix}${masc}${tail}`.trim(), english: e },
          { spanish: `${prefix}${fem}${tail}`.trim(), english: e },
        ],
      };
    }
    // Open-class adjective / participle: fold to the masculine, flag agreement.
    return {
      kind: "normalize",
      spanish: `${prefix}${masc}${tail}`.trim(),
      addTag: "grammar:gender-agreement",
    };
  }

  // Bare " / " between two full alternatives
  if (/^[^[\]]+\s+\/\s+[^[\]]+$/.test(s) && s.split(" / ").length === 2) {
    const [a, b] = s.split(" / ").map((p) => p.trim());
    return { kind: "split", forms: [{ spanish: a, english: e }, { spanish: b, english: e }] };
  }

  return { kind: "skip" };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = (await prisma.curriculumConcept.findMany({
    where: { spanish: { contains: "/" }, curriculumRole: { not: "trash" } },
    include: { collections: { orderBy: { position: "asc" } } },
    orderBy: { sortOrder: "asc" },
  })) as Row[];

  const normalize: { row: Row; spanish: string; addTag: string }[] = [];
  const split: { row: Row; forms: { spanish: string; english: string }[] }[] = [];
  const skip: Row[] = [];
  for (const row of rows) {
    if (row.english.includes("/") || /\[[^\]]*\//.test(row.spanish)) {
      skip.push(row);
      continue;
    }
    const plan = planFor(row);
    if (plan.kind === "normalize") normalize.push({ row, spanish: plan.spanish, addTag: plan.addTag });
    else if (plan.kind === "split") split.push({ row, forms: plan.forms });
    else skip.push(row);
  }

  for (const n of normalize) console.log(`FOLD   ${n.row.spanish}  ->  ${n.spanish}`);
  for (const s of split)
    console.log(`SPLIT  ${s.row.spanish}  ->  ${s.forms.map((f) => f.spanish).join(" | ")}`);
  console.log(`\n${normalize.length} folded, ${split.length} split, ${skip.length} skipped.`);
  console.log("\n--- skipped ---");
  for (const row of skip) console.log(`${row.spanish}   (${row.english})`);
  if (!apply) return;

  const maxOrder = await prisma.curriculumConcept.aggregate({ _max: { sortOrder: true } });
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.$transaction(async (transaction) => {
    for (const { row, spanish, addTag } of normalize) {
      await transaction.curriculumConcept.update({
        where: { id: row.id },
        data: { spanish },
      });
      await transaction.collection.upsert({
        where: { name: addTag },
        create: { name: addTag },
        update: {},
      });
      const has = row.collections.some((c) => c.collectionName === addTag);
      if (!has) {
        await transaction.conceptCollection.create({
          data: {
            conceptId: row.id,
            collectionName: addTag,
            position: row.collections.length,
          },
        });
      }
    }
    for (const { row, forms } of split) {
      const collections = row.collections.map((c) => c.collectionName);
      await transaction.curriculumConcept.delete({ where: { id: row.id } });
      for (const form of forms) {
        const existing = await transaction.curriculumConcept.findUnique({
          where: { spanish_english: { spanish: form.spanish, english: form.english } },
        });
        if (existing) continue;
        const id = newId();
        await transaction.curriculumConcept.create({
          data: {
            id,
            spanish: form.spanish,
            english: form.english,
            exampleSpanish: row.exampleSpanish,
            exampleEnglish: row.exampleEnglish,
            curriculumRole: row.curriculumRole,
            sortOrder: nextOrder++,
          },
        });
        await transaction.conceptCollection.createMany({
          data: collections.map((collectionName, position) => ({
            conceptId: id,
            collectionName,
            position,
          })),
        });
      }
    }
    await transaction.collection.deleteMany({
      where: { conceptMemberships: { none: {} } },
    });
  });

  console.log(`\nApplied. Catalog now ${await prisma.curriculumConcept.count()} concepts.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
