import { LessonDashboard } from "@/components/learner/lesson-dashboard";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";
import { redirectToOnboardingIfNeeded } from "@/lib/learner/onboarding-gate-server";
import { lessonOutcome } from "@/lib/learner/presentation";

// Reads cookies() (via redirectToOnboardingIfNeeded) so this route is
// dynamically rendered regardless — see docs/engineering/deploy.md.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectToOnboardingIfNeeded();
  const parameters = await searchParams;
  const initialModuleId =
    typeof parameters.module === "string" ? parameters.module : null;
  const course = await readCourseSummary();
  // summarizeCourse already drops draft modules/lessons, so "kind ===
  // onboarding with lessons" here is exactly hasPublishedOnboarding
  // (course-summary-core.ts) — no second file read needed.
  const hasPublishedOnboarding = Boolean(
    course?.modules.some(
      (module) => module.kind === "onboarding" && module.lessonCount > 0,
    ),
  );

  const modules =
    course?.modules
      // The onboarding module never appears on the learner's path (docs/
      // design/onboarding.md item 9) — it's real language, but it's shown
      // once, before the course, not as a course module.
      .filter((module) => module.kind !== "onboarding")
      .map((module) => {
        const lessons = module.lessons.map((lesson) => {
          const outcome = lessonOutcome(lesson.blocks);
          return {
            id: lesson.id,
            lessonNumber: lesson.lessonNumber,
            moduleLessonNumber: lesson.moduleLessonNumber,
            name: lesson.name,
            previewText: outcome?.spanish || lesson.previewText,
            outcomeEnglish: outcome?.english || lesson.name || "",
            stepCount: lesson.blocks.length,
          };
        });
        return {
          id: module.id,
          name: module.name,
          kind: module.kind,
          description: module.description,
          lessonCount: module.lessonCount,
          lessons,
        };
      }) ?? [];

  return (
    <LessonDashboard
      modules={modules}
      initialModuleId={initialModuleId}
      hasPublishedOnboarding={hasPublishedOnboarding}
    />
  );
}
