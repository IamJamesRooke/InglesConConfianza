import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  CircleAlert,
  ClipboardList,
  DatabaseZap,
  FileText,
  Languages,
  PenLine,
} from "lucide-react";
import Link from "next/link";

import { buildStudioSummary } from "@/lib/lesson-builder/studio-summary";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";
import { readCoverageReport } from "@/lib/lesson-builder/server/coverage-report";

export const dynamic = "force-dynamic";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default async function AdminStudioPage() {
  const courseResult = await readCourse();
  if (!courseResult.course) {
    return <CourseUnavailable />;
  }

  const course = courseResult.course;
  const coverageResult = await readCoverage();
  const studio = coverageResult.report
    ? buildStudioSummary(course, coverageResult.report)
    : null;

  return (
    <main className="min-h-full flex-1 bg-[var(--surface)] px-4 py-7 text-foreground sm:px-6 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <section className="border-b border-border pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <PenLine className="size-3.5" aria-hidden="true" />
              Course workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">
              Studio
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Shape clear, practical English lessons for Spanish-speaking adults.
            </p>
          </div>
          <Link
            href="/admin/lesson-builder"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:mt-0"
          >
            Open Lesson Builder
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

        <section aria-label="Course summary" className="grid border-b border-border sm:grid-cols-3">
          <SummaryMetric icon={Boxes} label="Modules" value={course.modules.length} />
          <SummaryMetric icon={FileText} label="Lessons" value={course.lessonCount} />
          <SummaryMetric
            icon={BookOpenCheck}
            label="Teaching blocks"
            value={course.explanationCount + course.practiceCount}
            detail={`${plural(course.explanationCount, "explanation")} · ${plural(course.practiceCount, "practice")}`}
          />
        </section>

        <section className="py-8">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Course modules</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ordered as learners encounter them.
              </p>
            </div>
            <Link
              href="/"
              className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              View learner experience
            </Link>
          </div>

          {course.modules.length === 0 ? (
            <EmptyCourse />
          ) : (
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border">
              {course.modules.map((module, index) => (
                <article
                  key={module.id}
                  className="grid gap-5 bg-background p-5 transition hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Module {index + 1}
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold">
                      {module.name?.trim() || `Untitled module ${index + 1}`}
                    </h3>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {module.lessons[0]?.previewText ||
                        "No lesson content yet. Open the Builder to begin this module."}
                    </p>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">
                      {plural(module.lessonCount, "lesson")} · {plural(module.explanationCount, "explanation")} · {plural(module.practiceCount, "practice")}
                    </p>
                  </div>
                  <Link
                    href={
                      module.firstLessonId
                        ? `/admin/lesson-builder?lesson=${encodeURIComponent(module.firstLessonId)}`
                        : `/admin/lesson-builder?module=${encodeURIComponent(module.id)}`
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition hover:border-primary/35 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    Open module
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-8 border-t border-border py-8 lg:grid-cols-2">
          <StructuralChecks issues={studio?.structuralIssues ?? []} />
          <ConceptCoverage
            report={coverageResult.report}
            unavailable={coverageResult.unavailable}
            declaredConceptCount={studio?.declaredConceptCount ?? 0}
            trashedCount={studio?.trashedConcepts.length ?? 0}
          />
        </section>
      </div>
    </main>
  );
}

async function readCoverage() {
  try {
    return { report: await readCoverageReport(), unavailable: false };
  } catch {
    return { report: null, unavailable: true };
  }
}

async function readCourse() {
  try {
    return { course: await readCourseSummary() };
  } catch {
    return { course: null };
  }
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="border-border py-5 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function StructuralChecks({ issues }: { issues: ReturnType<typeof buildStudioSummary>["structuralIssues"] }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-base font-semibold">Structural checks</h2>
      </div>
      {issues.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">No structural issues detected.</p>
      ) : (
        <ul className="mt-3 space-y-2" aria-label="Lessons needing attention">
          {issues.slice(0, 5).map((issue, index) => (
            <li key={`${issue.lessonId}-${index}`}>
              <Link
                href={`/admin/lesson-builder?lesson=${encodeURIComponent(issue.lessonId)}`}
                className="group flex items-start gap-3 rounded-md py-1 text-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                <span>
                  <span className="font-medium">{issue.lessonName}</span>
                  <span className="text-muted-foreground"> · {issue.message}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {issues.length > 5 && (
        <p className="mt-3 text-xs text-muted-foreground">{issues.length - 5} more issues are available in their lessons.</p>
      )}
    </div>
  );
}

function ConceptCoverage({
  report,
  unavailable,
  declaredConceptCount,
  trashedCount,
}: {
  report: Awaited<ReturnType<typeof readCoverageReport>> | null;
  unavailable: boolean;
  declaredConceptCount: number;
  trashedCount: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-base font-semibold">Declared concept coverage</h2>
      </div>
      {unavailable || !report ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Coverage is unavailable because the curriculum database could not be read. Course overview remains available.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {plural(declaredConceptCount, "linked non-trash concept")} across this course.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <CoverageLink href="/admin/lesson-builder/coverage" label={`${plural(report.requested.length, "unlinked label")}`} />
            <CoverageLink href="/admin/lesson-builder/coverage" label={`${plural(report.missing.length, "missing reference")}`} />
            <CoverageLink href="/admin/lesson-builder/coverage" label={`${plural(trashedCount, "reference now marked trash")}`} />
          </div>
          <Link
            href="/admin/lesson-builder/coverage"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            Open coverage report
            <DatabaseZap className="size-3.5" aria-hidden="true" />
          </Link>
        </>
      )}
    </div>
  );
}

function CoverageLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground underline decoration-border underline-offset-4 transition hover:text-foreground hover:decoration-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      {label}
    </Link>
  );
}

function EmptyCourse() {
  return (
    <div className="border border-dashed border-border bg-background px-5 py-8 text-sm text-muted-foreground">
      There are no course modules yet. Create the first module in Lesson Builder.
    </div>
  );
}

function CourseUnavailable() {
  return (
    <main className="min-h-full flex-1 bg-[var(--surface)] px-4 py-7 text-foreground sm:px-6 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <section className="border-b border-border pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <PenLine className="size-3.5" aria-hidden="true" />
              Course workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">Studio</h1>
          </div>
          <Link
            href="/admin/lesson-builder"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:mt-0"
          >
            Open Lesson Builder
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
        <section className="py-8">
          <div className="max-w-xl border border-dashed border-border bg-background p-5">
            <h2 className="text-base font-semibold">Course overview unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The lesson file could not be read. No lesson or curriculum data was changed.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
