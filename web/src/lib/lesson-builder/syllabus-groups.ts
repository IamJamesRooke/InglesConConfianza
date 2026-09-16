// Part-of-speech grouping for the module syllabus card (round 2, item A.1 —
// docs/design/lesson-builder-round-2.md). Thirty-one pills in one soup is
// unreadable while the owner is deciding what a module teaches; the same
// thirty-one under six quiet sub-eyebrows are.
//
// Grouping is RENDER-ONLY. `module.syllabus.main`/`.review` stay flat
// ordered arrays in lessons.json, so drag-and-drop and the `Ctrl Alt ←/→`
// moves keep operating on the flat list; every entry below carries the
// `index` it had in that flat list, which is what a drop maps back to.
//
// The source of a concept's part of speech is its `pos:*` collection (one
// per concept in practice — the first one wins). A concept with no `pos:*`
// collection, and every freehand pill (no curriculum row at all), lands in
// "Untagged": it is a real state the owner should see, not a bug.

export type SyllabusGroupId =
  | "pronouns"
  | "verbs"
  | "connectors"
  | "time-place-degree"
  | "words"
  | "untagged";

type GroupDefinition = {
  id: SyllabusGroupId;
  label: string;
  // Bare pos tokens (the part after `pos:`); empty for the catch-all.
  pos: readonly string[];
};

// Fixed order, agreed with the owner 2026-09-16. Never sorted at runtime.
export const SYLLABUS_GROUPS: readonly GroupDefinition[] = [
  { id: "pronouns", label: "Pronouns", pos: ["pronoun"] },
  { id: "verbs", label: "Verbs", pos: ["verb"] },
  { id: "connectors", label: "Connectors", pos: ["connector"] },
  {
    id: "time-place-degree",
    label: "Prepositions, time and place",
    pos: ["adverb", "preposition"],
  },
  {
    id: "words",
    label: "Words",
    pos: ["noun", "adjective", "determiner", "number", "quantifier", "interjection"],
  },
  { id: "untagged", label: "Untagged", pos: [] },
];

const BY_POS = new Map<string, SyllabusGroupId>(
  SYLLABUS_GROUPS.flatMap((group) => group.pos.map((pos) => [pos, group.id] as const)),
);

// Accepts either the raw collection name ("pos:verb") or the bare token
// ("verb"); anything unknown, empty or absent is "untagged".
export function syllabusGroupOf(pos?: string | null): SyllabusGroupId {
  if (!pos) return "untagged";
  const token = pos.startsWith("pos:") ? pos.slice(4) : pos;
  return BY_POS.get(token.trim().toLowerCase()) ?? "untagged";
}

export function syllabusGroupLabel(id: SyllabusGroupId): string {
  return SYLLABUS_GROUPS.find((group) => group.id === id)?.label ?? "Untagged";
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
  posOf: (item: T) => string | null | undefined,
): SyllabusGroupOf<T>[] {
  const buckets = new Map<SyllabusGroupId, SyllabusGroupEntry<T>[]>();
  items.forEach((item, index) => {
    const id = syllabusGroupOf(posOf(item));
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
