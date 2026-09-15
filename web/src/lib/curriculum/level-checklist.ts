// The Level-1 checklist join, pulled out as a pure function so it can be unit
// tested without a database. Spec: docs/curation/level-1-checklist.md.
//   must-teach = concepts whose curriculumRole is in P1..P<maxLevel>
//   taught     = concept ids referenced by any lesson's Covers list
//   checklist  = the join of the two — nothing new is stored.
import { rolesUpToLevel, type CurriculumLevel, type CurriculumRole } from "@/lib/curriculum/types";

export type LevelChecklistRow = {
  id: string;
  curriculumRole: CurriculumRole;
};

export type LevelChecklistSummary = {
  maxLevel: CurriculumLevel;
  taught: number;
  total: number;
};

// `rows` may be pre-filtered to the level ceiling (as the DB query does) or
// not — this function re-applies the ceiling itself, so it's safe either way
// and is the single source of truth for "what counts as must-teach at level N".
export function summarizeLevelChecklist(
  rows: readonly LevelChecklistRow[],
  maxLevel: CurriculumLevel,
  coveredIds: ReadonlySet<string> | readonly string[],
): LevelChecklistSummary {
  const covered =
    coveredIds instanceof Set ? coveredIds : new Set(coveredIds);
  const levelRoles = new Set(rolesUpToLevel(maxLevel));
  let total = 0;
  let taught = 0;
  for (const row of rows) {
    if (!levelRoles.has(row.curriculumRole)) continue;
    total += 1;
    if (covered.has(row.id)) taught += 1;
  }
  return { maxLevel, taught, total };
}

// The "what should I teach next?" list: must-teach rows at the ceiling with no
// covering lesson, in the same order they were given.
export function untaughtAtLevel<T extends LevelChecklistRow>(
  rows: readonly T[],
  maxLevel: CurriculumLevel,
  coveredIds: ReadonlySet<string> | readonly string[],
): T[] {
  const covered =
    coveredIds instanceof Set ? coveredIds : new Set(coveredIds);
  const levelRoles = new Set(rolesUpToLevel(maxLevel));
  return rows.filter(
    (row) => levelRoles.has(row.curriculumRole) && !covered.has(row.id),
  );
}
