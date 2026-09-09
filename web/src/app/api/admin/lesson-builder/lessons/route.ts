import { NextResponse } from "next/server";

import { readConceptDisplays } from "@/lib/curriculum/server/concept-display";
import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

export async function GET() {
  try {
    const lessonFile = await readLessonFile();
    const conceptIds = lessonFile.lessons
      .flatMap((lesson) => lesson.concepts)
      .flatMap((concept) => (concept.conceptId ? [concept.conceptId] : []));
    const conceptDisplays = await readConceptDisplays(conceptIds).catch(() => ({}));

    return NextResponse.json({ ...lessonFile, conceptDisplays });
  } catch {
    return NextResponse.json(
      { error: "Unable to read a valid lessons file." },
      { status: 500 },
    );
  }
}
