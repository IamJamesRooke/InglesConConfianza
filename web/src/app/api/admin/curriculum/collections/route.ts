import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/assert-admin";
import { readCollectionVocabulary } from "@/lib/curriculum/server/curriculum-store";

export const dynamic = "force-dynamic";

// Every collection name in use + its concept count, for the tag autocomplete.
export async function GET() {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const collections = await readCollectionVocabulary();
  return NextResponse.json({ collections });
}
