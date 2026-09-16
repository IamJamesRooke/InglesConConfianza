// Module syllabus derivations — see docs/design/module-syllabus.md.
// Everything here is pure: no fs, no fetch, no React. Given `modules`
// (ordered), `lessons` (ordered per module.lessonIds), and a concept display
// lookup, it derives coverage, "also taught", "reviewed", the known set,
// review priority, warnings, and "done" — nothing beyond `syllabus` is ever
// stored on disk.
import { curriculumRoleLabel } from "@/lib/curriculum/types";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import { groupSyllabusItems } from "@/lib/lesson-builder/syllabus-groups";
import type {
  ConceptDisplayLookup,
  Lesson,
  LessonConcept,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

// Syllabus items share the exact shape of a lesson's Covers entries.
export type SyllabusItem = LessonConcept;
export type ModuleSyllabus = { main: SyllabusItem[]; review: SyllabusItem[] };

export function emptySyllabus(): ModuleSyllabus {
  return { main: [], review: [] };
}

export function syllabusOf(module: LessonModule): ModuleSyllabus {
  return module.syllabus ?? emptySyllabus();
}

// --- Review-priority constants (owner tunes by feel) ---------------------
// Anki-like spaced review: the interval before a concept needs review again
// doubles for every extra module it has been covered in.
const REVIEW_BASE_INTERVAL_LESSONS = 5;
const REVIEW_INTERVAL_GROWTH = 2;
const REVIEW_PROPOSAL_COUNT = 10;

// --- Course timeline -------------------------------------------------------

type OrderedLesson = {
  moduleId: string;
  moduleIndex: number;
  lessonId: string;
  lessonNumber: number; // 1-based, across the whole course
};

type CourseTimelineEntry = {
  key: string;
  firstTaughtLesson: number;
  firstTaughtModuleIndex: number;
  lastTaughtLesson: number;
  modulesCovering: number;
  deliberate: 1 | 2 | 3;
};

export type CourseTimeline = {
  order: OrderedLesson[];
  totalModules: number;
  entries: Map<string, CourseTimelineEntry>;
  /** First-seen display item for every concept key, for labels/briefs. */
  labels: Map<string, SyllabusItem>;
};

function moduleLessonsOf(module: LessonModule, lessons: Lesson[]): Lesson[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return module.lessonIds
    .map((id) => byId.get(id))
    .filter((lesson): lesson is Lesson => Boolean(lesson));
}

export function buildCourseTimeline(
  modules: LessonModule[],
  lessons: Lesson[],
): CourseTimeline {
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const order: OrderedLesson[] = [];
  modules.forEach((module, moduleIndex) => {
    module.lessonIds.forEach((lessonId) => {
      if (!lessonById.has(lessonId)) return;
      order.push({
        moduleId: module.id,
        moduleIndex,
        lessonId,
        lessonNumber: order.length + 1,
      });
    });
  });

  const coveringModules = new Map<string, Set<number>>();
  const entries = new Map<string, CourseTimelineEntry>();
  const labels = new Map<string, SyllabusItem>();

  for (const step of order) {
    const lesson = lessonById.get(step.lessonId)!;
    for (const concept of lesson.concepts ?? []) {
      const key = conceptKey(concept);
      if (!labels.has(key)) {
        labels.set(key, { id: concept.id, conceptId: concept.conceptId, label: concept.label });
      }
      const existing = entries.get(key);
      if (!existing) {
        entries.set(key, {
          key,
          firstTaughtLesson: step.lessonNumber,
          firstTaughtModuleIndex: step.moduleIndex,
          lastTaughtLesson: step.lessonNumber,
          modulesCovering: 1,
          deliberate: 1,
        });
        coveringModules.set(key, new Set([step.moduleIndex]));
      } else {
        existing.lastTaughtLesson = step.lessonNumber;
        const set = coveringModules.get(key)!;
        set.add(step.moduleIndex);
        existing.modulesCovering = set.size;
      }
    }
  }

  // deliberate = highest importance any syllabus ever gave the concept:
  // main (3) beats review (2) beats "just covered incidentally" (1, above).
  for (const courseModule of modules) {
    const syllabus = syllabusOf(courseModule);
    for (const item of syllabus.main) {
      const entry = entries.get(conceptKey(item));
      if (entry) entry.deliberate = 3;
      if (!labels.has(conceptKey(item))) labels.set(conceptKey(item), item);
    }
    for (const item of syllabus.review) {
      const key = conceptKey(item);
      const entry = entries.get(key);
      if (entry && entry.deliberate < 2) entry.deliberate = 2;
      if (!labels.has(key)) labels.set(key, item);
    }
  }

  return { order, totalModules: modules.length, entries, labels };
}

/** The lesson number (1-based, course-wide) at which `moduleIndex` starts —
 * one past every lesson in every earlier module, whether or not this module
 * has any lessons of its own yet. */
export function moduleStartLesson(timeline: CourseTimeline, moduleIndex: number): number {
  return timeline.order.filter((step) => step.moduleIndex < moduleIndex).length + 1;
}

/** Every concept first taught strictly before lesson `lessonNumber`. */
export function knownSetAtLesson(timeline: CourseTimeline, lessonNumber: number): Set<string> {
  const known = new Set<string>();
  for (const [key, entry] of timeline.entries) {
    if (entry.firstTaughtLesson < lessonNumber) known.add(key);
  }
  return known;
}

// --- Coverage --------------------------------------------------------------

export type ItemCoverage = {
  covered: boolean;
  lessons: { lessonId: string; lessonName: string | null }[];
};

export function coverageOfItem(
  item: { conceptId: string | null; label: string },
  moduleLessons: Lesson[],
): ItemCoverage {
  const key = conceptKey(item);
  const hits = moduleLessons.filter((lesson) =>
    (lesson.concepts ?? []).some((concept) => conceptKey(concept) === key),
  );
  return {
    covered: hits.length > 0,
    lessons: hits.map((lesson) => ({ lessonId: lesson.id, lessonName: lesson.name })),
  };
}

// --- Also taught / Reviewed -------------------------------------------------

export function alsoTaughtAndReviewed(
  module: LessonModule,
  moduleIndex: number,
  lessons: Lesson[],
  timeline: CourseTimeline,
): { alsoTaught: SyllabusItem[]; reviewed: SyllabusItem[] } {
  const syllabus = syllabusOf(module);
  const mainKeys = new Set(syllabus.main.map(conceptKey));
  const moduleLessons = moduleLessonsOf(module, lessons);
  const seen = new Set<string>();
  const alsoTaught: SyllabusItem[] = [];
  const reviewed: SyllabusItem[] = [];

  for (const lesson of moduleLessons) {
    for (const concept of lesson.concepts ?? []) {
      const key = conceptKey(concept);
      if (seen.has(key)) continue;
      const entry = timeline.entries.get(key);
      if (!entry) continue; // defensive: every taught concept has an entry
      const item: SyllabusItem = {
        id: concept.id,
        conceptId: concept.conceptId,
        label: concept.label,
      };
      if (entry.firstTaughtModuleIndex === moduleIndex) {
        if (!mainKeys.has(key)) {
          alsoTaught.push(item);
          seen.add(key);
        }
      } else if (entry.firstTaughtModuleIndex < moduleIndex) {
        reviewed.push(item);
        seen.add(key);
      }
    }
  }

  return { alsoTaught, reviewed };
}

// --- Review priority ---------------------------------------------------

export type ReviewCandidate = { item: SyllabusItem; priority: number };

/** Every concept taught before `moduleIndex` starts, ranked by review
 * priority (descending) — see docs/design/module-syllabus.md's formula. */
export function reviewPriority(
  moduleIndex: number,
  timeline: CourseTimeline,
): ReviewCandidate[] {
  const k = moduleStartLesson(timeline, moduleIndex);
  const candidates: ReviewCandidate[] = [];
  for (const [key, entry] of timeline.entries) {
    if (entry.firstTaughtLesson >= k) continue;
    const interval =
      REVIEW_BASE_INTERVAL_LESSONS * REVIEW_INTERVAL_GROWTH ** (entry.modulesCovering - 1);
    const staleness = k - entry.lastTaughtLesson;
    const firstModuleOrdinal = entry.firstTaughtModuleIndex + 1; // 1-based
    const foundation = 1 + (timeline.totalModules - firstModuleOrdinal) / timeline.totalModules;
    const priority = (entry.deliberate * foundation * staleness) / interval;
    const item = timeline.labels.get(key);
    if (item) candidates.push({ item, priority });
  }
  return candidates.sort((a, b) => b.priority - a.priority);
}

export function proposedReviewPlan(moduleIndex: number, timeline: CourseTimeline): SyllabusItem[] {
  return reviewPriority(moduleIndex, timeline)
    .slice(0, REVIEW_PROPOSAL_COUNT)
    .map((candidate) => candidate.item);
}

// --- Warnings ----------------------------------------------------------

type LessonWarning = { lessonId: string; conceptKey: string; label: string };
export type ModuleWarnings = {
  /** A lesson covered a concept outside its known set and outside its own
   * module's main points. */
  notIntroducedYet: LessonWarning[];
  /** Main points already taught in an earlier module — move to review. */
  notNew: SyllabusItem[];
  /** Review items with no earlier coverage anywhere — move to main. */
  neverTaught: SyllabusItem[];
  /** Syllabus items whose concept is Trash or no longer in the curriculum. */
  missing: SyllabusItem[];
};

export function isMissingConcept(
  item: { conceptId: string | null },
  conceptDisplays: ConceptDisplayLookup,
): boolean {
  if (!item.conceptId) return false; // a freehand label is never "missing"
  const display = conceptDisplays[item.conceptId];
  return !display || display.role === "trash";
}

export function computeModuleWarnings(
  module: LessonModule,
  moduleIndex: number,
  lessons: Lesson[],
  timeline: CourseTimeline,
  conceptDisplays: ConceptDisplayLookup,
): ModuleWarnings {
  const syllabus = syllabusOf(module);
  const moduleLessons = moduleLessonsOf(module, lessons);
  const moduleStart = moduleStartLesson(timeline, moduleIndex);
  const mainKeys = new Set(syllabus.main.map(conceptKey));

  const notIntroducedYet: LessonWarning[] = [];
  moduleLessons.forEach((lesson, indexInModule) => {
    const lessonNumber = moduleStart + indexInModule;
    const known = knownSetAtLesson(timeline, lessonNumber);
    for (const concept of lesson.concepts ?? []) {
      const key = conceptKey(concept);
      if (!known.has(key) && !mainKeys.has(key)) {
        notIntroducedYet.push({ lessonId: lesson.id, conceptKey: key, label: concept.label });
      }
    }
  });

  const notNew = syllabus.main.filter((item) => {
    const entry = timeline.entries.get(conceptKey(item));
    return Boolean(entry && entry.firstTaughtModuleIndex < moduleIndex);
  });

  const neverTaught = syllabus.review.filter((item) => {
    const entry = timeline.entries.get(conceptKey(item));
    return !entry || entry.firstTaughtModuleIndex >= moduleIndex;
  });

  const missing = [...syllabus.main, ...syllabus.review].filter((item) =>
    isMissingConcept(item, conceptDisplays),
  );

  return { notIntroducedYet, notNew, neverTaught, missing };
}

// --- Done / progress -----------------------------------------------------

export function isModuleDone(module: LessonModule, lessons: Lesson[]): boolean {
  const syllabus = syllabusOf(module);
  const items = [...syllabus.main, ...syllabus.review];
  if (items.length === 0) return true; // nothing required, nothing left undone
  const moduleLessons = moduleLessonsOf(module, lessons);
  return items.every((item) => coverageOfItem(item, moduleLessons).covered);
}

export function courseProgress(
  modules: LessonModule[],
  lessons: Lesson[],
): { done: number; total: number } {
  return {
    done: modules.filter((module) => isModuleDone(module, lessons)).length,
    total: modules.length,
  };
}

// --- AI brief --------------------------------------------------------------

// "yo — I [Level 1]" — the level is stated in words here; the card states it
// as a colour dot with the same wording in its tooltip and legend.
function entryFor(item: SyllabusItem, conceptDisplays: ConceptDisplayLookup): string {
  const display = item.conceptId ? conceptDisplays[item.conceptId] : undefined;
  if (!display) return `${item.label} [not in the curriculum]`;
  return `${labelFor(item, conceptDisplays)} [${curriculumRoleLabel(display.role)}]`;
}

function pushGrouped(
  lines: string[],
  items: SyllabusItem[],
  conceptDisplays: ConceptDisplayLookup,
  format: (item: SyllabusItem, index: number) => string,
): void {
  const groups = groupSyllabusItems(items, (item) =>
    item.conceptId ? conceptDisplays[item.conceptId]?.pos : undefined,
  );
  groups.forEach((group, position) => {
    if (position > 0) lines.push("");
    lines.push(`${group.label}:`);
    group.entries.forEach((entry) => lines.push(format(entry.item, entry.index)));
  });
}

function labelFor(item: SyllabusItem, conceptDisplays: ConceptDisplayLookup): string {
  const display = item.conceptId ? conceptDisplays[item.conceptId] : undefined;
  return display ? `${display.spanish} — ${display.english}` : item.label;
}

/** The text a drafter (human or AI) needs to write this module's lessons:
 * main points in teaching order, the review plan, the known set at the
 * module's start, and the naturalness policy. Pure so it can also feed a
 * future auto-draft call. */
export function moduleBrief(
  module: LessonModule,
  moduleIndex: number,
  lessons: Lesson[],
  timeline: CourseTimeline,
  conceptDisplays: ConceptDisplayLookup,
): string {
  const syllabus = syllabusOf(module);
  const moduleStart = moduleStartLesson(timeline, moduleIndex);
  const known = [...knownSetAtLesson(timeline, moduleStart)]
    .map((key) => timeline.labels.get(key))
    .filter((item): item is SyllabusItem => Boolean(item))
    .map((item) => labelFor(item, conceptDisplays));

  const lines: string[] = [];
  lines.push(`${module.name?.trim() || "Untitled module"} — teaching brief`);
  lines.push("");
  lines.push("Main teaching points (in order):");
  if (syllabus.main.length === 0) {
    lines.push("(none set)");
  } else {
    // Same part-of-speech groups and level marks the card shows, so the
    // pasted brief reads like docs/curation/level-1.md (round 2, A.4). The
    // number is still the concept's place in the flat teaching order.
    pushGrouped(lines, syllabus.main, conceptDisplays, (item, index) => `${index + 1}. ${entryFor(item, conceptDisplays)}`);
  }
  lines.push("");
  lines.push("Review plan:");
  if (syllabus.review.length === 0) {
    lines.push("(none set)");
  } else {
    pushGrouped(lines, syllabus.review, conceptDisplays, (item) => `- ${entryFor(item, conceptDisplays)}`);
  }
  lines.push("");
  lines.push(`Known set at the start of this module (${known.length} concepts):`);
  lines.push(known.length ? known.join(", ") : "(none — this is the first module)");
  lines.push("");
  lines.push(
    "Naturalness policy: prefer the known set above; if a sentence needs an outside word, use it and mark it as a context hint.",
  );
  return lines.join("\n");
}

// --- Reducer-facing mutations (pure) ---------------------------------------

function hasConcept(syllabus: ModuleSyllabus, item: { conceptId: string | null; label: string }): boolean {
  const key = conceptKey(item);
  return (
    syllabus.main.some((existing) => conceptKey(existing) === key) ||
    syllabus.review.some((existing) => conceptKey(existing) === key)
  );
}

function reorderList<T extends { id: string }>(
  list: T[],
  draggedId: string,
  targetId: string,
  position: "before" | "after",
): T[] {
  if (draggedId === targetId) return list;
  const dragged = list.find((entry) => entry.id === draggedId);
  if (!dragged) return list;
  const without = list.filter((entry) => entry.id !== draggedId);
  const targetIndex = without.findIndex((entry) => entry.id === targetId);
  if (targetIndex < 0) return list;
  const insertAt = position === "before" ? targetIndex : targetIndex + 1;
  return without.toSpliced(insertAt, 0, dragged);
}

// A syllabus item is its own independent list entry — never reuse the id of
// whatever it was derived from (a lesson concept's `id`, another syllabus
// item's `id`, etc). The link back to the curriculum/lesson concept is
// `conceptId`/`conceptKey`, never `id`, so minting a fresh one here is safe.
function freshSyllabusItem(item: SyllabusItem): SyllabusItem {
  return { ...item, id: createId("syllabus_item") };
}

export function addMainItem(syllabus: ModuleSyllabus, item: SyllabusItem): ModuleSyllabus {
  if (hasConcept(syllabus, item)) return syllabus;
  return { ...syllabus, main: [...syllabus.main, freshSyllabusItem(item)] };
}

export function removeMainItem(syllabus: ModuleSyllabus, itemId: string): ModuleSyllabus {
  return { ...syllabus, main: syllabus.main.filter((item) => item.id !== itemId) };
}

export function reorderMainItems(
  syllabus: ModuleSyllabus,
  draggedId: string,
  targetId: string,
  position: "before" | "after",
): ModuleSyllabus {
  return { ...syllabus, main: reorderList(syllabus.main, draggedId, targetId, position) };
}

export function addReviewItem(syllabus: ModuleSyllabus, item: SyllabusItem): ModuleSyllabus {
  if (hasConcept(syllabus, item)) return syllabus;
  return { ...syllabus, review: [...syllabus.review, freshSyllabusItem(item)] };
}

export function removeReviewItem(syllabus: ModuleSyllabus, itemId: string): ModuleSyllabus {
  return { ...syllabus, review: syllabus.review.filter((item) => item.id !== itemId) };
}

// The review plan is stored as a set (no dedup or priority meaning attaches
// to its order), but the panel renders it as a numbered list like Main for
// visual consistency, so the owner can drag rows for their own reading
// order without that changing anything else derived from `review`.
export function reorderReviewItems(
  syllabus: ModuleSyllabus,
  draggedId: string,
  targetId: string,
  position: "before" | "after",
): ModuleSyllabus {
  return { ...syllabus, review: reorderList(syllabus.review, draggedId, targetId, position) };
}

/** Also taught → Main, one click: adds to main; if it was on the review
 * plan too (shouldn't normally happen — dedup guards against it), drops it
 * from review so the concept isn't listed twice. */
export function promoteToMain(syllabus: ModuleSyllabus, item: SyllabusItem): ModuleSyllabus {
  const key = conceptKey(item);
  const review = syllabus.review.filter((existing) => conceptKey(existing) !== key);
  if (syllabus.main.some((existing) => conceptKey(existing) === key)) {
    return { ...syllabus, review };
  }
  return { main: [...syllabus.main, freshSyllabusItem(item)], review };
}
