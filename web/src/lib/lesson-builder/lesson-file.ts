import type {
  ConceptLink,
  ConceptRole,
  ConceptType,
  LanguageBlock,
  Lesson,
  LessonBlock,
  LessonFile,
  LessonFileV1,
  LessonModule,
  MappingDirection,
} from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

// Pure validation, migration, and the ordering invariant for data/lessons.json.
// No fs — lesson-store.ts wraps this with reads/writes. Unit-tested in
// tests/unit/course.test.ts.

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isConceptRole(value: unknown): value is ConceptRole {
  return typeof value === "string" && conceptRoles.includes(value as ConceptRole);
}

function isConceptType(value: unknown): value is ConceptType {
  return typeof value === "string" && conceptTypes.includes(value as ConceptType);
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
    value === undefined || (Array.isArray(value) && value.every(isConceptLink))
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
      (Array.isArray(value.concepts) &&
        value.concepts.every(isLessonConcept))) &&
    Array.isArray(value.blocks) &&
    value.blocks.every(isLessonBlock)
  );
}

function isLessonFileV1(value: unknown): value is LessonFileV1 {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.lessons) &&
    value.lessons.every(isLesson)
  );
}

export function isLessonModule(value: unknown): value is LessonModule {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isStringOrNull(value.name) &&
    (value.kind === undefined ||
      value.kind === "course" ||
      value.kind === "onboarding") &&
    // keyConcepts is optional on disk — pre-Key-Concepts modules (which carried
    // `promise` / `finalSentence` instead) still parse and are normalized below.
    (value.keyConcepts === undefined ||
      (Array.isArray(value.keyConcepts) &&
        value.keyConcepts.every(isLessonConcept))) &&
    Array.isArray(value.lessonIds) &&
    value.lessonIds.every((lessonId) => typeof lessonId === "string")
  );
}

// Guarantee `keyConcepts` is present so every consumer can read it directly.
export function normalizeModule(module: LessonModule): LessonModule {
  return {
    id: module.id,
    name: module.name,
    ...(module.kind ? { kind: module.kind } : {}),
    keyConcepts: module.keyConcepts ?? [],
    lessonIds: module.lessonIds,
  };
}

// A stable identity for matching module key concepts against lesson concepts:
// the curriculum id when linked, otherwise the trimmed lowercased label.
export function conceptKey(concept: {
  conceptId: string | null;
  label: string;
}): string {
  return concept.conceptId ?? concept.label.trim().toLowerCase();
}

// Every concept key covered by the lessons in `module` (looked up in
// `lessonById`). A module key concept is "met" when its key is in this set.
export function moduleCoveredConceptKeys(
  module: Pick<LessonModule, "lessonIds">,
  lessonById: Map<string, Lesson>,
): Set<string> {
  const keys = new Set<string>();
  for (const lessonId of module.lessonIds) {
    for (const concept of lessonById.get(lessonId)?.concepts ?? []) {
      keys.add(conceptKey(concept));
    }
  }
  return keys;
}

// A well-formed v2 file: modules valid, lessons valid, and `lessons` is exactly
// the flattened module lessonIds, in order (the ordering invariant).
export function isLessonFile(value: unknown): value is LessonFile {
  if (
    !isRecord(value) ||
    value.version !== 2 ||
    !Array.isArray(value.modules) ||
    !value.modules.every(isLessonModule) ||
    !Array.isArray(value.lessons) ||
    !value.lessons.every(isLesson)
  ) {
    return false;
  }
  const flat = (value.modules as LessonModule[]).flatMap((m) => m.lessonIds);
  const lessonIds = (value.lessons as Lesson[]).map((lesson) => lesson.id);
  return (
    new Set(flat).size === flat.length &&
    flat.length === lessonIds.length &&
    flat.every((id, index) => id === lessonIds[index])
  );
}

export function emptyModule(name: string): LessonModule {
  return {
    id: createId("module"),
    name,
    keyConcepts: [],
    lessonIds: [],
  };
}

export function migrateV1ToV2(file: LessonFileV1): LessonFile {
  return {
    version: 2,
    modules: [
      { ...emptyModule("Module 1"), lessonIds: file.lessons.map((l) => l.id) },
    ],
    lessons: file.lessons,
  };
}

export function emptyLessonFile(): LessonFile {
  return { version: 2, modules: [emptyModule("Module 1")], lessons: [] };
}

// Parse whatever is on disk into a valid v2 file, migrating v1 in memory.
export function parseLessonFile(parsed: unknown): LessonFile {
  if (isLessonFile(parsed)) {
    return { ...parsed, modules: parsed.modules.map(normalizeModule) };
  }
  if (isLessonFileV1(parsed)) return migrateV1ToV2(parsed);
  throw new Error("Saved lessons file has an invalid shape.");
}

// Restore the ordering invariant: drop lessonIds with no lesson, drop
// duplicates, re-home any lesson missing from every module into the last
// module (there is always ≥ 1), and sort `lessons` to the flattened order.
export function reconcileLessonFile(file: LessonFile): LessonFile {
  const lessonById = new Map(file.lessons.map((lesson) => [lesson.id, lesson]));
  const claimed = new Set<string>();

  const modules = file.modules.map((module) => ({
    ...module,
    lessonIds: module.lessonIds.filter((id) => {
      if (!lessonById.has(id) || claimed.has(id)) return false;
      claimed.add(id);
      return true;
    }),
  }));

  const orphans = file.lessons
    .map((lesson) => lesson.id)
    .filter((id) => !claimed.has(id));
  if (orphans.length > 0) {
    const last = modules[modules.length - 1];
    last.lessonIds = [...last.lessonIds, ...orphans];
  }

  return {
    version: 2,
    modules,
    lessons: modules
      .flatMap((module) => module.lessonIds)
      .map((id) => lessonById.get(id)!),
  };
}

export function moduleContainingLesson(
  file: LessonFile,
  lessonId: string,
): LessonModule | undefined {
  return file.modules.find((module) => module.lessonIds.includes(lessonId));
}
