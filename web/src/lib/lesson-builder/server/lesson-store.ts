import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LessonFile } from "@/lib/lesson-builder/types";
import {
  emptyLessonFile,
  parseLessonFile,
  reconcileLessonFile,
} from "@/lib/lesson-builder/lesson-file";

export { isLesson } from "@/lib/lesson-builder/lesson-file";

// Overridable so the UX-check harness (tests/ux/) can point at an isolated
// fixture file instead of the real course data — see playwright.config.ts.
const lessonsFilePath =
  process.env.LESSON_BUILDER_DATA_PATH ??
  path.join(process.cwd(), "data", "lessons.json");

let mutationQueue = Promise.resolve();

export async function readLessonFile(): Promise<LessonFile> {
  try {
    const file = await readFile(lessonsFilePath, "utf8");
    return parseLessonFile(JSON.parse(file));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return emptyLessonFile();
    }

    throw error;
  }
}

async function writeLessonFile(lessonFile: LessonFile) {
  const temporaryLessonsFilePath = `${lessonsFilePath}.tmp`;

  await mkdir(path.dirname(lessonsFilePath), { recursive: true });
  await writeFile(
    temporaryLessonsFilePath,
    `${JSON.stringify(lessonFile, null, 2)}\n`,
  );
  await rename(temporaryLessonsFilePath, lessonsFilePath);
}

export function mutateLessonFile(
  mutate: (lessonFile: LessonFile) => LessonFile,
) {
  const mutation = mutationQueue.then(async () => {
    const lessonFile = await readLessonFile();
    const nextLessonFile = reconcileLessonFile(mutate(lessonFile));
    await writeLessonFile(nextLessonFile);
    return nextLessonFile;
  });

  mutationQueue = mutation.then(
    () => undefined,
    () => undefined,
  );

  return mutation;
}
