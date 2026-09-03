import { NextResponse } from "next/server";

import { mutateLessonFile } from "@/lib/lesson-builder/server/lesson-store";
import type { LessonModule } from "@/lib/lesson-builder/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKeyConcept(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.conceptId === null || typeof value.conceptId === "string") &&
    typeof value.label === "string"
  );
}

function isModulePayload(value: unknown): value is LessonModule {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.name === null || typeof value.name === "string") &&
    Array.isArray(value.keyConcepts) &&
    value.keyConcepts.every(isKeyConcept) &&
    Array.isArray(value.lessonIds) &&
    value.lessonIds.every((id) => typeof id === "string")
  );
}

// The whole module structure — names, key concepts, and each module's ordered
// lessonIds. The Course view sends this on every change. The
// lesson bodies are untouched; reconcile then re-orders `lessons` to match.
export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    !Array.isArray(body.modules) ||
    body.modules.length === 0 ||
    !body.modules.every(isModulePayload)
  ) {
    return NextResponse.json(
      { error: "Course payload has an invalid shape." },
      { status: 400 },
    );
  }

  const modules = body.modules as LessonModule[];
  const allLessonIds = modules.flatMap((module) => module.lessonIds);
  if (new Set(allLessonIds).size !== allLessonIds.length) {
    return NextResponse.json(
      { error: "A lesson is listed in more than one place." },
      { status: 400 },
    );
  }
  if (new Set(modules.map((module) => module.id)).size !== modules.length) {
    return NextResponse.json(
      { error: "Duplicate module id." },
      { status: 400 },
    );
  }

  try {
    const lessonFile = await mutateLessonFile((currentLessonFile) => {
      const knownLessonIds = new Set(
        currentLessonFile.lessons.map((lesson) => lesson.id),
      );
      const requested = new Set(allLessonIds);
      if (
        requested.size !== knownLessonIds.size ||
        [...requested].some((id) => !knownLessonIds.has(id))
      ) {
        throw new Error("Module lessonIds do not match the saved lessons.");
      }
      return { ...currentLessonFile, modules };
    });

    return NextResponse.json(lessonFile);
  } catch {
    return NextResponse.json(
      { error: "Unable to save the course structure." },
      { status: 409 },
    );
  }
}
