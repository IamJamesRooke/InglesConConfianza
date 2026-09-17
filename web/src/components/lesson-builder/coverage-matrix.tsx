import Link from "next/link";

import { ConceptQuickEdit } from "@/components/lesson-builder/concept-quick-edit";
import type { CoverageReport } from "@/lib/lesson-builder/server/coverage-report";

// Semantic tokens, not ad hoc hues: --success/--hint/--muted already carry
// the "just taught / cooling / cold" meaning elsewhere in the app.
function coldClasses(lessonsSinceLast: number) {
  if (lessonsSinceLast === 0)
    return "bg-[color-mix(in_oklch,var(--success)_16%,var(--card))] text-[var(--success-foreground)]";
  if (lessonsSinceLast <= 2) return "bg-muted text-muted-foreground";
  return "bg-[var(--state-help-soft)] text-[color-mix(in_oklch,var(--hint)_72%,black)]";
}

// Reuses the same `.role-*` badge tokens as the curriculum table (see
// globals.css) instead of a parallel, ad hoc colour scale — one priority
// ladder for both surfaces. `line-through` is the only extra treatment
// Trash needs here.
function roleClasses(role: string) {
  return role === "Trash" ? "line-through" : "";
}

// The concept × lesson spiral matrix (coldest first) plus the Requested /
// Missing tag rails. Rows are click-to-edit.
export function CoverageMatrix({ report }: { report: CoverageReport }) {
  const introducedPerLesson = new Map<number, number>();
  const lessonByNumber = new Map(
    report.lessons.map((lesson) => [lesson.number, lesson]),
  );
  const lessonHref = (lessonNumber: number) => {
    const lesson = lessonByNumber.get(lessonNumber);
    return lesson
      ? `/admin/lesson-builder?lesson=${encodeURIComponent(lesson.id)}`
      : "/admin/lesson-builder";
  };

  for (const concept of report.concepts) {
    introducedPerLesson.set(
      concept.firstLesson,
      (introducedPerLesson.get(concept.firstLesson) ?? 0) + 1,
    );
  }

  return (
    <>
      <section className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-foreground">
          Teaching Review
        </h2>
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <p className="rounded-lg bg-muted/60 px-3 py-2">
            Was every assessed phrase introduced before practice?
          </p>
          <p className="rounded-lg bg-muted/60 px-3 py-2">
            Does the final answer sound useful outside the lesson?
          </p>
          <p className="rounded-lg bg-muted/60 px-3 py-2">
            Do reused concepts appear with enough spacing to feel natural?
          </p>
        </div>
      </section>

      {report.concepts.length === 0 ? (
        <p className="rounded-[16px] border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No concepts linked yet. Add them under a lesson title in the Lesson
          Builder.
        </p>
      ) : (
        <div className="w-fit max-w-full overflow-x-auto rounded-[16px] border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="border-collapse text-[13px]">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-10 w-[24rem] bg-muted px-3 py-2 text-left font-semibold">
                  Concept
                </th>
                <th className="w-10 px-2 py-2 text-center font-semibold">×</th>
                <th className="w-14 px-2 py-2 text-center font-semibold">Cold</th>
                {report.lessons.map((lesson) => (
                  <th
                    key={lesson.id}
                    title={lesson.name ?? `Lesson ${lesson.number}`}
                    className="w-11 px-1 py-2 text-center font-semibold"
                  >
                    <div>{lesson.number}</div>
                    <div className="font-normal text-muted-foreground/70">
                      {introducedPerLesson.get(lesson.number) ?? 0
                        ? `+${introducedPerLesson.get(lesson.number)}`
                        : ""}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.concepts.map((concept) => {
                const taught = new Set(concept.lessonNumbers);
                return (
                  <tr key={concept.conceptId} className="border-t border-border">
                    <td className="sticky left-0 z-10 w-[24rem] bg-card px-2 py-1">
                      <ConceptQuickEdit
                        conceptId={concept.conceptId}
                        initial={{
                          spanish: concept.spanish,
                          english: concept.english,
                          exampleSpanish: concept.exampleSpanish,
                          exampleEnglish: concept.exampleEnglish,
                          role: concept.role,
                          collections: concept.collections,
                        }}
                        className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition hover:bg-muted"
                      >
                        <span
                          className={`role-${concept.role} shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--role-background)] text-[var(--role-foreground)] ${roleClasses(concept.role)}`}
                        >
                          {concept.role}
                        </span>
                        <span className="truncate">
                          <span className="font-semibold text-foreground">
                            {concept.spanish}
                          </span>
                          <span className="text-muted-foreground"> → </span>
                          <span className="text-muted-foreground">
                            {concept.english}
                          </span>
                        </span>
                      </ConceptQuickEdit>
                    </td>
                    <td className="px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                      {concept.timesTaught}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span
                        className={`inline-block rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${coldClasses(concept.lessonsSinceLast)}`}
                      >
                        {concept.lessonsSinceLast === 0
                          ? "now"
                          : concept.lessonsSinceLast}
                      </span>
                    </td>
                    {report.lessons.map((lesson) => {
                      const isTaught = taught.has(lesson.number);
                      const isIntro = concept.firstLesson === lesson.number;
                      return (
                        <td key={lesson.id} className="px-1 py-1.5 text-center">
                          {isTaught ? (
                            <span
                              className={`inline-block size-2.5 rounded-full ${
                                isIntro
                                  ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                                  : "bg-primary"
                              }`}
                              aria-label={isIntro ? "introduced" : "reinforced"}
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="inline-block size-1 rounded-full bg-border"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {report.requested.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Requested — not in the curriculum yet ({report.requested.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.requested.map((entry) => (
              <span
                key={entry.label}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[color-mix(in_oklch,var(--hint)_45%,var(--border))] bg-[var(--state-help-soft)] px-2.5 py-1 text-xs font-medium text-[color-mix(in_oklch,var(--hint)_72%,black)]"
              >
                {entry.label}
                {entry.lessonNumbers.map((lessonNumber) => (
                  <Link
                    key={lessonNumber}
                    href={lessonHref(lessonNumber)}
                    className="rounded px-1 text-[color-mix(in_oklch,var(--hint)_72%,black)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hint)]"
                  >
                    L{lessonNumber}
                  </Link>
                ))}
              </span>
            ))}
          </div>
        </section>
      )}

      {report.trashed.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
            References now marked trash ({report.trashed.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.trashed.map((entry) => (
              <span
                key={entry.conceptId}
                className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
              >
                <ConceptQuickEdit
                  conceptId={entry.conceptId}
                  initial={{
                    spanish: entry.spanish,
                    english: entry.english,
                    exampleSpanish: entry.exampleSpanish,
                    exampleEnglish: entry.exampleEnglish,
                    role: entry.role,
                    collections: entry.collections,
                  }}
                  className="font-semibold hover:underline"
                >
                  {entry.spanish}
                </ConceptQuickEdit>
                {entry.lessonNumbers.map((lessonNumber) => (
                  <Link
                    key={lessonNumber}
                    href={lessonHref(lessonNumber)}
                    className="rounded px-1 text-destructive underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                  >
                    L{lessonNumber}
                  </Link>
                ))}
              </span>
            ))}
          </div>
        </section>
      )}

      {report.missing.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
            Missing — linked to a concept no longer in the catalog (
            {report.missing.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.missing.map((entry) => (
              <span
                key={entry.conceptId}
                title={entry.conceptId}
                className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
              >
                {entry.label}
                {entry.lessonNumbers.map((lessonNumber) => (
                  <Link
                    key={lessonNumber}
                    href={lessonHref(lessonNumber)}
                    className="rounded px-1 text-destructive underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                  >
                    L{lessonNumber}
                  </Link>
                ))}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
