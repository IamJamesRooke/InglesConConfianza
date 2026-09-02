import "dotenv/config";

import { readFile } from "node:fs/promises";

import type { CurriculumRole } from "../src/lib/curriculum/types";
import { prisma } from "../src/lib/database/prisma";

const roles = new Set<CurriculumRole>([
  "core",
  "supporting",
  "reference",
  "trash",
]);

type RoleChange = {
  conceptId: string;
  role: CurriculumRole;
  reason: string;
};

function parseManifest(contents: string, manifestPath: string): RoleChange[] {
  const changes: RoleChange[] = [];
  const seen = new Set<string>();

  contents.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      return;
    }

    const [conceptId, role, ...reasonParts] = rawLine.split("\t");
    const location = `${manifestPath}:${index + 1}`;

    if (!conceptId || !role) {
      throw new Error(`${location}: expected "id<TAB>role<TAB>reason".`);
    }
    if (!roles.has(role as CurriculumRole)) {
      throw new Error(`${location}: unknown curriculum role "${role}".`);
    }
    if (seen.has(conceptId)) {
      throw new Error(`${location}: concept ${conceptId} listed twice.`);
    }

    seen.add(conceptId);
    changes.push({
      conceptId,
      role: role as CurriculumRole,
      reason: reasonParts.join("\t").trim(),
    });
  });

  return changes;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const manifestPaths = process.argv
    .slice(2)
    .filter((argument) => argument !== "--apply");

  if (manifestPaths.length === 0) {
    throw new Error(
      "Usage: tsx scripts/apply-role-manifest.ts <manifest.tsv> [...] [--apply]",
    );
  }

  const changes: RoleChange[] = [];
  const seen = new Set<string>();
  for (const manifestPath of manifestPaths) {
    for (const change of parseManifest(
      await readFile(manifestPath, "utf8"),
      manifestPath,
    )) {
      if (seen.has(change.conceptId)) {
        throw new Error(
          `${manifestPath}: concept ${change.conceptId} already listed in an earlier manifest.`,
        );
      }
      seen.add(change.conceptId);
      changes.push(change);
    }
  }

  const existing = await prisma.curriculumConcept.findMany({
    where: { id: { in: changes.map((change) => change.conceptId) } },
    select: { id: true, curriculumRole: true, spanish: true, english: true },
  });
  const existingById = new Map(
    existing.map((concept) => [concept.id, concept] as const),
  );

  const missing = changes.filter(
    (change) => !existingById.has(change.conceptId),
  );
  if (missing.length > 0) {
    throw new Error(
      `Manifest references ${missing.length} unknown concepts: ${missing
        .slice(0, 5)
        .map((change) => change.conceptId)
        .join(", ")}`,
    );
  }

  const effective = changes.filter(
    (change) => existingById.get(change.conceptId)?.curriculumRole !== change.role,
  );
  const transitions = new Map<string, number>();
  for (const change of effective) {
    const from = existingById.get(change.conceptId)!.curriculumRole;
    const key = `${from} -> ${change.role}`;
    transitions.set(key, (transitions.get(key) ?? 0) + 1);
  }

  for (const [transition, count] of [...transitions].sort()) {
    console.log(`${transition.padEnd(26)} ${count}`);
  }
  console.log(
    `${effective.length} of ${changes.length} listed concepts change role.`,
  );

  if (!apply) {
    console.log("Dry run. Re-run with --apply to write the changes.");
    return;
  }

  await prisma.$transaction(
    effective.map((change) =>
      prisma.curriculumConcept.update({
        where: { id: change.conceptId },
        data: { curriculumRole: change.role },
      }),
    ),
  );

  const counts = await prisma.curriculumConcept.groupBy({
    by: ["curriculumRole"],
    _count: { _all: true },
  });
  console.log("Applied. Role counts are now:");
  for (const count of counts.sort((first, second) =>
    first.curriculumRole.localeCompare(second.curriculumRole),
  )) {
    console.log(`  ${count.curriculumRole.padEnd(12)} ${count._count._all}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
