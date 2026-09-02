import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { readCurriculumPage } from "@/lib/curriculum/server/curriculum-store";
import type { CurriculumRole } from "@/lib/curriculum/types";
import { CURRICULUM_TOPICS, findCurriculumTopic } from "@/lib/curriculum/topics";

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
    sortParam === "role"
      ? sortParam
      : ("default" as const);

  const curriculum = await readCurriculumPage({
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    search: (first(parameters.search) ?? "").trim(),
    collection: (first(parameters.collection) ?? "").trim(),
    role,
    sort,
    requireCollections: topic
      ? [topic.baseCollection, ...activeFacets]
      : [],
  });

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">
            {topic ? topic.title : "Curriculum"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {topic
              ? topic.description
              : "Language concepts that combine vocabulary and structure."}
          </p>
        </div>

        <CurriculumTable
          key={`${topic?.slug ?? ""}:${activeFacets.join(",")}:${curriculum.page}:${curriculum.totalConcepts}:${curriculum.search}:${curriculum.collection}:${curriculum.role}:${curriculum.sort}`}
          initialConcepts={curriculum.concepts}
          totalConcepts={curriculum.totalConcepts}
          page={curriculum.page}
          pageCount={curriculum.pageCount}
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
