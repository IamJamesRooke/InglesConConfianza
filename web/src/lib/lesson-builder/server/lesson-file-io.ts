// Plain (no "server-only" guard) read of the Lesson Builder store, factored
// out of lesson-store.ts so it can be imported both from Next server code
// (route handlers, which lesson-store.ts still serves) and from the
// audio-generation module (src/lib/audio/generate-clips.ts), which in turn
// must also run under the plain `tsx` CLI wrapper (scripts/generate-audio.ts)
// — a context where the "server-only" package's throw-on-import behaviour
// (relied on by Next's webpack, which aliases it away in server bundles)
// would otherwise abort the process. This module has no such guard; callers
// that want the guard get it by going through lesson-store.ts instead.
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { LessonFile } from "@/lib/lesson-builder/types";
import { emptyLessonFile, parseLessonFile } from "@/lib/lesson-builder/lesson-file";

// Overridable so the UX-check harness (tests/ux/) can point at an isolated
// fixture file instead of the real course data — see playwright.config.ts.
export const lessonsFilePath =
  process.env.LESSON_BUILDER_DATA_PATH ??
  path.join(process.cwd(), "data", "lessons.json");

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
