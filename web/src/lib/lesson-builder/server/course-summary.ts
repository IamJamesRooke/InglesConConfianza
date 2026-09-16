import "server-only";

import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";
import { summarizeCourse } from "@/lib/lesson-builder/course-summary-core";

export type {
  CourseLessonSummary,
  CourseModuleSummary,
  CourseSummary,
} from "@/lib/lesson-builder/course-summary-core";

export async function readCourseSummary() {
  const lessonFile = await readLessonFile();
  return summarizeCourse(lessonFile);
}
