import type {
  Lesson,
  LessonBlock,
  LessonConcept,
  LessonFile,
  LessonFileV1,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";
import { isLearnerVariableKey } from "@/lib/learner/variables";

// Pure validation, migration, and the ordering invariant for data/lessons.json.
// No fs — lesson-store.ts wraps this with reads/writes. Unit-tested in
// tests/unit/course.test.ts.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

// A capture piece's `capture` object: a valid key, an optional literal
// suffix. Absent on every piece written before the feature existed, which is
// why this is only checked when the field is present at all.
function isCaptureConfig(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    isLearnerVariableKey(value.key) &&
    (value.suffix === undefined || typeof value.suffix === "string")
  );
}

function isLanguageBlock(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.spanish === "string" &&
    isStringOrNull(value.callout) &&
    Array.isArray(value.acceptedAnswers) &&
    // A capture piece has no fixed English answer, so an empty
    // `acceptedAnswers` is valid — it always was, and stays that way.
    value.acceptedAnswers.every((answer) => typeof answer === "string") &&
    (value.capture === undefined || isCaptureConfig(value.capture))
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
    (value.status === undefined ||
      value.status === "draft" ||
      value.status === "published") &&
    (value.notes === undefined || typeof value.notes === "string") &&
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

function isModuleSyllabus(value: unknown): boolean {
  return (
    isRecord(value) &&
    Array.isArray(value.main) &&
    value.main.every(isLessonConcept) &&
    Array.isArray(value.review) &&
    value.review.every(isLessonConcept)
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
    (value.description === undefined || typeof value.description === "string") &&
    (value.status === undefined ||
      value.status === "draft" ||
      value.status === "published") &&
    (value.access === undefined ||
      value.access === "free" ||
      value.access === "premium") &&
    Array.isArray(value.lessonIds) &&
    value.lessonIds.every((lessonId) => typeof lessonId === "string") &&
    (value.syllabus === undefined || isModuleSyllabus(value.syllabus))
  );
}

// No `conceptId` may appear twice across a module's main + review lists
// (a freehand item with a null conceptId is never considered a duplicate of
// another freehand item). Later occurrences are dropped, main before review.
function dedupeSyllabus(syllabus: { main: LessonConcept[]; review: LessonConcept[] }) {
  const seen = new Set<string>();
  const keep = (items: LessonConcept[]) =>
    items.filter((item) => {
      if (!item.conceptId) return true;
      if (seen.has(item.conceptId)) return false;
      seen.add(item.conceptId);
      return true;
    });
  return { main: keep(syllabus.main), review: keep(syllabus.review) };
}

export function normalizeModule(module: LessonModule): LessonModule {
  const description = module.description?.trim();
  return {
    id: module.id,
    name: module.name,
    ...(module.kind ? { kind: module.kind } : {}),
    ...(description ? { description } : {}),
    ...(module.status === "draft" ? { status: module.status } : {}),
    ...(module.access === "premium" ? { access: module.access } : {}),
    lessonIds: module.lessonIds,
    syllabus: dedupeSyllabus(module.syllabus ?? { main: [], review: [] }),
  };
}

// Every id that isn't a syllabus item's own — a syllabus item may never
// reuse one of these. (Module ids are included too: unlikely to collide,
// but cheap to guard.)
function collectNonSyllabusIds(modules: LessonModule[], lessons: Lesson[]): Set<string> {
  const ids = new Set<string>();
  for (const lessonModule of modules) ids.add(lessonModule.id);
  for (const lesson of lessons) {
    ids.add(lesson.id);
    for (const concept of lesson.concepts ?? []) ids.add(concept.id);
    for (const block of lesson.blocks) {
      ids.add(block.id);
      if (block.type === "sentence") {
        for (const languageBlock of block.languageBlocks) ids.add(languageBlock.id);
      }
    }
  }
  return ids;
}

// A stale authoring path once copied a lesson concept's `id` onto a promoted
// syllabus item instead of minting a fresh one (fixed in syllabus.ts's
// add*/promoteToMain, but files saved before that fix carry the collision).
// Repair at load time: any syllabus item whose id collides with another id
// anywhere in the file — a lesson concept, a block, a language-block piece,
// the module itself, or an earlier syllabus item — gets a fresh id here.
// Deterministic per load (same input → same repaired ids) so re-saving
// doesn't churn ids that were already fine.
function reassignDuplicateSyllabusIds(
  module: LessonModule,
  usedIds: Set<string>,
): LessonModule {
  const syllabus = module.syllabus ?? { main: [], review: [] };
  let counter = 0;
  const nextId = () => {
    let candidate: string;
    do {
      candidate = `syllabus_item_repair_${module.id}_${counter}`;
      counter += 1;
    } while (usedIds.has(candidate));
    return candidate;
  };
  const fix = (items: LessonConcept[]) =>
    items.map((item) => {
      if (usedIds.has(item.id)) {
        const id = nextId();
        usedIds.add(id);
        return { ...item, id };
      }
      usedIds.add(item.id);
      return item;
    });
  return { ...module, syllabus: { main: fix(syllabus.main), review: fix(syllabus.review) } };
}

function repairSyllabusIdCollisions(
  modules: LessonModule[],
  lessons: Lesson[],
): LessonModule[] {
  const usedIds = collectNonSyllabusIds(modules, lessons);
  return modules.map((module) => reassignDuplicateSyllabusIds(module, usedIds));
}

function normalizeLessonForFile(lesson: Lesson): Lesson {
  const notes = lesson.notes?.trim();
  return {
    id: lesson.id,
    name: lesson.name,
    ...(lesson.status === "draft" ? { status: lesson.status } : {}),
    ...(notes ? { notes } : {}),
    concepts: lesson.concepts ?? [],
    blocks: lesson.blocks.map((block): LessonBlock => {
      if (block.type === "explanation") {
        return {
          id: block.id,
          type: "explanation",
          contentMarkdown: block.contentMarkdown,
        };
      }

      return {
        id: block.id,
        type: "sentence",
        ...(block.layout === "vocabulary_table" ? { layout: block.layout } : {}),
        promptLabel: block.promptLabel,
        promptText: block.promptText,
        helperText: block.helperText,
        answerFeedback: block.answerFeedback,
        languageBlocks: block.languageBlocks.map((languageBlock) => ({
          id: languageBlock.id,
          spanish: languageBlock.spanish,
          callout: languageBlock.callout,
          acceptedAnswers: [...languageBlock.acceptedAnswers],
          ...(languageBlock.given ? { given: true as const } : {}),
          ...(languageBlock.capture ? { capture: { ...languageBlock.capture } } : {}),
        })),
      };
    }),
  };
}

// A stable identity for matching a concept against others: the curriculum id
// when linked, otherwise the trimmed lowercased label.
export function conceptKey(concept: {
  conceptId: string | null;
  label: string;
}): string {
  return concept.conceptId ?? concept.label.trim().toLowerCase();
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

function emptyModule(name: string): LessonModule {
  return {
    id: createId("module"),
    name,
    lessonIds: [],
  };
}

export function migrateV1ToV2(file: LessonFileV1): LessonFile {
  return {
    version: 2,
    modules: [
      { ...emptyModule("Module 1"), lessonIds: file.lessons.map((l) => l.id) },
    ],
    lessons: file.lessons.map(normalizeLessonForFile),
  };
}

export function emptyLessonFile(): LessonFile {
  return { version: 2, modules: [emptyModule("Module 1")], lessons: [] };
}

// Parse whatever is on disk into a valid v2 file, migrating v1 in memory.
export function parseLessonFile(parsed: unknown): LessonFile {
  if (isLessonFile(parsed)) {
    const lessons = parsed.lessons.map(normalizeLessonForFile);
    const modules = enforceOnboardingSlot(parsed.modules.map(normalizeModule));
    const lessonById = new Map(lessons.map((l) => [l.id, l]));
    // `isLessonFile(parsed)` already guarantees `lessons` matched the
    // pre-normalization module order — enforceOnboardingSlot can reorder
    // modules (moving an onboarding module to index 0), so re-flatten
    // `lessons` to match, keeping the ordering invariant intact.
    const reordered = modules.flatMap((m) => m.lessonIds).map((id) => lessonById.get(id)!);
    return {
      ...parsed,
      modules: repairSyllabusIdCollisions(modules, lessons),
      lessons: reordered,
    };
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

  const orderedModules = enforceOnboardingSlot(modules);

  return {
    version: 2,
    modules: orderedModules,
    lessons: orderedModules
      .flatMap((module) => module.lessonIds)
      .map((id) => lessonById.get(id)!),
  };
}

// Onboarding is a single fixed slot (docs/design/onboarding.md §2): at most
// one module may carry `kind: "onboarding"`, and when one exists it is
// always `modules[0]`. The first onboarding module found (in file order)
// wins; any later ones are demoted to ordinary "course" modules rather than
// dropped, so no lesson content is ever silently lost by this repair. A
// no-op when there is already at most one, already first.
export function enforceOnboardingSlot(modules: LessonModule[]): LessonModule[] {
  const onboardingIndex = modules.findIndex((m) => m.kind === "onboarding");
  if (onboardingIndex === -1) return modules;
  const demoted = modules.map((module, index) => {
    if (module.kind !== "onboarding" || index === onboardingIndex) return module;
    const rest: LessonModule = { ...module };
    delete rest.kind;
    return rest;
  });
  const [onboarding] = demoted.splice(onboardingIndex, 1);
  return [onboarding, ...demoted];
}

export function moduleContainingLesson(
  file: LessonFile,
  lessonId: string,
): LessonModule | undefined {
  return file.modules.find((module) => module.lessonIds.includes(lessonId));
}
