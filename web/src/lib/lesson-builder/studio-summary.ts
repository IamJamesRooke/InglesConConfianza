import type { CourseSummary } from "@/lib/lesson-builder/server/course-summary";
import type { CoverageReport } from "@/lib/lesson-builder/server/coverage-report";
import { getSentenceValidationIssueCount } from "@/lib/lesson-builder/utils";

export type StudioIssue = {
  lessonId: string;
  lessonName: string;
  lessonNumber: number;
  message: string;
};

export type StudioSummary = {
  structuralIssues: StudioIssue[];
  declaredConceptCount: number;
  trashedConcepts: CoverageReport["trashed"];
};

export function buildStudioSummary(
  course: CourseSummary,
  coverage: CoverageReport,
): StudioSummary {
  const structuralIssues: StudioIssue[] = [];

  for (const lesson of course.lessons) {
    const lessonName = lesson.name?.trim() || `Lesson ${lesson.lessonNumber}`;

    if (lesson.blocks.length === 0) {
      structuralIssues.push({
        lessonId: lesson.id,
        lessonName,
        lessonNumber: lesson.lessonNumber,
        message: "This lesson has no content blocks.",
      });
    }

    for (const block of lesson.blocks) {
      if (block.type === "explanation" && !block.contentMarkdown.trim()) {
        structuralIssues.push({
          lessonId: lesson.id,
          lessonName,
          lessonNumber: lesson.lessonNumber,
          message: "An explanation block is blank.",
        });
      }

      if (block.type === "sentence") {
        const issueCount = getSentenceValidationIssueCount(block);
        if (issueCount > 0) {
          structuralIssues.push({
            lessonId: lesson.id,
            lessonName,
            lessonNumber: lesson.lessonNumber,
            message: `${issueCount} practice validation issue${
              issueCount === 1 ? "" : "s"
            }.`,
          });
        }
      }
    }
  }

  return {
    structuralIssues,
    declaredConceptCount: coverage.concepts.length,
    trashedConcepts: coverage.trashed,
  };
}
