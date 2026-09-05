import "dotenv/config";
import { prisma } from "../src/lib/database/prisma";

// One-off: the 32 comparative/superlative "==>" derivation rows added in
// Batch 3 carry no pos: tag, so they're invisible to the Adjectives topic
// page (baseCollection: "pos:adjective"). The verb-conjugation system's
// equivalent finite-form rows carry pos:verb alongside conjugation:/sense:,
// so mirror that here: add pos:adjective to these rows too.

async function main() {
  const rows = await prisma.curriculumConcept.findMany({
    where: {
      collections: { some: { collectionName: { startsWith: "degree:" } } },
      NOT: { collections: { some: { collectionName: "pos:adjective" } } },
    },
    select: { id: true, spanish: true, english: true, curriculumRole: true },
  });
  const lines = rows.map((r) =>
    [r.id, r.spanish, r.english, r.curriculumRole, "pos:adjective", "degree derivation rows need pos:adjective to appear on the Adjectives topic page"].join("\t"),
  );
  console.log(lines.join("\n"));
  console.error(`\n${lines.length} rows.`);
  await prisma.$disconnect();
}
main();
