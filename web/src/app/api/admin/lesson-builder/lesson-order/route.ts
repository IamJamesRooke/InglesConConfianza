import { NextResponse } from "next/server";

import { mutateLessonFile } from "@/lib/lesson-builder/server/lesson-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Reorder lessons by a flat permutation of every lesson id. Module membership is
// preserved: each module keeps its own lessons, re-sequenced to match the
// requested order. (Cross-module moves are done via PUT /course.)
export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    !Array.isArray(body.lessonIds) ||
    !body.lessonIds.every((lessonId) => typeof lessonId === "string") ||
    new Set(body.lessonIds).size !== body.lessonIds.length
  ) {
    return NextResponse.json(
      { error: "Lesson order payload has an invalid shape." },
      { status: 400 },
    );
  }

  try {
    const lessonFile = await mutateLessonFile((currentLessonFile) => {
      const requestedIds = body.lessonIds as string[];
      const currentIds = currentLessonFile.lessons.map((lesson) => lesson.id);

      if (
        requestedIds.length !== currentIds.length ||
        requestedIds.some((lessonId) => !currentIds.includes(lessonId))
      ) {
        throw new Error("Lesson order does not match the saved lessons.");
      }

      const rank = new Map(requestedIds.map((id, index) => [id, index]));
      const modules = currentLessonFile.modules.map((module) => ({
        ...module,
        lessonIds: [...module.lessonIds].sort(
          (a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0),
        ),
      }));

      return { ...currentLessonFile, modules };
    });

    return NextResponse.json(lessonFile);
  } catch {
    return NextResponse.json(
      { error: "Unable to save lesson order." },
      { status: 409 },
    );
  }
}
