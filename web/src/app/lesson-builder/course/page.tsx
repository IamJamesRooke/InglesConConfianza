import Link from "next/link";

import { CourseArranger } from "@/components/lesson-builder/course-arranger";
import { CoverageMatrix } from "@/components/lesson-builder/coverage-matrix";
import { readCoverageReport } from "@/lib/lesson-builder/server/coverage-report";
import { readCourseView } from "@/lib/lesson-builder/server/course-view";

export const dynamic = "force-dynamic";

export default async function CoursePage() {
  const [course, report] = await Promise.all([
    readCourseView(),
    readCoverageReport(),
  ]);

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Course</h1>
          <Link
            href="/lesson-builder"
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            ← Lesson Builder
          </Link>
          <p className="w-full text-sm text-muted-foreground">
            Group lessons into modules, each with one promise and the sentence
            that proves it. Drag lessons within and between modules.
          </p>
        </div>

        <CourseArranger
          initialModules={course.modules}
          lessons={course.lessons}
        />

        <div className="mt-10">
          <h2 className="mb-1 text-xl font-semibold tracking-tight">Coverage</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {report.concepts.length} concept
            {report.concepts.length === 1 ? "" : "s"} taught across{" "}
            {report.lessons.length} lesson
            {report.lessons.length === 1 ? "" : "s"}, coldest first. A ring is
            where a concept is introduced; a dot is reinforcement.
          </p>
          <CoverageMatrix report={report} />
        </div>
      </div>
    </main>
  );
}
