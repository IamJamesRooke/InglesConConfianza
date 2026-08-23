import "dotenv/config";

import { createHash } from "node:crypto";
import type { CurriculumRole } from "../src/lib/curriculum/types";
import { databaseDate } from "./curriculum-data";
import { buildSourceArchive } from "./mapping-source-capture";
import { prisma } from "../src/lib/database/prisma";

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}
function clean(value: string) { return value.replace(/\*\*/g, "").replace(/<br\s*\/?>.*/i, "").trim(); }
function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }
function tier(path: string) {
  if (path.includes("/01-direct/")) return "direct";
  if (path.includes("/02-spelling-patterns/")) return "spelling pattern";
  if (path.includes("/03-word-families/")) return "word family";
  if (path.includes("/04-memory-bridges/")) return "memory bridge";
  if (path.includes("/05-confusion-sets/")) return "confusion set";
  return "index";
}
function partOfSpeech(path: string, section: string, spanish: string, english: string) {
  const haystack = `${path} ${section}`.toLowerCase();
  if (haystack.includes("past-and-progressive")) return "participle-or-progressive";
  if (haystack.includes("/verbs/") || /^to\s+/i.test(english)) return "verb";
  if (haystack.includes("/adverbs/") || /mente$/i.test(spanish) || /ly$/i.test(english)) return "adverb";
  if (haystack.includes("noun cognate") || /^(el|la|los|las|un|una)\s/i.test(spanish)) return "noun";
  if (haystack.includes("adjective cognate")) return "adjective";
  if (haystack.includes("nouns-and-adjectives")) return "noun-or-adjective";
  if (haystack.includes("geography")) return "proper noun";
  return "expression";
}
function lexical(spanish: string, english: string) {
  return spanish.length <= 90 && english.length <= 90 &&
    !/[.!?]$/.test(spanish) && !/[.!?]$/.test(english) &&
    !spanish.includes("❌") && !english.includes("❌");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const archive = await buildSourceArchive("docs/curriculum/cognates", "cognates");
  const selectedDocument = archive.documents.find((doc) => doc.path.endsWith("/selected-verbs.md"));
  const selected = new Set<string>();
  for (const match of selectedDocument?.content.matchAll(/^-\s+(.+?)\s+→\s+\*\*(.+?)\*\*\s*$/gm) ?? []) {
    selected.add(`${clean(match[1]).toLowerCase()}\u0000${clean(match[2]).toLowerCase()}`);
  }
  const concepts = await prisma.curriculumConcept.findMany({ select: { id: true, spanish: true, english: true, curriculumRole: true } });
  const existing = new Map(concepts.map((concept) => [`${concept.spanish.toLowerCase()}\u0000${concept.english.toLowerCase()}`, concept]));
  const items = new Map<string, { spanish: string; english: string; partOfSpeech: string; cognateType: string; cognateStatus: string; groupLabel: string; pattern: string; curriculumRole: CurriculumRole; tags: string[]; sourcePaths: string[]; existingConceptId?: string }>();
  for (const entry of archive.entries) {
    if (!entry.spanish || !entry.english) continue;
    const spanish = clean(entry.spanish); const english = clean(entry.english);
    if (!spanish || !english || !lexical(spanish, english)) continue;
    const key = `${spanish.toLowerCase()}\u0000${english.toLowerCase()}`;
    const type = tier(entry.documentPath);
    const pos = partOfSpeech(entry.documentPath, entry.section, spanish, english);
    const status = type === "confusion set" ? "false-or-contextual" : "true";
    const concept = existing.get(key);
    const role: CurriculumRole = concept?.curriculumRole ?? (selected.has(key) ? "supporting" : "reference");
    const tags = unique(["cognate", type, status, pos, entry.section, ...(type === "confusion set" ? ["false cognate"] : []), ...(selected.has(key) ? ["selected high-frequency cognate"] : [])]);
    const previous = items.get(key);
    if (previous) {
      previous.tags = unique([...previous.tags, ...tags]); previous.sourcePaths = unique([...previous.sourcePaths, entry.documentPath]);
    } else items.set(key, { spanish, english, partOfSpeech: pos, cognateType: type, cognateStatus: status, groupLabel: entry.section || type, pattern: entry.section || type, curriculumRole: role, tags, sourcePaths: [entry.documentPath], ...(concept ? { existingConceptId: concept.id } : {}) });
  }
  const rows = [...items.values()].map((item) => ({ ...item, id: `${slug(item.spanish)}-${slug(item.english)}-${createHash("sha1").update(`${item.spanish}\0${item.english}`).digest("hex").slice(0, 8)}` }));
  const bytes = archive.documents.reduce((sum, doc) => sum + doc.byteLength, 0);
  if (!apply) { console.log(`Dry run: ${archive.documents.length} cognate files (${bytes} bytes), ${archive.entries.length} source rows, and ${rows.length} normalized cognate items.`); return; }
  await prisma.$transaction(async (tx) => {
    if (await tx.mappingSourceDocument.count({ where: { pillar: "cognates" } }) || await tx.cognateItem.count()) throw new Error("Cognate archive is not empty.");
    const maximum = await tx.mappingSourceDocument.aggregate({ _max: { sortOrder: true } });
    await tx.mappingSourceDocument.createMany({ data: archive.documents.map((doc, index) => ({ ...doc, capturedAt: databaseDate(doc.capturedAt), sortOrder: (maximum._max.sortOrder ?? -1) + index + 1 })) });
    for (let index = 0; index < archive.entries.length; index += 500) await tx.mappingSourceEntry.createMany({ data: archive.entries.slice(index, index + 500).map((entry) => ({ ...entry, spanish: entry.spanish ?? null, english: entry.english ?? null })) });
    await tx.cognateItem.createMany({ data: rows.map((row, sortOrder) => ({ ...row, existingConceptId: row.existingConceptId ?? null, sortOrder })) });
  }, { timeout: 120_000 });
  console.log(`Captured ${archive.documents.length} cognate files (${bytes} bytes), ${archive.entries.length} source rows, and ${rows.length} tagged cognate items.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
