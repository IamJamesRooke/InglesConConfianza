import "dotenv/config";

import { loadSeedData, seedCurriculumDatabase } from "../scripts/curriculum-data";
import { prisma } from "../src/lib/database/prisma";

async function main() {
  const { curriculum, review, sources, cognates } = await loadSeedData();
  await seedCurriculumDatabase(prisma, curriculum, review, sources, cognates);
  console.log(
    `Seeded ${curriculum.concepts.length} concepts, ${review.batches.length} review batches, ${sources.documents.length} source documents, and ${cognates.items.length} cognates.`,
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
