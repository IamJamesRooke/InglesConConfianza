import type { CurriculumTopic } from "@/lib/curriculum/topics";

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

function alphabeticFamily(label: string) {
  const first = label
    .replace(/^(the|to)\s+/iu, "")
    .normalize("NFKD")
    .replace(/[^a-z]/giu, "")
    .charAt(0)
    .toLocaleUpperCase();
  if (!first || first < "A" || first > "Z") return "Other";
  if (first <= "E") return "A–E";
  if (first <= "J") return "F–J";
  if (first <= "O") return "K–O";
  if (first <= "T") return "P–T";
  return "U–Z";
}

const exploreFamilyLabels: Record<string, string> = {
  pronouns: "Pronoun types",
  determiners: "Determiner types",
  interrogatives: "Question-word roles",
  numbers: "Number groups",
  expressions: "Expression groups",
  connectors: "Connector types",
  prepositions: "Preposition groups",
  "questions-negation": "Question & negative patterns",
  imperatives: "Command types",
  collocations: "Verb groups",
};

function verbFamily(collection: string) {
  if (/^topic:verb-(tobe|ser|estar|existence)/u.test(collection)) {
    return "Being & existence";
  }
  if (/^topic:verb-(perfect|modal|wishes|hoping)/u.test(collection)) {
    return "Modals, time & possibility";
  }
  if (/^topic:verb-(communication|asking|offering)/u.test(collection)) {
    return "Communication";
  }
  if (/^topic:verb-(thinking|deciding|knowing|learning|remembering)/u.test(collection)) {
    return "Thinking & learning";
  }
  if (/^topic:verb-(seeing|watching|perception|feelings)/u.test(collection)) {
    return "Perception & feelings";
  }
  if (/^topic:verb-(movement|locomotion|following)/u.test(collection)) {
    return "Movement";
  }
  if (/^topic:verb-(possession|tomar|dar|giving|removing|taking|keeping|quedar|carrying|bringing)/u.test(collection)) {
    return "Possession & transfer";
  }
  if (/^topic:verb-(eating|daily|work|money)/u.test(collection)) {
    return "Daily life & work";
  }
  if (/^topic:verb-(creation|poner|household)/u.test(collection)) {
    return "Making, changing & home";
  }
  if (/^topic:verb-(social|conflict|loss)/u.test(collection)) {
    return "Social life & conflict";
  }
  if (/^topic:verb-(admin|analysis|technology|weather|health|formal)/u.test(collection)) {
    return "Formal & specialized";
  }
  return "Other verb groups";
}

const MAPPING_TOPICS = new Set([
  "mappings",
  "en-mappings",
  "phrasal-verbs-by-root",
  "phrasal-verbs-by-particle",
]);

// Dedicated confusion / translation-choice groups live ONLY on the two
// Mappings topics (docs/curation/taxonomy-cleanup-2026-09-07/policy.md).
function isConfusionCollection(collection: string) {
  return (
    collection.startsWith("contrast:") ||
    collection.startsWith("topic:confusable-")
  );
}

export function facetGroup(topic: string | undefined, collection: string) {
  if (
    (topic === "mappings" || topic === "en-mappings") &&
    isConfusionCollection(collection)
  ) {
    return "Common confusions";
  }
  if (topic === "verbs") return verbFamily(collection);
  if (MAPPING_TOPICS.has(topic ?? "")) {
    return "__alphabetic__";
  }
  if (topic === "nouns" || topic === "adjectives" || topic === "adverbs") {
    if (
      topic === "nouns" &&
      /^topic:(masc-|fem-|common-gender-)/u.test(collection)
    ) {
      return "Articles & gender";
    }
    if (collection.startsWith("topic:")) return "Meaning & context";
    if (collection.startsWith("gender:")) return "Articles & gender";
    if (collection.startsWith("degree:")) return "Comparisons";
    return topic === "adjectives" ? "How it's used" : "Word types";
  }
  if (topic === "transformations") {
    if (collection.startsWith("morphology:suffix-")) return "Endings";
    if (collection.startsWith("morphology:prefix-")) return "Prefixes";
    return "Word types";
  }
  if (topic === "cognates") {
    if (
      [
        "cognate:transparent",
        "cognate:opaque-gloss",
        "cognate:false-friend",
      ].includes(collection)
    ) {
      return "Cognate types";
    }
    if (
      collection === "cognate:latin-root" ||
      /-to-(tain|pose|mit|fer|duce|tribute|struct|tract|scribe|clude|dict|cede|press|vert|serve|solve|gest|hibit|ceive|ply|cur|hend)$/u.test(
        collection,
      )
    ) {
      return "Latin roots";
    }
    return "Spelling patterns";
  }
  if (topic === "verb-forms") {
    return collection.startsWith("sound:regular-")
      ? "Regular endings"
      : "Irregular patterns";
  }
  if (topic === "verb-patterns") {
    if (
      /^construction:(followed|allows|somebody|object|double-object|have-|get-)/u.test(
        collection,
      )
    ) {
      return "Verb complements";
    }
    return "Sentence patterns";
  }
  return "Explore";
}

export function buildCurriculumFamilies(
  topic: CurriculumTopic,
): CurriculumNavigationFamily[] {
  const grouped = new Map<string, CurriculumNavigationLeaf[]>();

  for (const facet of topic.facetButtons) {
    const rawGroup = facetGroup(topic.slug, facet.collection);
    const label =
      rawGroup === "__alphabetic__"
        ? alphabeticFamily(facet.label)
        : rawGroup === "Explore"
          ? exploreFamilyLabels[topic.slug] ?? rawGroup
          : rawGroup;
    grouped.set(label, [
      ...(grouped.get(label) ?? []),
      { collection: facet.collection, label: facet.label },
    ]);
  }

  const entries = [...grouped];
  if (
    topic.slug === "mappings" ||
    topic.slug === "en-mappings" ||
    topic.slug === "phrasal-verbs-by-root" ||
    topic.slug === "phrasal-verbs-by-particle"
  ) {
    const order = [
      "A–E",
      "F–J",
      "K–O",
      "P–T",
      "U–Z",
      "Other",
      "Common confusions",
    ];
    entries.sort(
      ([left], [right]) => order.indexOf(left) - order.indexOf(right),
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
