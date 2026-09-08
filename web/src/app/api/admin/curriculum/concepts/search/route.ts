import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

// Typeahead for the lesson builder's "concepts covered" field. Matches the query
// against Spanish or English text — ignoring the bracketed placeholder part of a
// label like "querer [hacer algo]" so "hacer" does not match it — skips the
// trash tier, and orders by curriculum role then catalog sequence. The role
// order is the CurriculumRole enum's declaration order in schema.prisma, which
// Postgres sorts by, so nothing here hardcodes the tier list.
type Row = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ concepts: [] });
  }

  const like = `%${query}%`;
  const concepts = await prisma.$queryRaw<Row[]>`
    SELECT id, spanish, english, curriculum_role AS "curriculumRole"
    FROM curriculum_concepts
    WHERE curriculum_role <> 'Trash'
      AND (
        regexp_replace(spanish, '\\[.*?\\]', '', 'g') ILIKE ${like}
        OR regexp_replace(english, '\\[.*?\\]', '', 'g') ILIKE ${like}
      )
    ORDER BY curriculum_role ASC, sort_order ASC
    LIMIT 30
  `;

  return NextResponse.json({ concepts });
}
