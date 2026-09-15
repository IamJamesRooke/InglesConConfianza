// Ranking for the lesson builder's concept typeahead (see
// src/app/api/admin/curriculum/concepts/search/route.ts). Pure so it can be
// unit tested without a database: given the SQL query's already-filtered
// candidate rows, order them the way a human typing a search box expects —
// an exact match on what they typed beats a prefix, which beats a match at a
// word boundary, which beats a match buried mid-word. Ties break by
// curriculum priority (P1 first) then by label length (shorter first).

export type ConceptSearchCandidate = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
};

// CurriculumRole enum declaration order (schema.prisma) — lower index wins.
const PRIORITY_ORDER = ["P1", "P2", "P3", "P4", "P5", "Unranked", "Trash"];

function priorityRank(role: string): number {
  const index = PRIORITY_ORDER.indexOf(role);
  return index === -1 ? PRIORITY_ORDER.length : index;
}

// Strip the bracketed placeholder part of a label like "querer [hacer algo]"
// so "hacer" does not read as matching the whole entry, then fold accents and
// case so "si" matches "sí".
function normalize(text: string): string {
  return text
    .replace(/\[.*?\]/g, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Lower is better: 0 exact, 1 prefix, 2 word-boundary, 3 substring,
// Infinity no match.
function matchTier(candidateText: string, normalizedQuery: string): number {
  const text = normalize(candidateText);
  if (!normalizedQuery || !text) return Number.POSITIVE_INFINITY;
  if (text === normalizedQuery) return 0;
  if (text.startsWith(normalizedQuery)) return 1;
  if (new RegExp(`\\b${escapeRegExp(normalizedQuery)}`).test(text)) return 2;
  if (text.includes(normalizedQuery)) return 3;
  return Number.POSITIVE_INFINITY;
}

export function rankConceptSearchResults<T extends ConceptSearchCandidate>(
  candidates: T[],
  query: string,
): T[] {
  const normalizedQuery = normalize(query);
  return candidates
    .map((candidate) => {
      const englishTier = matchTier(candidate.english, normalizedQuery);
      const spanishTier = matchTier(candidate.spanish, normalizedQuery);
      const tier = Math.min(englishTier, spanishTier);
      const length = Math.min(
        normalize(candidate.english).length || Number.POSITIVE_INFINITY,
        normalize(candidate.spanish).length || Number.POSITIVE_INFINITY,
      );
      return { candidate, tier, priority: priorityRank(candidate.curriculumRole), length };
    })
    .filter((entry) => Number.isFinite(entry.tier))
    .sort((a, b) => a.tier - b.tier || a.priority - b.priority || a.length - b.length)
    .map((entry) => entry.candidate);
}
