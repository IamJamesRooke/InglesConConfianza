import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";
import { rankConceptSearchResults } from "@/lib/lesson-builder/concept-search-rank";

export const dynamic = "force-dynamic";

// Typeahead for the lesson builder's "concepts covered" field. Matches the query
// against Spanish or English text — ignoring the bracketed placeholder part of a
// label like "querer [hacer algo]" so "hacer" does not match it — and skips the
// trash tier. Concepts are stored as infinitives (e.g. "estar [en un lugar]"),
// but a teacher naturally types the conjugated form she's about to teach (e.g.
// "estoy"), which never appears in the label — so the query is also matched
// against the concept's own bilingual example sentence (word-start match, no
// bracket-stripping — examples aren't templated). SQL does the (cheap,
// indexable) substring filter and pulls a wide candidate pool;
// rankConceptSearchResults does the actual ordering — exact, then prefix, then
// word-boundary, then substring match on a label, then (lowest) a match found
// only in the example, ties broken by curriculum priority then label length —
// so "with" surfaces the standalone preposition before "to work with
// [somebody]", and "estoy" still surfaces "estar [en un estado]" (example
// "Estoy cansado.") below any label match. See
// src/lib/lesson-builder/concept-search-rank.ts.
type Row = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
  exampleSpanish: string;
  exampleEnglish: string;
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ concepts: [] });
  }

  const like = `%${query}%`;
  // Examples match at word starts only ("melo" must not hit "gemelos");
  // \m is Postgres' word-start anchor. The query is regex-escaped.
  const wordStart = `\\m${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
  const candidates = await prisma.$queryRaw<Row[]>`
    SELECT id, spanish, english, curriculum_role AS "curriculumRole",
      example_spanish AS "exampleSpanish", example_english AS "exampleEnglish"
    FROM curriculum_concepts
    WHERE curriculum_role <> 'Trash'
      AND (
        regexp_replace(spanish, '\\[.*?\\]', '', 'g') ILIKE ${like}
        OR regexp_replace(english, '\\[.*?\\]', '', 'g') ILIKE ${like}
        OR example_spanish ~* ${wordStart}
        OR example_english ~* ${wordStart}
      )
    ORDER BY curriculum_role ASC, sort_order ASC
    LIMIT 200
  `;

  const concepts = rankConceptSearchResults(candidates, query).slice(0, 30);

  return NextResponse.json({ concepts });
}
