import { BuilderNav } from "@/components/lesson-builder/builder-nav";
import { CoverageMatrix } from "@/components/lesson-builder/coverage-matrix";
import { readCoverageReport } from "@/lib/lesson-builder/server/coverage-report";

export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  const report = await readCoverageReport();
  const reusedConceptCount = report.concepts.filter(
    (concept) => concept.timesTaught > 1,
  ).length;
  const introductionCount = new Set(
    report.concepts.map((concept) => concept.firstLesson),
  ).size;

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <BuilderNav active="coverage" />
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Declared concept coverage
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              Concept Review
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Coverage comes from lesson concept chips. It excludes trash and
              does not infer mastery from lesson text.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-96">
            <Metric label="Linked" value={report.concepts.length} />
            <Metric label="Reused" value={reusedConceptCount} />
            <Metric label="Intro lessons" value={introductionCount} />
          </div>
        </header>

        <CoverageMatrix report={report} />
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
      <p className="text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
