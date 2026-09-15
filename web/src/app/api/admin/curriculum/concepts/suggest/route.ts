import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  matchPairTermsToConcepts,
  type PairMatchCandidate,
} from "@/lib/lesson-builder/concept-suggestions";

export const dynamic = "force-dynamic";

// Auto-Covers (E5): given the terms a lesson's own pairs already name
// (extractLessonPairTerms in concept-suggestions.ts), find the curriculum
// concepts they name so LessonConceptsField can offer them as one-keystroke
// "Covers" suggestions instead of the teacher re-typing what the pairs
// already say. One broad query fetches every concept that could plausibly
// match any term (substring, cheap and indexable); matchPairTermsToConcepts
// then does the real exact/prefix decision in JS, same division of labor as
// the plain concept search route.
const MAX_TERMS = 40;

type Row = {
  id: string;
  spanish: string;
  english: string;
  role: string;
  exampleSpanish: string;
  exampleEnglish: string;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawTerms = (body as { terms?: unknown } | null)?.terms;
  if (!Array.isArray(rawTerms)) {
    return NextResponse.json({ error: "`terms` must be an array of strings." }, { status: 400 });
  }

  const terms = [
    ...new Set(
      rawTerms
        .filter((term): term is string => typeof term === "string")
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
    ),
  ].slice(0, MAX_TERMS);

  if (terms.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // ILIKE here is only a cheap, indexable candidate *pool* — the loose net
  // the owner reported was matching on ("something" hitting "to have
  // [something] repaired") lived in this query before it fed straight to the
  // UI. `matchPairTermsToConcepts` now does the real whole-term/example
  // decision in JS below, so a broad pool here is safe: nothing ILIKE finds
  // that fails that check is ever returned.
  const conditions = terms.map((term) => {
    const like = `%${term}%`;
    return Prisma.sql`(
      regexp_replace(spanish, '\\[.*?\\]', '', 'g') ILIKE ${like}
      OR regexp_replace(english, '\\[.*?\\]', '', 'g') ILIKE ${like}
      OR example_spanish ILIKE ${like}
      OR example_english ILIKE ${like}
    )`;
  });

  const candidates = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT id, spanish, english, curriculum_role AS "role",
      example_spanish AS "exampleSpanish", example_english AS "exampleEnglish"
    FROM curriculum_concepts
    WHERE curriculum_role <> 'Trash'
      AND (${Prisma.join(conditions, " OR ")})
    LIMIT 500
  `);

  const matches = matchPairTermsToConcepts(terms, candidates as PairMatchCandidate[]);

  return NextResponse.json({
    suggestions: matches.map(({ term, concept }) => ({ term, concept })),
  });
}
