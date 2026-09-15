import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";
import { cleanOrphanCollections, runScript } from "./lib/manifest";

// One-off: carve the grammatical verb machinery (ser/estar/haber/hay, the
// perfect auxiliary, and the modals) out of the thematic Verbs page into a
// dedicated "Special Verbs" topic. Tags every row in the nine source groups
// with `topic:verb-system`; `topics.ts` then bases the new topic on that tag
// and excludes it from Verbs (same mechanism as cognate / phrasal verbs).
//
//   npx tsx scripts/split-verb-system.ts            # dry run
//   npx tsx scripts/split-verb-system.ts --apply

const SYSTEM_TAG = "topic:verb-system";

const SOURCE_GROUPS = [
  "topic:verb-tobe-present",
  "topic:verb-tobe-past-future",
  "topic:verb-tobe-existence-hay",
  "topic:verb-ser-idioms",
  "topic:verb-estar-idioms",
  "topic:verb-perfect-auxiliary",
  "topic:verb-modal-ability",
  "topic:verb-modal-possibility",
  "topic:verb-modal-obligation",
];

async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await prisma.curriculumConcept.findMany({
    where: { collections: { some: { collectionName: { in: SOURCE_GROUPS } } } },
    include: { collections: { orderBy: { position: "asc" } } },
  });

  const todo = rows.filter(
    (row) => !row.collections.some((c) => c.collectionName === SYSTEM_TAG),
  );

  console.log(
    `${rows.length} rows in the nine source groups; ${todo.length} need ${SYSTEM_TAG}.`,
  );
  for (const row of todo) {
    console.log(`  ${row.id}  ${row.spanish} -> ${row.english}`);
  }

  if (!apply) {
    console.log("\nDry run. Re-run with --apply.");
    return;
  }

  await prisma.collection.upsert({
    where: { name: SYSTEM_TAG },
    create: { name: SYSTEM_TAG },
    update: {},
  });

  for (const row of todo) {
    await prisma.conceptCollection.create({
      data: {
        conceptId: row.id,
        collectionName: SYSTEM_TAG,
        position: row.collections.length,
      },
    });
  }

  await cleanOrphanCollections();
  console.log(`\nTagged ${todo.length} rows with ${SYSTEM_TAG}.`);
}

runScript(main);
