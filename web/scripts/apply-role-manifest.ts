import "dotenv/config";

import type { CurriculumRole } from "../src/lib/curriculum/types";
import { prisma } from "../src/lib/database/prisma";
import {
  logRoleCounts,
  manifestArgs,
  readManifestRows,
  runScript,
} from "./lib/manifest";

// Manifest columns: concept-id, new role, reason. Moves concepts between tiers.

const roles = new Set<CurriculumRole>(["core", "supporting", "reference", "trash"]);

type RoleChange = { conceptId: string; role: CurriculumRole };

async function main() {
  const { apply, paths } = manifestArgs();
  const rows = await readManifestRows(paths);

  const changes: RoleChange[] = [];
  const seen = new Set<string>();
  for (const { fields, line, source } of rows) {
    const [conceptId, role] = fields;
    const where = `${source}:${line}`;
    if (!conceptId || !role) {
      throw new Error(`${where}: expected "id<TAB>role<TAB>reason".`);
    }
    if (!roles.has(role as CurriculumRole)) {
      throw new Error(`${where}: unknown curriculum role "${role}".`);
    }
    if (seen.has(conceptId)) {
      throw new Error(`${where}: concept ${conceptId} listed twice.`);
    }
    seen.add(conceptId);
    changes.push({ conceptId, role: role as CurriculumRole });
  }

  const existing = await prisma.curriculumConcept.findMany({
    where: { id: { in: changes.map((change) => change.conceptId) } },
    select: { id: true, curriculumRole: true },
  });
  const existingById = new Map(existing.map((concept) => [concept.id, concept] as const));

  const missing = changes.filter((change) => !existingById.has(change.conceptId));
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
  console.log(`${effective.length} of ${changes.length} listed concepts change role.`);

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
  await logRoleCounts("Applied. Role counts are now:");
}

runScript(main);
