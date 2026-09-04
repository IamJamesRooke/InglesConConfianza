import { NextResponse } from "next/server";

import { isLesson, mutateLessonFile } from "@/lib/lesson-builder/server/lesson-store";

type SaveLessonBody = {
  lesson: unknown;
  moduleId?: unknown;
  insertionIndex?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/lesson-builder/lessons/[lessonId]">,
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

  const { lesson, moduleId, insertionIndex } = body as SaveLessonBody;
  if (
    !isLesson(lesson) ||
    lesson.id !== lessonId ||
    (moduleId !== undefined && typeof moduleId !== "string") ||
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
      const existingIndex = currentLessonFile.lessons.findIndex(
        (candidate) => candidate.id === lessonId,
      );

      // Existing lesson: replace its body, module membership is untouched.
      if (existingIndex >= 0) {
        const lessons = [...currentLessonFile.lessons];
        lessons[existingIndex] = lesson;
        return { ...currentLessonFile, lessons };
      }

      // New lesson: add to the pool and into a module's lessonIds. reconcile
      // then fixes the `lessons` order.
      const targetModuleId =
        typeof moduleId === "string" &&
        currentLessonFile.modules.some((module) => module.id === moduleId)
          ? moduleId
          : currentLessonFile.modules[currentLessonFile.modules.length - 1]?.id;

      const modules = currentLessonFile.modules.map((module) => {
        if (module.id !== targetModuleId) return module;
        const at = Math.min(
          typeof insertionIndex === "number"
            ? insertionIndex
            : module.lessonIds.length,
          module.lessonIds.length,
        );
        return {
          ...module,
          lessonIds: module.lessonIds.toSpliced(at, 0, lessonId),
        };
      });

      return {
        ...currentLessonFile,
        modules,
        lessons: [...currentLessonFile.lessons, lesson],
      };
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
  context: RouteContext<"/api/admin/lesson-builder/lessons/[lessonId]">,
) {
  const { lessonId } = await context.params;

  try {
    const lessonFile = await mutateLessonFile((currentLessonFile) => ({
      ...currentLessonFile,
      modules: currentLessonFile.modules.map((module) => ({
        ...module,
        lessonIds: module.lessonIds.filter((id) => id !== lessonId),
      })),
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
