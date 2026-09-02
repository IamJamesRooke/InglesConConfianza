import { notFound } from "next/navigation";

import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { readCurriculumPage } from "@/lib/curriculum/server/curriculum-store";
import type { CurriculumRole } from "@/lib/curriculum/types";
import { CURRICULUM_TOPICS, findCurriculumTopic } from "@/lib/curriculum/topics";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CURRICULUM_TOPICS.map((topic) => ({ topic: topic.slug }));
}

type PageProps = {
  params: Promise<{ topic: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CurriculumTopicPage({
  params,
  searchParams,
}: PageProps) {
  const { topic: slug } = await params;
  const topic = findCurriculumTopic(slug);
  if (!topic) notFound();

  const parameters = await searchParams;
  const requestedRole = first(parameters.role);
  const role: CurriculumRole | "all" =
    requestedRole === "core" ||
    requestedRole === "supporting" ||
    requestedRole === "reference" ||
    requestedRole === "trash"
      ? requestedRole
      : "all";
  const activeFacets = (first(parameters.facets) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) =>
      topic.facetButtons.some((facet) => facet.collection === value),
    );
  const requestedPage = Number.parseInt(first(parameters.page) ?? "1", 10);

  const curriculum = await readCurriculumPage({
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    search: (first(parameters.search) ?? "").trim(),
    collection: (first(parameters.collection) ?? "").trim(),
    role,
    requireCollections: [topic.baseCollection, ...activeFacets],
  });

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">{topic.title}</h1>
          <p className="mt-2 text-muted-foreground">{topic.description}</p>
        </div>
        <CurriculumTable
          key={`${slug}:${activeFacets.join(",")}:${curriculum.page}:${curriculum.totalConcepts}:${curriculum.search}:${curriculum.collection}:${curriculum.role}`}
          initialConcepts={curriculum.concepts}
          availableCollections={curriculum.availableCollections}
          totalConcepts={curriculum.totalConcepts}
          page={curriculum.page}
          pageCount={curriculum.pageCount}
          filters={{
            search: curriculum.search,
            collection: curriculum.collection,
            role: curriculum.role,
          }}
          lockedCollections={[topic.baseCollection]}
          quickFacets={topic.facetButtons}
          activeFacets={activeFacets}
        />
      </div>
    </main>
  );
}
