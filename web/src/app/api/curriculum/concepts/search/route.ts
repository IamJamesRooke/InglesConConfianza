import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

// Typeahead for the lesson builder's "concepts covered" field. Matches the query
// against Spanish or English text, skips the trash tier, and returns a short
// list ordered by catalog sequence.
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
    orderBy: { sortOrder: "asc" },
    take: 15,
  });

  return NextResponse.json({ concepts });
}
