import Link from "next/link";

import { ConceptQuickEdit } from "@/components/lesson-builder/concept-quick-edit";
import type { CoverageReport } from "@/lib/lesson-builder/server/coverage-report";

function coldClasses(lessonsSinceLast: number) {
  if (lessonsSinceLast === 0) return "bg-emerald-100 text-emerald-700";
  if (lessonsSinceLast <= 2) return "bg-stone-100 text-stone-500";
  return "bg-amber-100 text-amber-800";
}

function roleClasses(role: string) {
  if (role === "core") return "bg-emerald-100 text-emerald-800";
  if (role === "supporting") return "bg-blue-100 text-blue-800";
  if (role === "trash") return "bg-red-100 text-red-700";
  return "bg-stone-200 text-stone-600";
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
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
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
        <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No concepts linked yet. Add them under a lesson title in the Lesson
          Builder.
        </p>
      ) : (
        <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
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
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleClasses(concept.role)}`}
                        >
                          {concept.role}
                        </span>
                        <span className="truncate">
                          <span className="font-semibold text-stone-900">
                            {concept.spanish}
                          </span>
                          <span className="text-stone-400"> → </span>
                          <span className="text-stone-600">
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
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
              >
                {entry.label}
                {entry.lessonNumbers.map((lessonNumber) => (
                  <Link
                    key={lessonNumber}
                    href={lessonHref(lessonNumber)}
                    className="rounded px-1 text-amber-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
            References now marked trash ({report.trashed.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.trashed.map((entry) => (
              <span
                key={entry.conceptId}
                className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
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
                    className="rounded px-1 text-red-500 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Missing — linked to a concept no longer in the catalog (
            {report.missing.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {report.missing.map((entry) => (
              <span
                key={entry.conceptId}
                title={entry.conceptId}
                className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
              >
                {entry.label}
                {entry.lessonNumbers.map((lessonNumber) => (
                  <Link
                    key={lessonNumber}
                    href={lessonHref(lessonNumber)}
                    className="rounded px-1 text-red-500 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
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
