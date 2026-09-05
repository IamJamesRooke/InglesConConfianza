import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// One-off generator for docs/curation/curation-2026-09-04-nouns-gender-bracket.tsv
// — not part of the standing script set (no package.json entry). Derives
// `gender:` from the noun's current leading article and rewrites `spanish` to
// bracket that article, per docs/curation plan "Nouns & Adjectives topics".

// Hand classification for the 39 rows whose article isn't a plain
// el/la/el-la prefix (los/las plurals, un/una indefinites, lo-neuter, and the
// 26 zero-article rows) — see exploration notes in the approved plan.
const OVERRIDES: Record<string, { spanish: string; gender: string }> = {
  // los/las plurals — the article still marks gender.
  zdriia6k4w: { spanish: "[los] asuntos de actualidad", gender: "masculine" },
  z34w2rwul0: { spanish: "[los] deberes", gender: "masculine" },
  n4uu5aergm: { spanish: "[los] fondos", gender: "masculine" },
  "43qxgonexo": { spanish: "[los] hombres", gender: "masculine" },
  "0bnotvdld0": { spanish: "[los] niños", gender: "masculine" },
  f3upgnrzbs: { spanish: "[las] finanzas", gender: "feminine" },
  lafn6elemf: { spanish: "[las] mujeres", gender: "feminine" },
  "2tpq2h0jq0": { spanish: "[las] personas", gender: "feminine" },

  // un/una indefinites — same idea, indefinite article instead of definite.
  a980sdxliv: { spanish: "[un] minuto", gender: "masculine" },
  k5lmf4gy2r: { spanish: "[un] segundo", gender: "masculine" },
  dqtov5ojkf: { spanish: "[una] hora", gender: "feminine" },
  // both genders spelled out with distinct suffixes, not a shared form —
  // still "common" for browsing purposes (row covers both genders).
  u40vouf4og: { spanish: "[un] conocido / [una] conocida", gender: "common" },
  hl2al0rw9y: { spanish: "[un] extraño o [una] extraña", gender: "common" },

  // neuter "lo" — not masculine/feminine.
  s1v75khflh: { spanish: "[lo] contrario", gender: "neuter" },

  // days of the week: "el lunes" etc. is the natural, common usage.
  "7cm192p84m": { spanish: "[el] domingo", gender: "masculine" },
  kpscphg0bi: { spanish: "[el] jueves", gender: "masculine" },
  b5bellazox: { spanish: "[el] lunes", gender: "masculine" },
  dmds1ataaw: { spanish: "[el] martes", gender: "masculine" },
  vdmuuz7ozq: { spanish: "[el] miércoles", gender: "masculine" },
  dtrbrlnt7k: { spanish: "[el] sábado", gender: "masculine" },
  hwpige4nqc: { spanish: "[el] viernes", gender: "masculine" },

  // "tiempo" (time) is naturally "el tiempo".
  h8dt61iqmg: { spanish: "[el] tiempo", gender: "masculine" },

  // months: idiomatically article-less ("en abril", not "en el abril") —
  // leave spanish untouched, no article to bracket.
  "9dultormoy": { spanish: "abril", gender: "invariant" },
  "0j3b8dq5ol": { spanish: "agosto", gender: "invariant" },
  i9xzj22sh8: { spanish: "diciembre", gender: "invariant" },
  q9tuqos4be: { spanish: "enero", gender: "invariant" },
  jwz58gd92h: { spanish: "febrero", gender: "invariant" },
  "1y17lp2kym": { spanish: "julio", gender: "invariant" },
  "4vqpc9njvy": { spanish: "junio", gender: "invariant" },
  z4zh0vz9g7: { spanish: "marzo", gender: "invariant" },
  "8t5gcxfjja": { spanish: "mayo", gender: "invariant" },
  iv25rev3nx: { spanish: "noviembre", gender: "invariant" },
  "9q7ietsmy0": { spanish: "octubre", gender: "invariant" },
  up01db9skk: { spanish: "septiembre", gender: "invariant" },

  // language names: usually used bare ("hablo español").
  "0r3hwsp9ge": { spanish: "español", gender: "invariant" },
  "9rswx58qx1": { spanish: "inglés", gender: "invariant" },

  // genuinely genderless indefinite / verbal-construction rows — not
  // headword nouns that take an article at all.
  "1o17mlmefy": { spanish: "algo muy importante", gender: "invariant" },
  fj5mrpoqkv: { spanish: "hacer un llamado a [algo]", gender: "invariant" },
  sx2usy0kyp: { spanish: "parecer [un sustantivo]", gender: "invariant" },
};

async function main() {
  const nouns = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      collections: { some: { collectionName: "pos:noun" } },
    },
    select: { id: true, spanish: true, english: true, curriculumRole: true },
    orderBy: { spanish: "asc" },
  });

  const lines: string[] = [];
  for (const row of nouns) {
    const override = OVERRIDES[row.id];
    let spanish: string;
    let gender: string;
    if (override) {
      spanish = override.spanish;
      gender = override.gender;
    } else {
      const m = row.spanish.match(/^(el\/la|el|la)\b/);
      if (!m) {
        console.error(`UNHANDLED (no override, no plain article): ${row.id}  ${row.spanish}`);
        continue;
      }
      const article = m[1];
      spanish = row.spanish.replace(/^(el\/la|el|la)\b\s*/, `[${article}] `);
      gender = article === "el" ? "masculine" : article === "la" ? "feminine" : "common";
    }
    if (spanish === row.spanish && gender !== "invariant") {
      // sanity: every non-invariant row should actually gain a bracket
      console.error(`WARNING: no bracket added but gender=${gender}: ${row.id}  ${row.spanish}`);
    }
    lines.push(
      [row.id, spanish, row.english, row.curriculumRole, `gender:${gender}`, "noun gender + article bracketing batch"].join("\t"),
    );
  }

  console.log(lines.join("\n"));
  console.error(`\n${lines.length} / ${nouns.length} rows emitted.`);
  await prisma.$disconnect();
}

main();
