"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/admin/assert-admin";
import {
  applyLevelInline,
  type SetLevelInlineResult,
} from "@/lib/curriculum/server/apply-level-inline";
import { appendInlineLevelLine } from "@/lib/curriculum/server/inline-levels-log";
import type { CurriculumRole } from "@/lib/curriculum/types";
import { prisma } from "@/lib/database/prisma";
import { writeCurriculumSnapshots } from "../../../../scripts/export-curriculum-snapshots";

export type { SetLevelInlineResult };

// Server action behind the /admin/curriculum "set level in place" shortcut
// (Alt+0..5 on a focused/selected row): sets curriculumRole, records the
// change in docs/curation/archive/manifests/inline-levels.tsv (the same audit trail
// every other curation manifest uses), and immediately re-exports the
// prisma/seed-data snapshots so `npm run db:verify`/`db:test` stay clean
// without a separate manual export step. Admin-only by convention: only
// imported from /admin/curriculum's client component, same as the existing
// /api/admin/curriculum routes.
export async function setCurriculumLevelInline(
  conceptId: string,
  curriculumRole: CurriculumRole,
): Promise<SetLevelInlineResult> {
  await assertAdmin();

  const result = await applyLevelInline(conceptId, curriculumRole, {
    updateRole: (id, role) =>
      prisma.curriculumConcept.update({
        where: { id },
        data: { curriculumRole: role },
      }),
    appendLog: appendInlineLevelLine,
    exportSnapshots: () => writeCurriculumSnapshots(prisma, { apply: true }),
  });

  if (result.ok) {
    try {
      // Only meaningful inside a live Next.js request; throws when this
      // action is invoked outside one (a script, a test).
      revalidatePath("/admin/curriculum");
    } catch {
      // ignore — the table already calls router.refresh() after this resolves.
    }
  }

  return result;
}
