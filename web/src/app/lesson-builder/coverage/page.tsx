import Link from "next/link";

import { readCoverageReport } from "@/lib/lesson-builder/server/coverage-report";
import type { CurriculumRole } from "@/lib/curriculum/types";

export const dynamic = "force-dynamic";

const roleClasses: Record<CurriculumRole, string> = {
  core: "bg-emerald-100 text-emerald-800",
  supporting: "bg-blue-100 text-blue-800",
  reference: "bg-stone-200 text-stone-600",
  trash: "bg-red-100 text-red-700",
};

function coldClasses(lessonsSinceLast: number) {
  if (lessonsSinceLast === 0) return "bg-emerald-100 text-emerald-700";
  if (lessonsSinceLast <= 2) return "bg-stone-100 text-stone-500";
  return "bg-amber-100 text-amber-800";
}

export default async function CoveragePage() {
  const report = await readCoverageReport();
  const lessonCount = report.lessons.length;

  // How many concepts each lesson introduces (first appearance).
  const introducedPerLesson = new Map<number, number>();
  for (const concept of report.concepts) {
    introducedPerLesson.set(
      concept.firstLesson,
      (introducedPerLesson.get(concept.firstLesson) ?? 0) + 1,
    );
  }

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Coverage</h1>
          <Link
            href="/lesson-builder"
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            ← Lesson Builder
          </Link>
          <p className="w-full text-sm text-muted-foreground">
            {report.concepts.length} concept
            {report.concepts.length === 1 ? "" : "s"} taught across {lessonCount}{" "}
            lesson{lessonCount === 1 ? "" : "s"}, coldest first. A ring is where a
            concept is introduced; a dot is reinforcement.
          </p>
        </div>

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
                  <th className="w-14 px-2 py-2 text-center font-semibold">
                    Cold
                  </th>
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
                    <tr
                      key={concept.conceptId}
                      className="border-t border-border"
                    >
                      <td className="sticky left-0 z-10 w-[24rem] bg-card px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleClasses[concept.role]}`}
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
                        </div>
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
                          <td
                            key={lesson.id}
                            className="px-1 py-1.5 text-center"
                          >
                            {isTaught ? (
                              <span
                                className={`inline-block size-2.5 rounded-full ${
                                  isIntro
                                    ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                                    : "bg-primary"
                                }`}
                                aria-label={
                                  isIntro ? "introduced" : "reinforced"
                                }
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
                  title={`Lesson ${entry.lessonNumbers.join(", ")}`}
                  className="rounded-full border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                >
                  {entry.label}
                  <span className="ml-1 text-amber-500">
                    L{entry.lessonNumbers.join(",")}
                  </span>
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
                  title={`${entry.conceptId} · Lesson ${entry.lessonNumbers.join(", ")}`}
                  className="rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                >
                  {entry.label}
                  <span className="ml-1 text-red-400">
                    L{entry.lessonNumbers.join(",")}
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
