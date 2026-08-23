import "dotenv/config";
import type { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/database/prisma";
function option(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
async function main() {
  const search = option("--search"); const group = option("--group"); const pos = option("--part-of-speech"); const role = option("--role"); const falseOnly = process.argv.includes("--false-cognates");
  const where: Prisma.CognateItemWhereInput = { ...(search ? { OR: [{ spanish: { contains: search, mode: "insensitive" } }, { english: { contains: search, mode: "insensitive" } }] } : {}), ...(group ? { groupLabel: { contains: group, mode: "insensitive" } } : {}), ...(pos ? { partOfSpeech: pos } : {}), ...(role ? { curriculumRole: role as "core" | "supporting" | "reference" } : {}), ...(falseOnly ? { tags: { has: "false cognate" } } : {}) };
  const rows = await prisma.cognateItem.findMany({ where, take: Math.min(Number(option("--limit") ?? 100), 500), orderBy: { sortOrder: "asc" } });
  for (const row of rows) console.log(JSON.stringify(row));
  console.log(`Returned ${rows.length} cognates.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
