// Ranking for the lesson builder's concept typeahead (see
// src/app/api/admin/curriculum/concepts/search/route.ts). Pure so it can be
// unit tested without a database: given the SQL query's already-filtered
// candidate rows, order them the way a human typing a search box expects —
// an exact match on what they typed beats a prefix, which beats a match at a
// word boundary, which beats a match buried mid-word. Concepts are stored as
// infinitives ("estar [en un lugar]"), but a teacher types the conjugated
// form she's about to teach ("estoy"), which never appears in the label — so
// a row whose only hit is in its own example sentence ("Estoy en casa.")
// still surfaces, but ranks below every label match: a new lowest tier,
// tie-broken the same way. Ties break by curriculum priority (P1 first) then
// by label length (shorter first).

export type ConceptSearchCandidate = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
  exampleSpanish?: string;
  exampleEnglish?: string;
};

export type ConceptSearchResult<T> = T & {
  // "label" when the query matched the Spanish/English label itself;
  // "example" when it matched only the example sentence — the caller (the
  // typeahead) uses this to decide whether to show the example as a second
  // line instead of/alongside the label.
  matchedVia: "label" | "example";
  matchedExample?: string;
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

// Label tiers are 0-3 (see matchTier); every example-match tier is pushed
// below all of them by this offset, so the *best* example match still ranks
// under the *worst* label match.
const EXAMPLE_TIER_OFFSET = 4;

// Word-start match on the example text — no bracket-stripping, since
// examples are real sentences, not templated labels. Unlike labels there is
// no substring tier: "melo" must not surface "No puedo distinguir a los
// gemelos." (owner, 2026-09-16); an example only counts when the typed text
// begins a word in it.
function exampleMatchTier(text: string, normalizedQuery: string): number {
  const normalized = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  if (!normalizedQuery || !normalized) return Number.POSITIVE_INFINITY;
  if (normalized === normalizedQuery) return 0;
  if (normalized.startsWith(normalizedQuery)) return 1;
  if (new RegExp(`\\b${escapeRegExp(normalizedQuery)}`).test(normalized)) return 2;
  return Number.POSITIVE_INFINITY;
}

export function rankConceptSearchResults<T extends ConceptSearchCandidate>(
  candidates: T[],
  query: string,
): ConceptSearchResult<T>[] {
  const normalizedQuery = normalize(query);
  return candidates
    .map((candidate) => {
      const englishTier = matchTier(candidate.english, normalizedQuery);
      const spanishTier = matchTier(candidate.spanish, normalizedQuery);
      const labelTier = Math.min(englishTier, spanishTier);

      const exampleSpanishTier = exampleMatchTier(candidate.exampleSpanish ?? "", normalizedQuery);
      const exampleEnglishTier = exampleMatchTier(candidate.exampleEnglish ?? "", normalizedQuery);
      const bestExampleTier = Math.min(exampleSpanishTier, exampleEnglishTier);
      const matchedExample =
        bestExampleTier === exampleSpanishTier
          ? candidate.exampleSpanish
          : candidate.exampleEnglish;

      const tier = Number.isFinite(labelTier)
        ? labelTier
        : bestExampleTier + EXAMPLE_TIER_OFFSET;
      const matchedVia: "label" | "example" = Number.isFinite(labelTier) ? "label" : "example";

      const length = Math.min(
        normalize(candidate.english).length || Number.POSITIVE_INFINITY,
        normalize(candidate.spanish).length || Number.POSITIVE_INFINITY,
      );
      return {
        candidate,
        tier,
        priority: priorityRank(candidate.curriculumRole),
        length,
        matchedVia,
        matchedExample: matchedVia === "example" ? matchedExample : undefined,
      };
    })
    .filter((entry) => Number.isFinite(entry.tier))
    .sort((a, b) => a.tier - b.tier || a.priority - b.priority || a.length - b.length)
    .map((entry) => ({
      ...entry.candidate,
      matchedVia: entry.matchedVia,
      matchedExample: entry.matchedExample,
    }));
}
