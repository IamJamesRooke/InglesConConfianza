import "dotenv/config";

import { loadSeedData, seedCurriculumDatabase } from "../scripts/curriculum-data";
import { prisma } from "../src/lib/database/prisma";

async function main() {
  const { curriculum, review } = await loadSeedData();
  await seedCurriculumDatabase(prisma, curriculum, review);
  console.log(
    `Seeded ${curriculum.concepts.length} concepts and ${review.batches.length} review batches.`,
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
