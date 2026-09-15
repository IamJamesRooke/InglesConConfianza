import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { topicTitles } from "@/components/curriculum/topic-presentation";
import {
  canonicalFacetCollection,
  resolveCurriculumPath,
  type CurriculumNavigationFamilyWithCounts,
} from "@/lib/curriculum/navigation";
import { readConceptCoverage } from "@/lib/curriculum/server/coverage";
import { readModuleSyllabusUsage } from "@/lib/curriculum/server/module-usage";
import {
  curriculumPageSize,
  readCurriculumNavigationCounts,
  readCurriculumPage,
  readLevelChecklistSummary,
} from "@/lib/curriculum/server/curriculum-store";
import {
  curriculumRoles,
  type CurriculumLevel,
  type CurriculumRole,
} from "@/lib/curriculum/types";
import {
  CURRICULUM_TOPICS,
  findCurriculumTopic,
} from "@/lib/curriculum/topics";

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
    .filter(Boolean)
    .map((value) => canonicalFacetCollection(value))
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
  const role: CurriculumRole | "all" = curriculumRoles.includes(
    requestedRole as CurriculumRole,
  )
    ? (requestedRole as CurriculumRole)
    : "all";
  // "Level ≤ N" ceiling, defaulting to Level 1: default only applies when the
  // URL carries neither `maxLevel` nor `role`. `maxLevel=0` is the filter's
  // "all levels" option (a literal "all" would be stripped from the URL by
  // useCurriculumNavigation, which treats "all" as "clear this param").
  const requestedMaxLevel = first(parameters.maxLevel);
  // No default ceiling any more: levels are retired (commit c298024d reset
  // every row to Unranked), so a default of "Level ≤ 1" silently hid nearly
  // everything, including results from the new module-usage filter below —
  // see docs/design/module-syllabus.md §7.
  const maxLevel: CurriculumLevel | undefined =
    requestedMaxLevel && /^[1-5]$/.test(requestedMaxLevel)
      ? (Number(requestedMaxLevel) as CurriculumLevel)
      : undefined;
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
  // "Used in a module / never used" — see docs/design/module-syllabus.md §7.
  // Levels are retired, so this replaces the old Level ≤ N ceiling as the
  // curriculum page's "what's actually required" signal.
  const usageParam = first(parameters.usage);
  const usageFilter: "all" | "used" | "never" =
    usageParam === "used" || usageParam === "never" ? usageParam : "all";
  const search = (first(parameters.search) ?? "").trim();
  const collection = (first(parameters.collection) ?? "").trim();

  const [coverage, moduleUsage] = await Promise.all([
    readConceptCoverage(),
    readModuleSyllabusUsage(),
  ]);
  const coveredIds = [...coverage.keys()];
  const usedInModuleIds = [...moduleUsage.keys()];
  // `usage` takes priority over `taught`/`untaught` when both are somehow
  // present — they're two different questions (incidentally covered by a
  // lesson vs. deliberately required by a module) surfaced through the same
  // control slot, per docs/design/module-syllabus.md §7.
  const idFilter =
    usageFilter === "used"
      ? ({ in: usedInModuleIds } as const)
      : usageFilter === "never"
        ? ({ notIn: usedInModuleIds } as const)
        : coverageFilter === "taught"
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

  const [curriculum, navigationCounts, levelChecklist] = await Promise.all([
    readCurriculumPage({
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
      search,
      collection,
      role,
      sort,
      maxLevel,
      requireCollections: requiredCollections,
      anyCollections: familyCollections,
      excludeAnyCollections: outsideFamilies ? allBrowseCollections : [],
      baseExclusions: topic?.baseExclusions ?? [],
      idFilter,
    }),
    topic && browse
      ? readCurriculumNavigationCounts({
          baseCollection: topic.baseCollection,
          baseExclusions: topic.baseExclusions ?? [],
          families: browse.families,
          search,
          collection,
          role,
          maxLevel,
          idFilter,
        })
      : Promise.resolve(new Map<string, Set<string>>()),
    maxLevel
      ? readLevelChecklistSummary(maxLevel, coveredIds)
      : Promise.resolve(null),
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

  const visibleModuleUsage: Record<
    string,
    { moduleId: string; moduleName: string | null; list: "main" | "review" }[]
  > = {};
  for (const concept of curriculum.concepts) {
    const hit = moduleUsage.get(concept.id);
    if (hit) visibleModuleUsage[concept.id] = hit;
  }
  const usageSummary = usageFilter !== "all" ? { used: usedInModuleIds.length } : null;

  const displayTopic = topic
    ? (topicTitles[topic.slug] ?? topic.title)
    : "All curriculum";
  const scopeLabel = outsideFamilies
    ? "Outside these families"
    : (browse?.leaf?.label ?? browse?.family?.label ?? displayTopic);

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
          levelChecklist={levelChecklist}
          moduleUsage={visibleModuleUsage}
          usageFilter={usageFilter}
          usageSummary={usageSummary}
          filters={{
            search: curriculum.search,
            collection: curriculum.collection,
            role: curriculum.role,
            sort: curriculum.sort,
            maxLevel: curriculum.maxLevel,
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
            outsideFamilies ? "outside-families" : (browse?.family?.id ?? "")
          }
          activeLeafCollection={browse?.leaf?.collection ?? ""}
          legacyFacets={unresolvedLegacyFacets}
          scopeLabel={scopeLabel}
          topicCount={navigationCounts.get("__topic__")?.size ?? 0}
          resultKey={[
            topic?.slug ?? "",
            outsideFamilies ? "outside-families" : (browse?.family?.id ?? ""),
            browse?.leaf?.collection ?? "",
            unresolvedLegacyFacets.join(","),
            collection,
            role,
            maxLevel ?? "",
            coverageFilter,
            usageFilter,
            search,
            sort,
            curriculum.page,
          ].join(":")}
        />
      </div>
    </main>
  );
}
