import "dotenv/config";

import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "../src/generated/prisma/client";

import { generateConceptId } from "../src/lib/curriculum/id";
import { prisma } from "../src/lib/database/prisma";

async function main() {
  const apply = process.argv.includes("--apply");

  const concepts = await prisma.curriculumConcept.findMany({
    select: { id: true },
  });

  const seen = new Set<string>();
  const mapping = concepts.map(({ id: oldId }) => {
    let newId = generateConceptId();
    while (seen.has(newId)) {
      newId = generateConceptId();
    }
    seen.add(newId);
    return { oldId, newId };
  });

  const candidates = await prisma.reviewCandidate.findMany({
    where: { existingConceptId: { not: null } },
    select: { batchId: true, id: true, existingConceptId: true },
  });

  console.log(
    `Prepared ${mapping.length} concept id reassignments and ${candidates.length} review candidate references to update.`,
  );

  if (!apply) {
    console.log("Dry run: re-run with --apply to write changes.");
    return;
  }

  const logPath = path.join(
    __dirname,
    "..",
    "..",
    "docs",
    "history",
    `concept-id-reslug-${new Date().toISOString().slice(0, 10)}.json`,
  );
  await writeFile(logPath, `${JSON.stringify(mapping, null, 2)}\n`, "utf8");

  const conceptValues = Prisma.join(
    mapping.map(({ oldId, newId }) => Prisma.sql`(${oldId}, ${newId})`),
  );

  const byOldId = new Map(mapping.map((entry) => [entry.oldId, entry.newId]));
  const candidateUpdates = candidates
    .filter((candidate) => candidate.existingConceptId && byOldId.has(candidate.existingConceptId))
    .map((candidate) => ({
      batchId: candidate.batchId,
      id: candidate.id,
      newExistingId: byOldId.get(candidate.existingConceptId as string) as string,
    }));
  const candidateValues = candidateUpdates.length
    ? Prisma.join(
        candidateUpdates.map(
          (c) => Prisma.sql`(${c.batchId}, ${c.id}, ${c.newExistingId})`,
        ),
      )
    : null;

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        UPDATE curriculum_concepts AS c
        SET id = v.new_id
        FROM (VALUES ${conceptValues}) AS v(old_id, new_id)
        WHERE c.id = v.old_id
      `;

      if (candidateValues) {
        await tx.$executeRaw`
          UPDATE review_candidates AS rc
          SET existing_concept_id = v.new_existing_id
          FROM (VALUES ${candidateValues}) AS v(batch_id, id, new_existing_id)
          WHERE rc.batch_id = v.batch_id AND rc.id = v.id
        `;
      }
    },
    { timeout: 30000 },
  );

  console.log(`Applied. Mapping written to ${logPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
