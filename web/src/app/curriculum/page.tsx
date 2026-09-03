import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { readConceptCoverage } from "@/lib/curriculum/server/coverage";
import {
  curriculumPageSize,
  readCurriculumPage,
} from "@/lib/curriculum/server/curriculum-store";
import type { CurriculumRole } from "@/lib/curriculum/types";
import { CURRICULUM_TOPICS, findCurriculumTopic } from "@/lib/curriculum/topics";

type CoverageFilter = "all" | "taught" | "untaught";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CurriculumPage({ searchParams }: PageProps) {
  const parameters = await searchParams;

  const topic = findCurriculumTopic(first(parameters.topic) ?? "");
  const quickFacets = topic?.facetButtons ?? [];
  const activeFacets = (first(parameters.facets) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => quickFacets.some((facet) => facet.collection === value));

  const requestedPage = Number.parseInt(first(parameters.page) ?? "1", 10);
  const requestedRole = first(parameters.role);
  const role: CurriculumRole | "all" =
    requestedRole === "core" ||
    requestedRole === "supporting" ||
    requestedRole === "reference" ||
    requestedRole === "trash"
      ? requestedRole
      : "all";
  const sortParam = first(parameters.sort);
  const sort =
    sortParam === "spanish" ||
    sortParam === "spanish-desc" ||
    sortParam === "english" ||
    sortParam === "english-desc" ||
    sortParam === "role"
      ? sortParam
      : ("default" as const);

  const taughtParam = first(parameters.taught);
  const coverageFilter: CoverageFilter =
    taughtParam === "taught" || taughtParam === "untaught"
      ? taughtParam
      : "all";

  const coverage = await readConceptCoverage();
  const coveredIds = [...coverage.keys()];
  const idFilter =
    coverageFilter === "taught"
      ? ({ in: coveredIds } as const)
      : coverageFilter === "untaught"
        ? ({ notIn: coveredIds } as const)
        : undefined;

  const curriculum = await readCurriculumPage({
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    search: (first(parameters.search) ?? "").trim(),
    collection: (first(parameters.collection) ?? "").trim(),
    role,
    sort,
    requireCollections: topic
      ? [topic.baseCollection, ...activeFacets]
      : [],
    idFilter,
  });

  const visibleCoverage: Record<
    string,
    { lessonId: string; lessonNumber: number; lessonName: string | null }
  > = {};
  for (const concept of curriculum.concepts) {
    const hit = coverage.get(concept.id);
    if (hit) {
      visibleCoverage[concept.id] = {
        lessonId: hit.lessonId,
        lessonNumber: hit.lessonNumber,
        lessonName: hit.lessonName,
      };
    }
  }

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            {topic ? topic.title : "Curriculum"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {topic
              ? topic.description
              : "Language concepts that combine vocabulary and structure."}
          </p>
        </div>

        <CurriculumTable
          key={`${topic?.slug ?? ""}:${activeFacets.join(",")}:${curriculum.page}:${curriculum.totalConcepts}:${curriculum.search}:${curriculum.collection}:${curriculum.role}:${curriculum.sort}:${coverageFilter}`}
          initialConcepts={curriculum.concepts}
          totalConcepts={curriculum.totalConcepts}
          page={curriculum.page}
          pageCount={curriculum.pageCount}
          pageSize={curriculumPageSize}
          coverage={visibleCoverage}
          coverageFilter={coverageFilter}
          filters={{
            search: curriculum.search,
            collection: curriculum.collection,
            role: curriculum.role,
            sort: curriculum.sort,
          }}
          macrotags={CURRICULUM_TOPICS.map((entry) => ({
            slug: entry.slug,
            title: entry.title,
          }))}
          activeTopic={topic ? { slug: topic.slug, title: topic.title } : null}
          quickFacets={quickFacets}
          activeFacets={activeFacets}
        />
      </div>
    </main>
  );
}
