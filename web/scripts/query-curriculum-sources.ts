import "dotenv/config";

import type { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/database/prisma";

function optionValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const search = optionValue("--search")?.trim();
  const direction = optionValue("--direction")?.trim();
  const hub = optionValue("--hub")?.trim();
  const tag = optionValue("--tag")?.trim();
  const requestedLimit = Number(optionValue("--limit") ?? 50);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 500)
    : 50;

  const where: Prisma.MappingSourceEntryWhereInput = {
    ...(search
      ? {
          OR: [
            { spanish: { contains: search, mode: "insensitive" } },
            { english: { contains: search, mode: "insensitive" } },
            { section: { contains: search, mode: "insensitive" } },
            { rawText: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...((direction || hub)
      ? {
          document: {
            ...(direction ? { direction } : {}),
            ...(hub ? { hub } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.mappingSourceEntry.findMany({
    where,
    take: limit,
    orderBy: [
      { document: { sortOrder: "asc" } },
      { position: "asc" },
    ],
    include: {
      document: { select: { direction: true, hub: true } },
    },
  });

  for (const row of rows) {
    console.log(
      JSON.stringify({
        path: row.documentPath,
        line: row.lineNumber,
        direction: row.document.direction,
        hub: row.document.hub,
        section: row.section,
        spanish: row.spanish,
        english: row.english,
        cells: row.cells,
        tags: row.tags,
      }),
    );
  }
  console.log(`Returned ${rows.length} archived curriculum source rows.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
