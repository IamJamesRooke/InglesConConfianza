import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/assert-admin";
import { hasDatabase } from "@/lib/database/prisma";
import { readCollectionVocabulary } from "@/lib/curriculum/server/curriculum-store";

export const dynamic = "force-dynamic";

// Every collection name in use + its concept count, for the tag autocomplete.
export async function GET() {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  // No curriculum database on this deployment (docs/engineering/deploy.md).
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "No database configured on this deployment." },
      { status: 503 },
    );
  }

  const collections = await readCollectionVocabulary();
  return NextResponse.json({ collections });
}
