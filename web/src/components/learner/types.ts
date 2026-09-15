/**
 * Shared shape of the learner dashboard's props, used by `LessonDashboard` and
 * the presentation pieces it composes (`ConceptPills`, `LessonRow`). The server
 * component in `src/app/page.tsx` builds these objects structurally.
 */

export type LearnerConcept = {
  id: string;
  spanish: string;
  english: string;
};

export type LearnerLesson = {
  id: string;
  lessonNumber: number;
  moduleLessonNumber: number;
  name: string | null;
  previewText: string;
  stepCount: number;
  concepts: LearnerConcept[];
};

export type LearnerModule = {
  id: string;
  name: string | null;
  kind: "course" | "onboarding";
  lessonCount: number;
  lessons: LearnerLesson[];
};
