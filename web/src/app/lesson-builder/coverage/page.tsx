import { BuilderNav } from "@/components/lesson-builder/builder-nav";
import { CoverageMatrix } from "@/components/lesson-builder/coverage-matrix";
import { readCoverageReport } from "@/lib/lesson-builder/server/coverage-report";

export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  const report = await readCoverageReport();

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Coverage</h1>
          <BuilderNav active="coverage" />
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {report.concepts.length} concept
          {report.concepts.length === 1 ? "" : "s"} taught across{" "}
          {report.lessons.length} lesson
          {report.lessons.length === 1 ? "" : "s"}, coldest first. A ring is
          where a concept is introduced; a dot is reinforcement. Click a concept
          to edit it.
        </p>

        <CoverageMatrix report={report} />
      </div>
    </main>
  );
}
