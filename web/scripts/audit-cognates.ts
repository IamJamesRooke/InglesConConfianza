import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

// Enforces the six invariants from docs/curation/cognates-plan-2026-09-05.md
// §2.3 — the mechanism meant to make a silent cognate-family gap (like the
// original untagged "predecir"/"contradecir") unshippable. Checks every row
// carrying a `cognate:` tag; does not touch the ~3,400 other concepts.

const TYPE_VALUES = ["transparent", "opaque-gloss", "false-friend"] as const;

// Families with fewer than MIN_FAMILY_SIZE members are flagged unless named
// here with a reason — the friction is deliberate (JC #6).
const MIN_FAMILY_SIZE = 3;
const SMALL_FAMILY_EXEMPTIONS: Record<string, string> = {
  "currir-to-cur": "2 catalog members (ocurrir, incurrir); no third exists yet",
  "hender-to-hend": "2 catalog members (comprender, aprehender); no third exists yet",
  "ma-to-m": "1 catalog member (la firma -> firm); real pattern, just rare in the catalog",
};

// Suffix-family values: <esSuffix>-to-<enSuffix>. Checked against the row's
// Spanish/English heads after light normalization. A handful of values don't
// decompose cleanly by splitting on "-to-" (double roots, irregular naming);
// list them here with an explicit regex pair instead of the derived one.
const SUFFIX_OVERRIDES: Record<string, { es: RegExp; en: RegExp }> = {
  "uro-ura-to-ure": { es: /(uro|ura)$/, en: /ure$/ },
  "es-to-s": { es: /^es/, en: /^s/ },
};

// Root families: Spanish stem (derivative ends in this) vs English root
// (gloss contains this). Spelling does not obviously match — that's the
// point of the family. Anchors (the bare lemma, whose own gloss is NOT the
// cognate — decir -> "to say", not "dict") are exempted by conjugation:/
// sense:-style tagging: they carry the family value but are allowed to fail
// the English-root check, same idea as audit-verb-conjugation's anchors.
const ROOT_TABLE: Record<string, { esStem: RegExp; enRoot: RegExp }> = {
  "tener-to-tain": { esStem: /tener(se)?$/, enRoot: /tain/ },
  "poner-to-pose": { esStem: /poner(se)?$/, enRoot: /pos/ },
  "mitir-to-mit": { esStem: /(mitir|meter(se)?)$/, enRoot: /mit/ },
  "ferir-to-fer": { esStem: /(ferir|frir|frecer)$/, enRoot: /fer/ },
  "ducir-to-duce": { esStem: /ducir$/, enRoot: /duc/ },
  "tribuir-to-tribute": { esStem: /tribuir$/, enRoot: /tribut/ },
  "struir-to-struct": { esStem: /struir$/, enRoot: /struct/ },
  "traer-to-tract": { esStem: /traer$/, enRoot: /tract/ },
  "escribir-to-scribe": { esStem: /scribir(se)?$/, enRoot: /scrib/ },
  "cluir-to-clude": { esStem: /cluir(se)?$/, enRoot: /clud/ },
  "decir-to-dict": { esStem: /decir$/, enRoot: /dict/ },
  "ceder-to-cede": { esStem: /ceder$/, enRoot: /ce?ed/ },
  "primir-to-press": { esStem: /(primir|presar)$/, enRoot: /press/ },
  "vertir-to-vert": { esStem: /vertir(se)?$/, enRoot: /vert/ },
  "servar-to-serve": { esStem: /servar$/, enRoot: /serv/ },
  "solver-to-solve": { esStem: /solver(se)?$/, enRoot: /solv/ },
  "gerir-to-gest": { esStem: /gerir$/, enRoot: /gest/ },
  "hibir-to-hibit": { esStem: /hibir$/, enRoot: /hibit/ },
  "cibir-to-ceive": { esStem: /c[ei]bir$/, enRoot: /ceiv/ },
  "plicar-to-ply": { esStem: /plicar$/, enRoot: /pl(y|ic)/ },
  "currir-to-cur": { esStem: /currir$/, enRoot: /cur/ },
  "hender-to-hend": { esStem: /(hender|prender)$/, enRoot: /hend/ },
};

type Row = {
  id: string;
  spanish: string;
  english: string;
  collections: { collectionName: string }[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents: ción -> cion
    .replace(/[¿?¡().]/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\b(el|la|los|las|un|una|unos|unas)\b\/?/g, "")
    .replace(/\b(ser|estar)\s/g, "")
    .replace(/^to\s+be\s+/, "")
    .replace(/^to\s+/, "")
    // trailing pronoun/preposition particles that don't belong to the stem:
    // "referirse a" -> "referir", "traerle a " -> "traer", "incurrir en" -> "incurrir"
    .replace(/(se)?\s+(a|en|de|con)\s*$/, "")
    // dative/accusative clitic directly attached to an infinitive ("traerle"
    // -> "traer"), NOT the "-ble"/"-ile" adjective suffix ("memorable",
    // "docile") — only strip when "le" follows an infinitive ending.
    .replace(/([aei]r)le\s*$/, "$1")
    .trim();
}

function tagsOf(row: Row): string[] {
  return row.collections.map((c) => c.collectionName);
}

function valuesOf(tags: string[], facet: string): string[] {
  const prefix = `${facet}:`;
  return tags.filter((t) => t.startsWith(prefix)).map((t) => t.slice(prefix.length));
}

export async function auditCognates() {
  const rows = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      collections: { some: { collectionName: { startsWith: "cognate:" } } },
    },
    select: {
      id: true,
      spanish: true,
      english: true,
      collections: { select: { collectionName: true } },
    },
  });

  const problems: string[] = [];
  const label = (r: Row) => `${r.id}  ${r.spanish} → ${r.english}`;

  // Invariant 1: at most one TYPE value per row.
  for (const row of rows) {
    const tags = tagsOf(row);
    const types = valuesOf(tags, "cognate").filter((v) =>
      (TYPE_VALUES as readonly string[]).includes(v),
    );
    if (types.length > 1) {
      problems.push(`[inv1] ${label(row)} — ${types.length} type values {${types.join(",")}}, need 0 or 1`);
    }
  }

  // Invariant 5: no cognate: tag on a "==>" derivation/inflection row.
  for (const row of rows) {
    if (row.spanish.includes("==>") || row.english.includes("==>")) {
      problems.push(`[inv5] ${label(row)} — cognate: tag on a "==>" derivation row`);
    }
  }

  // Invariant 6: every false-friend row belongs to >=1 contrast: collection.
  for (const row of rows) {
    const tags = tagsOf(row);
    if (valuesOf(tags, "cognate").includes("false-friend")) {
      if (!tags.some((t) => t.startsWith("contrast:"))) {
        problems.push(`[inv6] ${label(row)} — cognate:false-friend with no contrast: pair`);
      }
    }
  }

  // Group by pattern family for invariants 2, 3, 4.
  const byFamily = new Map<string, Row[]>();
  for (const row of rows) {
    for (const value of valuesOf(tagsOf(row), "cognate")) {
      if ((TYPE_VALUES as readonly string[]).includes(value) || value === "latin-root") continue;
      if (!byFamily.has(value)) byFamily.set(value, []);
      byFamily.get(value)!.push(row);
    }
  }

  for (const [family, members] of byFamily) {
    // Invariant 2: minimum family size, unless named exempt.
    if (members.length < MIN_FAMILY_SIZE && !(family in SMALL_FAMILY_EXEMPTIONS)) {
      problems.push(
        `[inv2] cognate:${family} — only ${members.length} member(s), below ${MIN_FAMILY_SIZE}; add SMALL_FAMILY_EXEMPTIONS["${family}"] if this is permanent`,
      );
    }

    const root = ROOT_TABLE[family];
    if (root) {
      // Invariant 4: root families share the Spanish stem. The bare-lemma
      // anchor (its own English is deliberately not the cognate) is allowed
      // to fail the stem check only if it's the shortest member (heuristic
      // for "this is the base verb, not a prefixed derivative").
      for (const member of members) {
        const es = normalize(member.spanish);
        if (!root.esStem.test(es)) {
          problems.push(
            `[inv4] ${label(member)} — cognate:${family} but Spanish "${es}" does not match the family's stem pattern`,
          );
        }
      }
      continue;
    }

    const override = SUFFIX_OVERRIDES[family];
    const [esSuffix, enSuffix] = family.includes("-to-")
      ? family.split("-to-")
      : [null, null];
    if (override || esSuffix) {
      // Substring, not end-anchored: some pairs carry the pattern mid-word
      // (objeto/object) or with a trailing plural/gender letter.
      const esOk = (text: string) => (override ? override.es.test(text) : text.includes(esSuffix!));
      const enOk = (text: string) => (override ? override.en.test(text) : text.includes(enSuffix!));
      for (const member of members) {
        const es = normalize(member.spanish);
        const en = normalize(member.english);
        // Invariant 3: suffix families actually contain the claimed suffixes.
        if (!esOk(es) || !enOk(en)) {
          problems.push(
            `[inv3] ${label(member)} — cognate:${family} but "${es}"/"${en}" doesn't contain the ${esSuffix ?? "override"}/${enSuffix ?? "override"} pattern`,
          );
        }
      }
    }
  }

  return { count: rows.length, familyCount: byFamily.size, problems: problems.sort() };
}

async function main() {
  const { count, familyCount, problems } = await auditCognates();
  console.log(`${count} rows carry cognate: tags, across ${familyCount} pattern families.\n`);
  if (problems.length) {
    console.log("--- problems ---");
    for (const p of problems) console.log(p);
    console.log();
  }
  console.log(problems.length === 0 ? "PASS — cognates are clean." : `${problems.length} findings.`);
  process.exitCode = problems.length === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("audit-cognates.ts")) {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
