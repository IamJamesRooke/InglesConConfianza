import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

// Typeahead for the lesson builder's "concepts covered" field. Matches the query
// against Spanish or English text, skips the trash tier, and orders by curriculum
// role then catalog sequence. The role order is the CurriculumRole enum's
// declaration order in schema.prisma (core, supporting, reference, ...) — Postgres
// sorts enums that way, so nothing here hardcodes the tier list.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ concepts: [] });
  }

  const concepts = await prisma.curriculumConcept.findMany({
    where: {
      curriculumRole: { not: "trash" },
      OR: [
        { spanish: { contains: query, mode: "insensitive" } },
        { english: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      spanish: true,
      english: true,
      curriculumRole: true,
    },
    // Ordered core-first, so cap generously enough that lower tiers still show
    // when a query has many high-tier matches.
    orderBy: [{ curriculumRole: "asc" }, { sortOrder: "asc" }],
    take: 30,
  });

  return NextResponse.json({ concepts });
}
