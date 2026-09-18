// Pure `LessonFile -> CourseSummary` transform behind `readCourseSummary`
// (server/course-summary.ts). Split out of that file (which carries `import
// "server-only"` and therefore cannot be loaded in a plain unit-test
// process) so the filtering/shaping logic is unit-testable without fs or
// the server-only guard. No fs, no server-only — see
// tests/unit/course-summary.test.ts.
import type {
  Lesson,
  LessonBlock,
  LessonConcept,
  LessonFile,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { normalizeLessonMarkdown } from "@/lib/lesson-builder/markdown";

type CourseLessonSummary = {
  id: string;
  lessonNumber: number;
  moduleId: string;
  moduleName: string | null;
  moduleLessonNumber: number;
  name: string | null;
  explanationCount: number;
  practiceCount: number;
  previewText: string;
  concepts: LessonConcept[];
  blocks: LessonBlock[];
};

type CourseModuleSummary = {
  id: string;
  name: string | null;
  kind: "course" | "onboarding";
  description: string | null;
  lessonCount: number;
  explanationCount: number;
  practiceCount: number;
  firstLessonId: string | null;
  lessons: CourseLessonSummary[];
};

export type CourseSummary = {
  modules: CourseModuleSummary[];
  lessons: CourseLessonSummary[];
  lessonCount: number;
  practiceCount: number;
  explanationCount: number;
};

function getLessonPreviewText(lesson: Lesson) {
  const firstPracticeBlock = lesson.blocks.find(
    (block) => block.type === "sentence",
  );

  if (firstPracticeBlock) {
    return firstPracticeBlock.languageBlocks
      .map((languageBlock) => languageBlock.spanish.trim())
      .filter(Boolean)
      .join(firstPracticeBlock.layout === "vocabulary_table" ? ", " : " ");
  }

  const firstExplanationBlock = lesson.blocks.find(
    (block) => block.type === "explanation",
  );

  return normalizeLessonMarkdown(firstExplanationBlock?.contentMarkdown ?? "")
    .replace(/^#{1,6}\s*/gmu, "")
    .replace(/==([^=]+)==/gu, "$1")
    .trim();
}

// The gate's "is there anything to send a first-time learner to" check
// (docs/design/onboarding.md §1, "when the gate is on"): a module of kind
// "onboarding" whose status is not draft AND which has at least one
// non-draft lesson with at least one block. Reads the raw file directly
// (not the already-filtered CourseSummary) so it stays a single obvious
// definition independent of summarizeCourse's own filtering.
export function hasPublishedOnboarding(lessonFile: LessonFile): boolean {
  const onboarding = lessonFile.modules.find((m) => m.kind === "onboarding");
  if (!onboarding || onboarding.status === "draft") return false;
  const lessonById = new Map(lessonFile.lessons.map((lesson) => [lesson.id, lesson]));
  return onboarding.lessonIds.some((lessonId) => {
    const lesson = lessonById.get(lessonId);
    return Boolean(lesson) && lesson!.status !== "draft" && lesson!.blocks.length > 0;
  });
}

// The onboarding module itself (undefined when there is none), used by the
// /bienvenida route to walk its published lessons in order.
export function findOnboardingModule(lessonFile: LessonFile): LessonModule | undefined {
  return lessonFile.modules.find((m) => m.kind === "onboarding");
}

// Learner-facing filtering: draft modules and draft lessons are excluded
// entirely — used by `/` and `/practice` (via readCourseSummary). Coverage/
// studio surfaces read the raw LessonFile directly and are unaffected.
export function summarizeCourse(lessonFile: LessonFile): CourseSummary {
  const lessonById = new Map(lessonFile.lessons.map((lesson) => [lesson.id, lesson]));
  // Learner-facing lesson numbers never count the onboarding module (docs/
  // design/onboarding.md item 9) — the first ordinary course lesson is
  // "Lección 1" regardless of onboarding's own lesson count. Onboarding
  // lessons themselves get no meaningful number (0; nothing displays it —
  // /bienvenida shows no lesson title or number).
  let courseLessonCounter = 0;
  const lessonNumberById = new Map(
    lessonFile.modules.flatMap((module) =>
      module.lessonIds.map((lessonId) => {
        if (module.kind === "onboarding") return [lessonId, 0] as const;
        courseLessonCounter += 1;
        return [lessonId, courseLessonCounter] as const;
      }),
    ),
  );

  const modules = lessonFile.modules
    .filter((module) => module.status !== "draft")
    .map<CourseModuleSummary>((module) => {
      const lessons = module.lessonIds
        .map((lessonId, index) => {
          const lesson = lessonById.get(lessonId);
          if (!lesson || lesson.status === "draft") return null;

          return {
            id: lesson.id,
            lessonNumber: lessonNumberById.get(lesson.id) ?? index + 1,
            moduleId: module.id,
            moduleName: module.name,
            moduleLessonNumber: index + 1,
            name: lesson.name,
            explanationCount: lesson.blocks.filter(
              (block) => block.type === "explanation",
            ).length,
            practiceCount: lesson.blocks.filter((block) => block.type === "sentence")
              .length,
            previewText: getLessonPreviewText(lesson),
            concepts: lesson.concepts,
            blocks: lesson.blocks,
          } satisfies CourseLessonSummary;
        })
        .filter((lesson): lesson is CourseLessonSummary => lesson !== null);

      return {
        id: module.id,
        name: module.name,
        kind: module.kind ?? "course",
        description: module.description?.trim() || null,
        lessonCount: lessons.length,
        explanationCount: lessons.reduce(
          (total, lesson) => total + lesson.explanationCount,
          0,
        ),
        practiceCount: lessons.reduce(
          (total, lesson) => total + lesson.practiceCount,
          0,
        ),
        firstLessonId: lessons[0]?.id ?? null,
        lessons,
      };
    });

  const lessons = modules.flatMap((module) => module.lessons);

  return {
    modules,
    lessons,
    lessonCount: lessons.length,
    practiceCount: lessons.reduce((total, lesson) => total + lesson.practiceCount, 0),
    explanationCount: lessons.reduce(
      (total, lesson) => total + lesson.explanationCount,
      0,
    ),
  };
}
