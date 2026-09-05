import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// One-off generator for docs/curation/curation-2026-09-04-adjectives-degree.tsv
// — not part of the standing script set. Retrofits the new `degree:` facet
// onto the comparative/superlative content that already exists in the
// catalog (the "X ==> Y" derivation rows under grammar:comparative /
// grammar:superlative, plus two standalone irregular forms), rather than
// authoring new rows — see the approved "Nouns & Adjectives topics" plan,
// which found this content already built out further than expected.

const STANDALONE: Record<string, string> = {
  wx26juw5jo: "irregular-comparative", // peor | worse
  qoipe9f8y1: "irregular-superlative", // el/la peor | the worst
};

async function main() {
  const rows = await prisma.curriculumConcept.findMany({
    where: {
      OR: [
        { collections: { some: { collectionName: "grammar:comparative" } } },
        { collections: { some: { collectionName: "grammar:superlative" } } },
        { id: { in: Object.keys(STANDALONE) } },
      ],
    },
    select: { id: true, spanish: true, english: true, curriculumRole: true, collections: { select: { collectionName: true } } },
  });

  const lines: string[] = [];
  for (const row of rows) {
    const tags = row.collections.map((c) => c.collectionName);
    const isComp = tags.includes("grammar:comparative");
    const isSuper = tags.includes("grammar:superlative");
    const hasEr = tags.includes("morphology:suffix-er");
    const hasEst = tags.includes("morphology:suffix-est");
    const hasElLaMas = row.spanish.includes("el/la más");
    const hasMas = /\bmás\b/.test(row.spanish) && !hasElLaMas;

    let degree = STANDALONE[row.id];
    if (!degree) {
      if (isComp) degree = hasEr ? "comparative-er" : hasMas ? "comparative-more" : "irregular-comparative";
      if (isSuper) degree = hasEst ? "superlative-est" : hasElLaMas ? "superlative-most" : "irregular-superlative";
    }
    if (!degree) {
      console.error(`UNCLASSIFIED: ${row.id}  ${row.spanish}`);
      continue;
    }
    lines.push(
      [row.id, row.spanish, row.english, row.curriculumRole, `degree:${degree}`, "degree facet retrofit onto existing comparative/superlative rows"].join("\t"),
    );
  }

  console.log(lines.join("\n"));
  console.error(`\n${lines.length} rows emitted.`);
  await prisma.$disconnect();
}

main();
