import { NextResponse } from "next/server";

import { readCollectionVocabulary } from "@/lib/curriculum/server/curriculum-store";

export const dynamic = "force-dynamic";

// Every collection name in use + its concept count, for the tag autocomplete.
export async function GET() {
  const collections = await readCollectionVocabulary();
  return NextResponse.json({ collections });
}
