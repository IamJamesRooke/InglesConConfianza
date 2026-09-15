import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";
import { rankConceptSearchResults } from "@/lib/lesson-builder/concept-search-rank";

export const dynamic = "force-dynamic";

// Typeahead for the lesson builder's "concepts covered" field. Matches the query
// against Spanish or English text — ignoring the bracketed placeholder part of a
// label like "querer [hacer algo]" so "hacer" does not match it — and skips the
// trash tier. SQL does the (cheap, indexable) substring filter and pulls a wide
// candidate pool; rankConceptSearchResults does the actual ordering — exact,
// then prefix, then word-boundary, then substring match, ties broken by
// curriculum priority then label length — so "with" surfaces the standalone
// preposition before "to work with [somebody]". See
// src/lib/lesson-builder/concept-search-rank.ts.
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
  const candidates = await prisma.$queryRaw<Row[]>`
    SELECT id, spanish, english, curriculum_role AS "curriculumRole"
    FROM curriculum_concepts
    WHERE curriculum_role <> 'Trash'
      AND (
        regexp_replace(spanish, '\\[.*?\\]', '', 'g') ILIKE ${like}
        OR regexp_replace(english, '\\[.*?\\]', '', 'g') ILIKE ${like}
      )
    ORDER BY curriculum_role ASC, sort_order ASC
    LIMIT 200
  `;

  const concepts = rankConceptSearchResults(candidates, query).slice(0, 30);

  return NextResponse.json({ concepts });
}
