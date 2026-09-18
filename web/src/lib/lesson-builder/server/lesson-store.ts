import "server-only";

import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LessonFile } from "@/lib/lesson-builder/types";
import { reconcileLessonFile } from "@/lib/lesson-builder/lesson-file";
import {
  lessonsFilePath,
  readLessonFile,
} from "@/lib/lesson-builder/server/lesson-file-io";

export { isLesson } from "@/lib/lesson-builder/lesson-file";
export { readLessonFile } from "@/lib/lesson-builder/server/lesson-file-io";

let mutationQueue = Promise.resolve();

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
