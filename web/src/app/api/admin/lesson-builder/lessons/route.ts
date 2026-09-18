import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/assert-admin";
import { readConceptDisplays } from "@/lib/curriculum/server/concept-display";
import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

export async function GET() {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  try {
    const lessonFile = await readLessonFile();
    // Lesson concepts plus every module's syllabus items — the syllabus card
    // shows the English target for each pill, so it needs their displays too.
    const conceptIds = [
      ...lessonFile.lessons.flatMap((lesson) => lesson.concepts),
      ...lessonFile.modules.flatMap((module) => [
        ...(module.syllabus?.main ?? []),
        ...(module.syllabus?.review ?? []),
      ]),
    ].flatMap((concept) => (concept.conceptId ? [concept.conceptId] : []));
    const conceptDisplays = await readConceptDisplays(conceptIds).catch(() => ({}));

    return NextResponse.json({ ...lessonFile, conceptDisplays });
  } catch {
    return NextResponse.json(
      { error: "Unable to read a valid lessons file." },
      { status: 500 },
    );
  }
}
