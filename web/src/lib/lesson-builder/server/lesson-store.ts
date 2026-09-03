import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ConceptLink,
  ConceptRole,
  ConceptType,
  LanguageBlock,
  Lesson,
  LessonBlock,
  LessonFile,
  MappingDirection,
} from "@/lib/lesson-builder/types";

const lessonsFilePath = path.join(process.cwd(), "data", "lessons.json");

const conceptRoles: ConceptRole[] = [
  "primary",
  "introduced",
  "reinforced",
  "required",
  "incidental",
];

const conceptTypes: ConceptType[] = [
  "mapping",
  "vocabulary",
  "grammar_pattern",
  "morpheme",
  "concept_group",
];

const mappingDirections: MappingDirection[] = [
  "es_to_en",
  "en_to_es",
  "bidirectional",
  "not_directional",
];

let mutationQueue = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isConceptRole(value: unknown): value is ConceptRole {
  return (
    typeof value === "string" &&
    conceptRoles.includes(value as ConceptRole)
  );
}

function isConceptType(value: unknown): value is ConceptType {
  return (
    typeof value === "string" &&
    conceptTypes.includes(value as ConceptType)
  );
}

function isMappingDirection(value: unknown): value is MappingDirection {
  return (
    typeof value === "string" &&
    mappingDirections.includes(value as MappingDirection)
  );
}

function isConceptLink(value: unknown): value is ConceptLink {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.type === undefined || isConceptType(value.type)) &&
    (value.direction === undefined || isMappingDirection(value.direction)) &&
    (value.sourceText === undefined || typeof value.sourceText === "string") &&
    (value.targetText === undefined || typeof value.targetText === "string") &&
    (value.contextLabel === undefined ||
      typeof value.contextLabel === "string") &&
    isConceptRole(value.role)
  );
}

function isOptionalConceptLinks(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every(isConceptLink))
  );
}

function isLanguageBlock(value: unknown): value is LanguageBlock {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.spanish === "string" &&
    isStringOrNull(value.callout) &&
    isOptionalConceptLinks(value.conceptLinks) &&
    Array.isArray(value.acceptedAnswers) &&
    value.acceptedAnswers.every((answer) => typeof answer === "string")
  );
}

function isLessonBlock(value: unknown): value is LessonBlock {
  if (!isRecord(value) || typeof value.id !== "string") {
    return false;
  }

  if (value.type === "explanation") {
    return typeof value.contentMarkdown === "string";
  }

  if (value.type === "sentence") {
    return (
      (value.layout === undefined ||
        value.layout === "sentence" ||
        value.layout === "vocabulary_table") &&
      typeof value.promptLabel === "string" &&
      typeof value.promptText === "string" &&
      typeof value.helperText === "string" &&
      isStringOrNull(value.answerFeedback) &&
      isOptionalConceptLinks(value.conceptLinks) &&
      Array.isArray(value.languageBlocks) &&
      value.languageBlocks.every(isLanguageBlock)
    );
  }

  return false;
}

function isLessonConcept(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.conceptId === null || typeof value.conceptId === "string") &&
    typeof value.label === "string"
  );
}

export function isLesson(value: unknown): value is Lesson {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isStringOrNull(value.name) &&
    (value.concepts === undefined ||
      (Array.isArray(value.concepts) && value.concepts.every(isLessonConcept))) &&
    Array.isArray(value.blocks) &&
    value.blocks.every(isLessonBlock)
  );
}

export function isLessonFile(value: unknown): value is LessonFile {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.lessons) &&
    value.lessons.every(isLesson)
  );
}

export async function readLessonFile(): Promise<LessonFile> {
  try {
    const file = await readFile(lessonsFilePath, "utf8");
    const parsed: unknown = JSON.parse(file);

    if (!isLessonFile(parsed)) {
      throw new Error("Saved lessons file has an invalid shape.");
    }

    return parsed;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return { version: 1, lessons: [] };
    }

    throw error;
  }
}

export async function writeLessonFile(lessonFile: LessonFile) {
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
    const nextLessonFile = mutate(lessonFile);
    await writeLessonFile(nextLessonFile);
    return nextLessonFile;
  });

  mutationQueue = mutation.then(
    () => undefined,
    () => undefined,
  );

  return mutation;
}
