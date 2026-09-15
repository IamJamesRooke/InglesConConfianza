/**
 * Shared shape of the learner dashboard's props, used by `LessonDashboard` and
 * the presentation pieces it composes (`LessonRow`). The server component in
 * `src/app/page.tsx` builds these objects structurally.
 */

export type LearnerLesson = {
  id: string;
  lessonNumber: number;
  moduleLessonNumber: number;
  name: string | null;
  /** The lesson's Spanish outcome sentence — the home page's editorial copy. */
  previewText: string;
  /** The matching English answer, shown as the hero's second headline line. */
  answerText: string;
  stepCount: number;
};

export type LearnerModule = {
  id: string;
  name: string | null;
  kind: "course" | "onboarding";
  lessonCount: number;
  lessons: LearnerLesson[];
};
