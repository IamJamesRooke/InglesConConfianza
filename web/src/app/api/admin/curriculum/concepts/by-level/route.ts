import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/assert-admin";
import { curriculumRoles, type CurriculumRole } from "@/lib/curriculum/types";
import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

// "Add from Level…" (round 2, item B — docs/design/lesson-builder-round-2.md):
// the owner is re-typing a level by hand into a module's syllabus. This route
// hands the builder every concept at one level so it can offer the ones no
// module has claimed yet (course-wide — exclusion of already-claimed ids
// happens client-side in syllabus-fill.ts, since the caller already has every
// module in hand). Same shape and `collections` subquery as the search
// route, minus the text-query filter: ordered by sort_order, capped at 500
// (Level 1 is ~100 rows in practice).
const SELECTABLE_ROLES = new Set<string>(
  curriculumRoles.filter((role) => role.startsWith("P")),
);

type Row = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
  collections: string[] | null;
};

export async function GET(request: Request) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const role = new URL(request.url).searchParams.get("role") ?? "";

  if (!SELECTABLE_ROLES.has(role)) {
    return NextResponse.json(
      { error: "`role` must be one of P1..P5." },
      { status: 400 },
    );
  }

  const concepts = await prisma.$queryRaw<Row[]>`
    SELECT id, spanish, english, curriculum_role AS "curriculumRole",
      (SELECT array_agg(cc.collection_name ORDER BY cc.position ASC)
         FROM concept_collections cc
        WHERE cc.concept_id = curriculum_concepts.id
          AND (cc.collection_name LIKE 'pos:%'
            OR cc.collection_name LIKE 'grammar:%'
            OR cc.collection_name LIKE 'construction:%'
            OR cc.collection_name = 'topic:time'
            OR cc.collection_name LIKE 'topic:noun-time-%')
      ) AS "collections"
    FROM curriculum_concepts
    WHERE curriculum_role = ${role as CurriculumRole}
    ORDER BY sort_order ASC
    LIMIT 500
  `;

  return NextResponse.json({ concepts });
}
