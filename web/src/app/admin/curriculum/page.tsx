import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { topicTitles } from "@/components/curriculum/topic-presentation";
import {
  resolveCurriculumPath,
  type CurriculumNavigationFamilyWithCounts,
} from "@/lib/curriculum/navigation";
import { readConceptCoverage } from "@/lib/curriculum/server/coverage";
import {
  curriculumPageSize,
  readCurriculumNavigationCounts,
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
  const requestedLeaf = first(parameters.leaf) ?? "";
  const legacyFacets = (first(parameters.facets) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) =>
      topic?.facetButtons.some((facet) => facet.collection === value),
    );
  const browse = topic
    ? resolveCurriculumPath(
        topic,
        first(parameters.family) ?? "",
        requestedLeaf,
        legacyFacets,
      )
    : null;
  const outsideFamilies = Boolean(
    topic && first(parameters.family) === "outside-families" && !requestedLeaf,
  );
  const unresolvedLegacyFacets =
    browse?.leaf || legacyFacets.length <= 1 ? [] : legacyFacets;

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
  const coverageParam = first(parameters.taught);
  const coverageFilter: CoverageFilter =
    coverageParam === "taught" || coverageParam === "untaught"
      ? coverageParam
      : "all";
  const search = (first(parameters.search) ?? "").trim();
  const collection = (first(parameters.collection) ?? "").trim();

  const coverage = await readConceptCoverage();
  const coveredIds = [...coverage.keys()];
  const idFilter =
    coverageFilter === "taught"
      ? ({ in: coveredIds } as const)
      : coverageFilter === "untaught"
        ? ({ notIn: coveredIds } as const)
        : undefined;
  const requiredCollections = [
    ...(topic ? [topic.baseCollection] : []),
    ...(browse?.leaf ? [browse.leaf.collection] : []),
    ...unresolvedLegacyFacets,
  ];
  const familyCollections =
    browse?.family && !browse.leaf
      ? browse.family.leaves.map((leaf) => leaf.collection)
      : [];
  const allBrowseCollections =
    browse?.families.flatMap((family) =>
      family.leaves.map((leaf) => leaf.collection),
    ) ?? [];

  const [curriculum, navigationCounts] = await Promise.all([
    readCurriculumPage({
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
      search,
      collection,
      role,
      sort,
      requireCollections: requiredCollections,
      anyCollections: familyCollections,
      excludeAnyCollections: outsideFamilies ? allBrowseCollections : [],
      idFilter,
    }),
    topic && browse
      ? readCurriculumNavigationCounts({
          baseCollection: topic.baseCollection,
          families: browse.families,
          search,
          collection,
          role,
          idFilter,
        })
      : Promise.resolve(new Map<string, Set<string>>()),
  ]);

  const configuredFamilies: CurriculumNavigationFamilyWithCounts[] =
    browse?.families.map((family) => {
      const familyIds = new Set<string>();
      const leaves = family.leaves.map((leaf) => {
        const ids = navigationCounts.get(leaf.collection) ?? new Set<string>();
        for (const id of ids) familyIds.add(id);
        return { ...leaf, count: ids.size };
      });
      return { ...family, count: familyIds.size, leaves };
    }) ?? [];
  const mappedIds = new Set(
    allBrowseCollections.flatMap((name) => [
      ...(navigationCounts.get(name) ?? new Set<string>()),
    ]),
  );
  const topicIds = navigationCounts.get("__topic__") ?? new Set<string>();
  const outsideCount = [...topicIds].filter((id) => !mappedIds.has(id)).length;
  const families = [
    ...configuredFamilies,
    ...(outsideCount > 0
      ? [
          {
            id: "outside-families",
            label: "Outside these families",
            count: outsideCount,
            leaves: [],
          },
        ]
      : []),
  ];

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

  const displayTopic = topic
    ? topicTitles[topic.slug] ?? topic.title
    : "All curriculum";
  const scopeLabel = outsideFamilies
    ? "Outside these families"
    : browse?.leaf?.label ?? browse?.family?.label ?? displayTopic;

  return (
    <main className="flex-1 bg-background px-3 py-4 text-foreground sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1800px]">
        <CurriculumTable
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
            title: topicTitles[entry.slug] ?? entry.title,
          }))}
          activeTopic={
            topic
              ? {
                  slug: topic.slug,
                  title: displayTopic,
                  baseCollection: topic.baseCollection,
                }
              : null
          }
          families={families}
          activeFamilyId={
            outsideFamilies ? "outside-families" : browse?.family?.id ?? ""
          }
          activeLeafCollection={browse?.leaf?.collection ?? ""}
          legacyFacets={unresolvedLegacyFacets}
          scopeLabel={scopeLabel}
          topicCount={navigationCounts.get("__topic__")?.size ?? 0}
          resultKey={[
            topic?.slug ?? "",
            outsideFamilies
              ? "outside-families"
              : browse?.family?.id ?? "",
            browse?.leaf?.collection ?? "",
            unresolvedLegacyFacets.join(","),
            collection,
            role,
            coverageFilter,
            search,
            sort,
            curriculum.page,
          ].join(":")}
        />
      </div>
    </main>
  );
}
