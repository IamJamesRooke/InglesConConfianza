import "dotenv/config";

import { randomBytes } from "node:crypto";

import { curriculumRoles, type CurriculumRole } from "../src/lib/curriculum/types";
import { prisma } from "../src/lib/database/prisma";
import { manifestArgs, readManifestRows, runScript } from "./lib/manifest";

// Manifest columns: spanish, english, exampleSpanish, exampleEnglish, role,
// |-separated collections. Creates brand-new concept rows.

const roles = new Set<CurriculumRole>(curriculumRoles);

// nanoid-style 10-char id from the alphabet the reslug migration used.
const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
function newId(): string {
  const bytes = randomBytes(10);
  let id = "";
  for (const byte of bytes) id += ID_ALPHABET[byte % ID_ALPHABET.length];
  return id;
}

type NewConcept = {
  spanish: string;
  english: string;
  exampleSpanish: string;
  exampleEnglish: string;
  role: CurriculumRole;
  collections: string[];
};

async function main() {
  const { apply, paths } = manifestArgs();
  const manifestRows = await readManifestRows(paths);

  const rows: NewConcept[] = manifestRows.map(({ fields, line, source }) => {
    const [spanish, english, exampleSpanish, exampleEnglish, role, collections] = fields;
    const where = `${source}:${line}`;
    if (!spanish || !english || !exampleSpanish || !exampleEnglish || !role) {
      throw new Error(
        `${where}: expected spanish/english/exampleSpanish/exampleEnglish/role/collections.`,
      );
    }
    if (!roles.has(role as CurriculumRole)) {
      throw new Error(`${where}: unknown role "${role}".`);
    }
    if (english.includes(" / ")) {
      throw new Error(`${where}: english has " / "; split into separate rows.`);
    }
    return {
      spanish,
      english,
      exampleSpanish,
      exampleEnglish,
      role: role as CurriculumRole,
      collections: collections ? collections.split("|").filter(Boolean) : [],
    };
  });

  // Guard the unique (spanish, english) constraint.
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.spanish} ${row.english}`;
    if (seen.has(key)) {
      throw new Error(`Manifest lists (${row.spanish} / ${row.english}) twice.`);
    }
    seen.add(key);
  }
  const clashes = await prisma.curriculumConcept.findMany({
    where: {
      OR: rows.map((row) => ({ spanish: row.spanish, english: row.english })),
    },
    select: { spanish: true, english: true },
  });
  if (clashes.length > 0) {
    throw new Error(
      `Already in the catalog: ${clashes
        .map((concept) => `${concept.spanish} / ${concept.english}`)
        .join("; ")}`,
    );
  }

  for (const row of rows) {
    console.log(
      `+ ${row.spanish} -> ${row.english}  [${row.role}]  {${row.collections.join(", ")}}`,
    );
  }
  console.log(`${rows.length} concepts ${apply ? "adding" : "(dry run)"}.`);
  if (!apply) return;

  const maxOrder = await prisma.curriculumConcept.aggregate({
    _max: { sortOrder: true },
  });
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.$transaction(async (transaction) => {
    for (const row of rows) {
      const id = newId();
      await transaction.collection.createMany({
        data: row.collections.map((name) => ({ name })),
        skipDuplicates: true,
      });
      await transaction.curriculumConcept.create({
        data: {
          id,
          spanish: row.spanish,
          english: row.english,
          exampleSpanish: row.exampleSpanish,
          exampleEnglish: row.exampleEnglish,
          curriculumRole: row.role,
          sortOrder: nextOrder++,
        },
      });
      await transaction.conceptCollection.createMany({
        data: row.collections.map((collectionName, position) => ({
          conceptId: id,
          collectionName,
          position,
        })),
      });
    }
  });

  console.log(
    `Added ${rows.length}. Catalog now ${await prisma.curriculumConcept.count()} concepts.`,
  );
}

runScript(main);
