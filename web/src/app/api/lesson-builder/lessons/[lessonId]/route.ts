import { NextResponse } from "next/server";

import {
  isLesson,
  mutateLessonFile,
} from "@/lib/lesson-builder/server/lesson-store";

type SaveLessonBody = {
  lesson: unknown;
  insertionIndex?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/lesson-builder/lessons/[lessonId]">,
) {
  const { lessonId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Lesson payload has an invalid shape." },
      { status: 400 },
    );
  }

  const { lesson, insertionIndex } = body as SaveLessonBody;
  if (
    !isLesson(lesson) ||
    lesson.id !== lessonId ||
    (insertionIndex !== undefined &&
      (!Number.isInteger(insertionIndex) || Number(insertionIndex) < 0))
  ) {
    return NextResponse.json(
      { error: "Lesson payload has an invalid shape." },
      { status: 400 },
    );
  }

  try {
    const lessonFile = await mutateLessonFile((currentLessonFile) => {
      const currentIndex = currentLessonFile.lessons.findIndex(
        (candidate) => candidate.id === lessonId,
      );
      const lessons = [...currentLessonFile.lessons];

      if (currentIndex >= 0) {
        lessons[currentIndex] = lesson;
      } else {
        const nextIndex = Math.min(
          typeof insertionIndex === "number" ? insertionIndex : lessons.length,
          lessons.length,
        );
        lessons.splice(nextIndex, 0, lesson);
      }

      return { ...currentLessonFile, lessons };
    });

    return NextResponse.json(lessonFile);
  } catch {
    return NextResponse.json(
      { error: "Unable to save lesson." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/lesson-builder/lessons/[lessonId]">,
) {
  const { lessonId } = await context.params;

  try {
    const lessonFile = await mutateLessonFile((currentLessonFile) => ({
      ...currentLessonFile,
      lessons: currentLessonFile.lessons.filter(
        (lesson) => lesson.id !== lessonId,
      ),
    }));

    return NextResponse.json(lessonFile);
  } catch {
    return NextResponse.json(
      { error: "Unable to delete lesson." },
      { status: 500 },
    );
  }
}
