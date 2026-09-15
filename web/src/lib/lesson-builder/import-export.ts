// Whole-file backup: Export downloads the current course as dated JSON;
// Import validates a picked file and reports a diff summary before
// replacing anything. Pure — no fs, no fetch — so it's unit-testable and the
// UI/server layers each just call through it. See
// docs/design/module-syllabus.md §Backup.
import {
  parseLessonFile,
  reconcileLessonFile,
} from "@/lib/lesson-builder/lesson-file";
import type { Lesson, LessonFile } from "@/lib/lesson-builder/types";

export type FileDiffSummary = {
  modulesAdded: string[];
  modulesRemoved: string[];
  modulesChanged: string[];
  lessonsAdded: string[];
  lessonsRemoved: string[];
  lessonsChanged: string[];
};

function displayName(entity: { name: string | null } | null | undefined, id: string): string {
  return entity?.name?.trim() || id;
}

/** A structural diff between the file currently in memory/on disk and one
 * about to replace it — modules/lessons added, removed, or changed (by id,
 * comparing everything but ordering-irrelevant identity). */
export function buildImportDiff(current: LessonFile, incoming: LessonFile): FileDiffSummary {
  const currentModulesById = new Map(current.modules.map((module) => [module.id, module]));
  const incomingModulesById = new Map(incoming.modules.map((module) => [module.id, module]));
  const currentLessonsById = new Map(current.lessons.map((lesson) => [lesson.id, lesson]));
  const incomingLessonsById = new Map(incoming.lessons.map((lesson) => [lesson.id, lesson]));

  const modulesAdded: string[] = [];
  const modulesChanged: string[] = [];
  for (const incomingModule of incoming.modules) {
    const before = currentModulesById.get(incomingModule.id);
    if (!before) modulesAdded.push(displayName(incomingModule, incomingModule.id));
    else if (JSON.stringify(before) !== JSON.stringify(incomingModule)) {
      modulesChanged.push(displayName(incomingModule, incomingModule.id));
    }
  }
  const modulesRemoved = current.modules
    .filter((module) => !incomingModulesById.has(module.id))
    .map((module) => displayName(module, module.id));

  const lessonName = (lesson: Lesson | undefined, id: string) => displayName(lesson ?? null, id);
  const lessonsAdded: string[] = [];
  const lessonsChanged: string[] = [];
  for (const lesson of incoming.lessons) {
    const before = currentLessonsById.get(lesson.id);
    if (!before) lessonsAdded.push(lessonName(lesson, lesson.id));
    else if (JSON.stringify(before) !== JSON.stringify(lesson)) {
      lessonsChanged.push(lessonName(lesson, lesson.id));
    }
  }
  const lessonsRemoved = current.lessons
    .filter((lesson) => !incomingLessonsById.has(lesson.id))
    .map((lesson) => lessonName(lesson, lesson.id));

  return { modulesAdded, modulesRemoved, modulesChanged, lessonsAdded, lessonsRemoved, lessonsChanged };
}

export type ImportValidationResult = { file: LessonFile } | { error: string };

/** Parses, normalizes, and reconciles a candidate import file without ever
 * touching the store — the caller only writes it after confirming the diff.
 * Rejects anything malformed (wrong shape/version, broken ordering
 * invariant it can't fix) rather than throwing. */
export function validateImportedFile(raw: unknown): ImportValidationResult {
  try {
    return { file: reconcileLessonFile(parseLessonFile(raw)) };
  } catch {
    return { error: "That file isn't a valid lessons.json (wrong shape, version, or corrupted)." };
  }
}

export function exportFileName(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `lessons-${iso}.json`;
}
