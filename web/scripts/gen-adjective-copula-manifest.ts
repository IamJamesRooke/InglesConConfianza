import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// One-off generator for docs/curation/curation-2026-09-04-adjectives-copula-bracket.tsv
// — not part of the standing script set. Brackets the copula verb (Spanish)
// and its English equivalent on both sides, per the approved "Nouns &
// Adjectives topics" plan. Three groups:
//  1. ser/estar/tener-prefixed rows (298): bracket + English "to be", tener
//     rows also get grammar:tener-adjective.
//  2. other-copula rows (28, hand-classified below): a different verb already
//     carries the predicate (sentirse, ponerse, volverse, parecer, verse,
//     seguir, quedarse, permanecer, hacer-weather, dejar, valer) — bracket
//     that verb and its English equivalent, no new grammar tag.
//  3. genuinely bare adjective forms (44): left untouched entirely, omitted
//     from the manifest.

const OTHER_COPULA: Record<string, { spanish: string; english: string }> = {
  zq5mq3d7ig: { spanish: "[ponerse] [adjetivo]", english: "[to get] [adjective]" },
  "8j8l76vwci": { spanish: "[ponerse] [adjetivo]", english: "[to become] [adjective]" },
  pft3m3975v: { spanish: "[volverse] [adjetivo]", english: "[to become] [adjective]" },
  dpa3heuq6k: { spanish: "[volverse] [adjetivo]", english: "[to get] [adjective]" },
  mm9jg6sy57: { spanish: "[sentirse] [adjetivo]", english: "[to feel] [adjective]" },
  "160kt5bnxh": { spanish: "[sentirse] extraño/a", english: "[to feel] weird" },
  crw3ztzb94: { spanish: "[sentirse] solo/a", english: "[to feel] lonely" },
  s2fkpkgyh0: { spanish: "[sentirse] impotente (sin poder ayudar)", english: "[to feel] helpless" },
  "3m5g5fxdnu": { spanish: "[sentirse] impotente (sin poder)", english: "[to feel] powerless" },
  j6rsrji1gk: { spanish: "[quedarse] callado/a", english: "[to keep] quiet" },
  nwxm8j7bvp: { spanish: "[quedarse] dormido/a", english: "[to fall] asleep" },
  "8kyqh0y19m": { spanish: "[parecer] [adjetivo]", english: "[to seem] [adjective]" },
  vydnn6gthe: { spanish: "[parecer] [adjetivo] (apariencia visible)", english: "[to look] [adjective]" },
  "5wxhecilm0": { spanish: "[verse] [adjetivo]", english: "[to look] [adjective]" },
  "90cs3915m5": { spanish: "[seguir] [adjetivo]", english: "[to remain] [adjective]" },
  inefeucgpz: { spanish: "[seguir] sin [algo]", english: "[to remain] [adjective]" },
  "5ci6qn0ar4": { spanish: "[permanecer] sentado/a", english: "[to remain] seated" },
  "02s3tysyuj": { spanish: "[hace] sol", english: "[it is] sunny" },
  c0zsrdafq1: { spanish: "[hace] viento", english: "[it is] windy" },
  "2qn9jrryai": { spanish: "[dejar] [algo] claro", english: "[to make] [something] clear" },
  bilb51sumb: { spanish: "[dejar] a [alguien] [en un estado]", english: "[to make] [somebody] [an adjective]" },
  tzy94y3hmu: { spanish: "[dejar] a [alguien] [en un estado]", english: "[to leave] [somebody] [in a state]" },
  "22weg7i165": { spanish: "no [tener] significado", english: "[to be] meaningless" },
  jthckb9ofh: { spanish: "no [valer]", english: "not [to be] fair" },
  "16pwsfcg7n": { spanish: "[valer] hasta [una fecha]", english: "[to be] valid until [a date]" },
  c35bwq6oiy: { spanish: "[valer] para [hacer algo]", english: "[to be] useful for [doing something]" },
  fp17uyuvne: { spanish: "ya no [tener] hambre", english: "[to be] full" },
  "6ljzqgv7vh": { spanish: "[perderse]", english: "[to get] lost" },
};

async function main() {
  const adjs = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      collections: { some: { collectionName: "pos:adjective" } },
    },
    select: { id: true, spanish: true, english: true, curriculumRole: true },
    orderBy: { spanish: "asc" },
  });

  const lines: string[] = [];
  for (const row of adjs) {
    const m = row.spanish.match(/^(ser|estar|tener)\b/);
    if (m) {
      const verb = m[1];
      const spanish = row.spanish.replace(/^(ser|estar|tener)\b\s*/, `[${verb}] `);
      const english = /^to\s+be\b/.test(row.english)
        ? row.english.replace(/^to\s+be\b\s*/, "[to be] ")
        : row.english; // a handful of ser/estar rows gloss without "to be" wording
      const extra = verb === "tener" ? ["grammar:tener-adjective"] : [];
      lines.push(
        [row.id, spanish, english, row.curriculumRole, extra.join("|"), "adjective copula bracketing batch"].join("\t"),
      );
      continue;
    }
    const other = OTHER_COPULA[row.id];
    if (other) {
      lines.push(
        [row.id, other.spanish, other.english, row.curriculumRole, "", "adjective copula bracketing batch"].join("\t"),
      );
    }
    // else: bare adjective form, left untouched, omitted from manifest.
  }

  console.log(lines.join("\n"));
  console.error(`\n${lines.length} rows emitted (of ${adjs.length} total pos:adjective rows).`);
  await prisma.$disconnect();
}

main();
