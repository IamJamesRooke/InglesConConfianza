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
//
// `?scope=label` skips the example-sentence columns entirely — used by the
// sentence pair-field autocomplete (pair-field-autocomplete.tsx), where a
// teacher typing "Quiero" must not see "ser"/"estar" surfaced merely because
// their example sentences happen to contain "quiero" (owner regression,
// 2026-09-16). The Covers/syllabus typeahead (concept-typeahead.tsx) omits
// the flag and keeps matching examples too. The ranking code
// (rankConceptSearchResults) is shared either way — with `scope=label` every
// candidate row already matched a label, so it always ranks in tiers 0-3.
type Row = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
  exampleSpanish: string;
  exampleEnglish: string;
  // Bare part-of-speech token from the concept's first `pos:*` collection
  // (null when it has none): the lesson builder's syllabus card groups its
  // pills by it, and a pill added from this typeahead must be groupable
  // immediately, without a page reload (concept-typeahead.tsx records it
  // into the display lookup alongside spanish/english/role).
  pos: string | null;
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  // Label-only scope: see the block comment above.
  const labelOnly = params.get("scope") === "label";

  if (query.length < 2) {
    return NextResponse.json({ concepts: [] });
  }

  const like = `%${query}%`;
  const prefix = `${query}%`;
  // Examples match at word starts only ("melo" must not hit "gemelos");
  // \m is Postgres' word-start anchor. The query is regex-escaped.
  const wordStart = `\\m${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
  const candidates = await prisma.$queryRaw<Row[]>`
    SELECT id, spanish, english, curriculum_role AS "curriculumRole",
      example_spanish AS "exampleSpanish", example_english AS "exampleEnglish",
      (SELECT substring(cc.collection_name from 5)
         FROM concept_collections cc
        WHERE cc.concept_id = curriculum_concepts.id
          AND cc.collection_name LIKE 'pos:%'
        ORDER BY cc.position ASC
        LIMIT 1) AS "pos"
    FROM curriculum_concepts
    WHERE curriculum_role <> 'Trash'
      AND (
        regexp_replace(spanish, '\\[.*?\\]', '', 'g') ILIKE ${like}
        OR regexp_replace(english, '\\[.*?\\]', '', 'g') ILIKE ${like}
        OR (NOT ${labelOnly} AND (example_spanish ~* ${wordStart} OR example_english ~* ${wordStart}))
      )
    ORDER BY
      -- Exact and prefix label hits first, so a short query like "ser"
      -- (hundreds of substring hits: servir, conservar, "user"…) can never
      -- push the generic "ser → to be" row past the pool limit before the
      -- ranker sees it.
      (regexp_replace(spanish, '\\[.*?\\]', '', 'g') ILIKE ${query}
        OR regexp_replace(english, '\\[.*?\\]', '', 'g') ILIKE ${query}) DESC,
      (regexp_replace(spanish, '\\[.*?\\]', '', 'g') ILIKE ${prefix}
        OR regexp_replace(english, '\\[.*?\\]', '', 'g') ILIKE ${prefix}) DESC,
      curriculum_role ASC, sort_order ASC
    LIMIT 200
  `;

  const concepts = rankConceptSearchResults(candidates, query).slice(0, 30);

  return NextResponse.json({ concepts });
}
