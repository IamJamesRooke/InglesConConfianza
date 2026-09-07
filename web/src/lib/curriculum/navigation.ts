import { CURRICULUM_TOPICS, type CurriculumTopic } from "@/lib/curriculum/topics";

// Every collection that is a facet button on some topic page.
const ALL_FACET_COLLECTIONS = new Set(
  CURRICULUM_TOPICS.flatMap((topic) =>
    topic.facetButtons.map((facet) => facet.collection),
  ),
);

// Batch 5 (2026-09-07) merged size-driven numbered facet families
// (topic:<stem>-<N>) into one group per <stem>. Old deep links carrying a
// numbered collection still resolve: map them to the surviving stem.
export function canonicalFacetCollection(name: string): string {
  if (ALL_FACET_COLLECTIONS.has(name)) return name;
  const stem = name.match(/^(topic:.+?)(?:-\d+)+$/)?.[1];
  return stem && ALL_FACET_COLLECTIONS.has(stem) ? stem : name;
}

export type CurriculumNavigationLeaf = {
  collection: string;
  label: string;
};

export type CurriculumNavigationFamily = {
  id: string;
  label: string;
  leaves: CurriculumNavigationLeaf[];
};

export type CurriculumNavigationFamilyWithCounts =
  Omit<CurriculumNavigationFamily, "leaves"> & {
    count: number;
    leaves: Array<CurriculumNavigationLeaf & { count: number }>;
  };

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

// Family display order on the dictionary-style pages, whose buttons are
// listed by headword rather than grouped by family in topics.ts.
const MAPPING_FAMILY_ORDER = [
  "A–E",
  "F–J",
  "K–O",
  "P–T",
  "U–Z",
  "Other",
  "Common confusions",
];
const MAPPING_TOPICS = new Set([
  "mappings",
  "en-mappings",
  "phrasal-verbs-by-root",
  "phrasal-verbs-by-particle",
]);

// Topic -> Family is explicit config: every facet button in topics.ts carries
// a `family` label (Batch 6, 2026-09-07 — replaced name-based inference).
// This lookup stays for the topic-presentation re-export.
export function facetGroup(topic: string | undefined, collection: string) {
  const entry = CURRICULUM_TOPICS.find((t) => t.slug === topic);
  return (
    entry?.facetButtons.find((f) => f.collection === collection)?.family ?? ""
  );
}

export function buildCurriculumFamilies(
  topic: CurriculumTopic,
): CurriculumNavigationFamily[] {
  const grouped = new Map<string, CurriculumNavigationLeaf[]>();

  for (const facet of topic.facetButtons) {
    grouped.set(facet.family, [
      ...(grouped.get(facet.family) ?? []),
      { collection: facet.collection, label: facet.label },
    ]);
  }

  const entries = [...grouped];
  if (MAPPING_TOPICS.has(topic.slug)) {
    entries.sort(
      ([left], [right]) =>
        MAPPING_FAMILY_ORDER.indexOf(left) -
        MAPPING_FAMILY_ORDER.indexOf(right),
    );
  }

  return entries.map(([label, leaves]) => ({
    id: slugify(label),
    label,
    leaves,
  }));
}

export function resolveCurriculumPath(
  topic: CurriculumTopic,
  requestedFamily: string,
  requestedLeaf: string,
  legacyFacets: string[],
) {
  const families = buildCurriculumFamilies(topic);
  const legacyLeaf =
    legacyFacets.length === 1 ? legacyFacets[0] : "";
  const leafCollection = requestedLeaf || legacyLeaf;
  const leafFamily = leafCollection
    ? families.find((family) =>
        family.leaves.some((leaf) => leaf.collection === leafCollection),
      )
    : undefined;
  const requested = families.find((family) => family.id === requestedFamily);
  const family = leafFamily ?? requested;
  const leaf = family?.leaves.find(
    (candidate) => candidate.collection === leafCollection,
  );

  return { families, family, leaf };
}
