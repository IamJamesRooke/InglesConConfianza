import "dotenv/config";
import assert from "node:assert/strict";
import { buildSourceArchive } from "./mapping-source-capture";
import { exportCurriculumDatabase } from "./curriculum-data";
import { prisma } from "../src/lib/database/prisma";
async function main() {
  const [expected, exported] = await Promise.all([buildSourceArchive("docs/curriculum/cognates", "cognates"), exportCurriculumDatabase(prisma)]);
  const paths = new Set(expected.documents.map((doc) => doc.path));
  assert.deepStrictEqual(exported.sources.documents.filter((doc) => doc.pillar === "cognates"), expected.documents);
  assert.deepStrictEqual(exported.sources.entries.filter((entry) => paths.has(entry.documentPath)), expected.entries);
  console.log(`Cognate capture exactly matches all ${expected.documents.length} files and ${expected.entries.length} extracted rows.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
