import "dotenv/config";

import { prisma } from "../src/lib/database/prisma";

async function main() {
  const [documents, entries, byteTotal, directions, hubs] = await Promise.all([
    prisma.mappingSourceDocument.count(),
    prisma.mappingSourceEntry.count(),
    prisma.mappingSourceDocument.aggregate({ _sum: { byteLength: true } }),
    prisma.mappingSourceDocument.groupBy({
      by: ["direction"],
      _count: { _all: true },
      orderBy: { direction: "asc" },
    }),
    prisma.mappingSourceDocument.groupBy({
      by: ["direction", "hub"],
      _count: { _all: true },
    }),
  ]);

  console.log(`Archived curriculum source documents: ${documents}`);
  console.log(`Archived curriculum source bytes: ${byteTotal._sum.byteLength ?? 0}`);
  console.log(`Extracted curriculum source rows: ${entries}`);
  console.log(`Queryable hubs: ${hubs.length}`);
  for (const direction of directions) {
    console.log(`${direction.direction}: ${direction._count._all}`);
  }
  console.log("PostgreSQL curriculum source inventory passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
