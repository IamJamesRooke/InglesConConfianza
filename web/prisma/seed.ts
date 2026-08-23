import "dotenv/config";

import { loadSeedData, seedCurriculumDatabase } from "../scripts/curriculum-data";
import { prisma } from "../src/lib/database/prisma";

async function main() {
  const { curriculum, review, sources } = await loadSeedData();
  await seedCurriculumDatabase(prisma, curriculum, review, sources);
  console.log(
    `Seeded ${curriculum.concepts.length} concepts, ${review.batches.length} review batches, and ${sources.documents.length} mapping source documents.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
