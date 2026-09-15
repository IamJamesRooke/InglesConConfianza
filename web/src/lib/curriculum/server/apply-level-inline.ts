import { curriculumRoles, type CurriculumRole } from "@/lib/curriculum/types";

export type SetLevelInlineResult =
  | { ok: true; conceptId: string; curriculumRole: CurriculumRole }
  | { ok: false; error: string };

export type ApplyLevelInlineDeps = {
  // Throws (any error) when the concept doesn't exist.
  updateRole: (conceptId: string, curriculumRole: CurriculumRole) => Promise<unknown>;
  appendLog: (conceptId: string, curriculumRole: CurriculumRole) => Promise<void>;
  exportSnapshots: () => Promise<unknown>;
};

// The testable core of the "set level in place" action, with every effect
// (DB write, docs/curation/applied/inline-levels.tsv append, seed-data
// re-export) injected — so it can be exercised with fakes instead of hitting
// the real database and the real files on every test run. The "use server"
// wrapper in set-level-inline.ts supplies the real dependencies.
export async function applyLevelInline(
  conceptId: string,
  curriculumRole: CurriculumRole,
  deps: ApplyLevelInlineDeps,
): Promise<SetLevelInlineResult> {
  if (!curriculumRoles.includes(curriculumRole)) {
    return { ok: false, error: "Invalid curriculum role." };
  }

  try {
    await deps.updateRole(conceptId, curriculumRole);
  } catch {
    return { ok: false, error: "Concept not found." };
  }

  await deps.appendLog(conceptId, curriculumRole);
  await deps.exportSnapshots();

  return { ok: true, conceptId, curriculumRole };
}
