// Grouping for the module syllabus card (round 2, item A.1, and the
// 2026-09-16 re-cut of item A.1 — owner screenshot: `pos:pronoun` alone
// dumped "para mí", "conmigo", "que yo [haga algo]" and "algo" in with plain
// "yo"/"me", which reads as soup). Thirty-one pills in one group is
// unreadable while the owner is deciding what a module teaches; the same
// thirty-one under quiet sub-eyebrows are.
//
// Grouping is RENDER-ONLY. `module.syllabus.main`/`.review` stay flat
// ordered arrays in lessons.json, so drag-and-drop and the `Ctrl Alt ←/→`
// moves keep operating on the flat list; every entry below carries the
// `index` it had in that flat list, which is what a drop maps back to.
//
// A concept's group is now decided from its FULL set of `pos:*`/`grammar:*`/
// `construction:*` collections, not just the first `pos:*` one — the DB
// tags e.g. "conmigo" as `pos:pronoun` + `grammar:prepositional-pronoun`,
// and it belongs with the prepositions, not the plain pronouns. Callers pass
// that full collection list (`readConceptDisplays` / the by-level and
// search routes now select it; see `ConceptDisplayLookup["collections"]`).
// A concept with none of the recognised collections, and every freehand
// pill (no curriculum row at all), lands in "Untagged": it is a real state
// the owner should see, not a bug.
//
// RENDER order (the fixed order groups appear in on the card, and the order
// `SYLLABUS_GROUPS` is declared in) is NOT the same as EVALUATION order
// (the order a concept's collections are tested against each group's rule,
// first match wins). Render order is owner-approved reading order: People,
// Verbs, Sentence patterns, Connectors, Prepositions and phrases, Time and
// place, Things and describing words, Untagged. Evaluation order instead
// puts the three narrow, facet-specific groups — Sentence patterns,
// Prepositions and phrases, Things and describing words — ahead of the
// broad `pos:pronoun` catch-all (People), because rows like "que yo [haga
// algo]" (`construction:object-control` + `pos:pronoun`), "conmigo"
// (`grammar:prepositional-pronoun` + `pos:pronoun`) and "algo"
// (`grammar:indefinite-pronoun` + `pos:pronoun`) all carry `pos:pronoun`
// too and must be claimed by the narrower rule first. See
// `EVALUATION_ORDER` below — it is declared explicitly and asserted equal
// in length/membership to `SYLLABUS_GROUPS` by a unit test, so the two
// orders can never silently drift apart.

export type SyllabusGroupId =
  | "people"
  | "verbs"
  | "patterns"
  | "connectors"
  | "prepositions"
  | "time-place"
  | "things"
  | "untagged";

type CollectionMatcher = (collections: ReadonlySet<string>) => boolean;

type GroupDefinition = {
  id: SyllabusGroupId;
  label: string;
  match: CollectionMatcher;
};

function pos(token: string): CollectionMatcher {
  const collection = `pos:${token}`;
  return (collections) => collections.has(collection);
}

function anyPos(tokens: readonly string[]): CollectionMatcher {
  const wanted = tokens.map((token) => `pos:${token}`);
  return (collections) => wanted.some((collection) => collections.has(collection));
}

function collection(name: string): CollectionMatcher {
  return (collections) => collections.has(name);
}

function anyOf(...matchers: CollectionMatcher[]): CollectionMatcher {
  return (collections) => matchers.some((matcher) => matcher(collections));
}

// Render order (fixed, owner-approved 2026-09-16). Never sorted at runtime.
export const SYLLABUS_GROUPS: readonly GroupDefinition[] = [
  { id: "people", label: "People", match: pos("pronoun") },
  { id: "verbs", label: "Verbs", match: pos("verb") },
  {
    id: "patterns",
    label: "Sentence patterns",
    match: anyOf(collection("construction:object-control"), collection("grammar:subjunctive")),
  },
  { id: "connectors", label: "Connectors", match: pos("connector") },
  {
    id: "prepositions",
    label: "Prepositions and phrases",
    match: anyOf(pos("preposition"), collection("grammar:prepositional-pronoun")),
  },
  { id: "time-place", label: "Time and place", match: pos("adverb") },
  {
    id: "things",
    label: "Things and describing words",
    match: anyOf(
      collection("grammar:indefinite-pronoun"),
      anyPos(["noun", "adjective", "determiner", "number", "quantifier", "interjection"]),
    ),
  },
  { id: "untagged", label: "Untagged", match: () => false },
];

// Evaluation order — see the header comment. Narrow facet rules (patterns,
// prepositions, things) are tested before the broad `pos:pronoun` catch-all
// (people); the remaining groups keep render order since none of their
// rules overlap. "untagged" is never matched directly — it is the fallback
// when nothing else claims a concept.
const EVALUATION_ORDER: readonly SyllabusGroupId[] = [
  "patterns",
  "prepositions",
  "things",
  "people",
  "verbs",
  "connectors",
  "time-place",
];

const GROUPS_BY_ID = new Map(SYLLABUS_GROUPS.map((group) => [group.id, group] as const));

const EVALUATION_LIST: readonly GroupDefinition[] = EVALUATION_ORDER.map((id) => {
  const group = GROUPS_BY_ID.get(id);
  if (!group) throw new Error(`syllabus-groups: unknown group id in EVALUATION_ORDER: ${id}`);
  return group;
});

/**
 * Resolve a concept's group from its full `pos:*`/`grammar:*`/
 * `construction:*` collection list (raw collection names, e.g.
 * `["pos:pronoun", "grammar:prepositional-pronoun"]`). Accepts a single
 * bare or prefixed token too, for freehand call sites that only ever have
 * one. Absent, empty or fully-unrecognised input is "untagged".
 */
export function syllabusGroupOf(
  collections?: readonly string[] | string | null,
): SyllabusGroupId {
  if (!collections) return "untagged";
  const list = Array.isArray(collections) ? collections : [collections];
  const normalised = new Set(
    list
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
      .map((entry) => (entry.includes(":") ? entry : `pos:${entry}`)),
  );
  if (normalised.size === 0) return "untagged";
  for (const group of EVALUATION_LIST) {
    if (group.match(normalised)) return group.id;
  }
  return "untagged";
}

export function syllabusGroupLabel(id: SyllabusGroupId): string {
  return GROUPS_BY_ID.get(id)?.label ?? "Untagged";
}

export type SyllabusGroupEntry<T> = {
  item: T;
  /** Position in the flat list the group was built from. */
  index: number;
};

export type SyllabusGroupOf<T> = {
  id: SyllabusGroupId;
  label: string;
  entries: SyllabusGroupEntry<T>[];
};

/**
 * Split a flat syllabus list into the fixed groups above. Order within a
 * group is the flat order; empty groups are omitted entirely.
 */
export function groupSyllabusItems<T>(
  items: readonly T[],
  collectionsOf: (item: T) => readonly string[] | string | null | undefined,
): SyllabusGroupOf<T>[] {
  const buckets = new Map<SyllabusGroupId, SyllabusGroupEntry<T>[]>();
  items.forEach((item, index) => {
    const id = syllabusGroupOf(collectionsOf(item));
    const bucket = buckets.get(id);
    if (bucket) bucket.push({ item, index });
    else buckets.set(id, [{ item, index }]);
  });
  return SYLLABUS_GROUPS.filter((group) => buckets.has(group.id)).map((group) => ({
    id: group.id,
    label: group.label,
    entries: buckets.get(group.id) ?? [],
  }));
}
