import { NextResponse } from "next/server";

import { mutateLessonFile } from "@/lib/lesson-builder/server/lesson-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

      const lessonById = new Map(
        currentLessonFile.lessons.map((lesson) => [lesson.id, lesson]),
      );

      return {
        ...currentLessonFile,
        lessons: requestedIds.map((lessonId) => lessonById.get(lessonId)!),
      };
    });

    return NextResponse.json(lessonFile);
  } catch {
    return NextResponse.json(
      { error: "Unable to save lesson order." },
      { status: 409 },
    );
  }
}
