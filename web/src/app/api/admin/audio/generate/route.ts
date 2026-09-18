import { NextResponse } from "next/server";

import { generateMissingClips } from "@/lib/audio/generate-clips";

// POST { lessonId?: string; blockId?: string } -> generates any missing
// audio clips for that lesson or block (everything, if both are omitted),
// writing the same files/manifest scripts/generate-audio.ts does. Lives
// under /api/admin/ so the admin guard (see the sibling routes in this
// tree) already covers it. See docs/design/speech.md "Generating clips".
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let body: unknown = {};

  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : undefined;
  const blockId = typeof body.blockId === "string" ? body.blockId : undefined;

  try {
    const result = await generateMissingClips({
      lessonIds: lessonId ? [lessonId] : undefined,
      blockIds: blockId ? [blockId] : undefined,
    });

    if (result.missingKey) {
      return NextResponse.json(
        { error: "GOOGLE_TTS_API_KEY not set" },
        { status: 503 },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to generate audio." },
      { status: 500 },
    );
  }
}
