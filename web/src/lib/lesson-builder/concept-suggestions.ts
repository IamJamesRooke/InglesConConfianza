import { curriculumRoles } from "@/lib/curriculum/types";
import type { Lesson, LessonBlock } from "@/lib/lesson-builder/types";

type ConceptPriorityBand = "high" | "medium" | "low" | "neutral";

export type SuggestionConceptDisplay = {
  spanish: string;
  english: string;
  role?: string;
};

export type LessonConceptSuggestion = SuggestionConceptDisplay & {
  conceptId: string;
  lessonGap: number;
  priorityBand: ConceptPriorityBand;
};

const teachableRoles = curriculumRoles.filter((role) => role !== "Trash");

export function conceptPriority(role?: string) {
  const index = teachableRoles.findIndex((candidate) => candidate === role);
  if (index < 0) {
    return { rank: Number.MAX_SAFE_INTEGER, band: "neutral" as const };
  }

  const bandIndex = Math.min(2, Math.floor((index * 3) / teachableRoles.length));
  const band = (["high", "medium", "low"] as const)[bandIndex];
  return { rank: index, band };
}

export function suggestConceptsForLesson({
  lessons,
  lessonId,
  conceptDisplays,
  limit = 8,
}: {
  lessons: Pick<Lesson, "id" | "concepts">[];
  lessonId: string;
  conceptDisplays: Record<string, SuggestionConceptDisplay>;
  limit?: number;
}): LessonConceptSuggestion[] {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex <= 0 || limit <= 0) return [];

  const lastSeen = new Map<string, number>();
  for (let index = 0; index < lessonIndex; index += 1) {
    for (const concept of lessons[index].concepts) {
      if (concept.conceptId) lastSeen.set(concept.conceptId, index);
    }
  }

  const currentConceptIds = new Set(
    lessons[lessonIndex].concepts.flatMap((concept) =>
      concept.conceptId ? [concept.conceptId] : [],
    ),
  );

  return [...lastSeen]
    .flatMap(([conceptId, lastSeenIndex]) => {
      if (currentConceptIds.has(conceptId)) return [];
      const display = conceptDisplays[conceptId];
      if (!display || display.role === "Trash") return [];
      return [
        {
          conceptId,
          ...display,
          lessonGap: lessonIndex - lastSeenIndex,
          priorityBand: conceptPriority(display.role).band,
        },
      ];
    })
    .sort((left, right) => {
      const gapDifference = right.lessonGap - left.lessonGap;
      if (gapDifference !== 0) return gapDifference;
      const priorityDifference =
        conceptPriority(left.role).rank - conceptPriority(right.role).rank;
      if (priorityDifference !== 0) return priorityDifference;
      return left.english.localeCompare(right.english);
    })
    .slice(0, limit);
}

// --- Auto-Covers: suggest concepts already named by this lesson's own pairs
// (E5, "auto-Covers" half — see docs/design/lesson-builder-rebuild.md). A
// lesson whose pairs already spell out "quiero / I want" should not also
// require the teacher to hand-type "querer [algo]" into Covers.

const EDGE_PUNCTUATION = /^[¿¡"'“”.,;:!?()«»]+|["'“”.,;:!?()«»]+$/g;

// Strips leading/trailing punctuation and collapses whitespace. Pure — no
// normalization beyond that; matching (below) handles accents/case.
function cleanTerm(raw: string): string {
  return raw.replace(EDGE_PUNCTUATION, "").replace(/\s+/g, " ").trim();
}

// Every distinct term named by a lesson's own content: each sentence/
// vocabulary pair's Spanish text and accepted English answers. Explanation
// prose is never a source of terms — a passing mention in an explanation
// ("I mean...") is not the same as the lesson actually drilling the term, and
// treating it as one produced false Auto-Covers suggestions (owner report,
// 2026-09-15). Order is preserved (first appearance wins) so callers can
// break suggestion ties by "which term named it first".
export function extractLessonPairTerms(lesson: { blocks: LessonBlock[] }): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  function add(raw: string) {
    const term = cleanTerm(raw);
    if (term.length < 2) return;
    const key = term.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    terms.push(term);
  }

  for (const block of lesson.blocks) {
    if (block.type !== "sentence") continue;
    for (const piece of block.languageBlocks) {
      add(piece.spanish);
      for (const answer of piece.acceptedAnswers) add(answer);
    }
  }

  return terms;
}

function foldAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Drops the bracketed placeholder half of a concept label ("querer [algo]"
// -> "querer") and collapses whitespace, preserving case and accents — used
// wherever a concept's own text is written into a field rather than
// compared (E5b's pair-field autocomplete: `concept-search-popover.tsx`).
export function stripConceptPlaceholder(text: string): string {
  return text.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
}

export type PairMatchCandidate = SuggestionConceptDisplay & {
  id: string;
  // Bilingual example sentence — only used for the tier-2 "example net"
  // below. Optional so existing callers/tests that only exercise direct
  // matching don't need to supply it.
  exampleSpanish?: string;
  exampleEnglish?: string;
};

export type PairConceptMatch = {
  term: string;
  concept: PairMatchCandidate;
};

// Auto-Covers eligibility (owner report, 2026-09-16): a sentence pair names
// all sorts of incidental nouns ("egg" in an example sentence) that aren't
// worth surfacing as a Covers suggestion. A pair-derived match is only
// offered when its concept is Level 1 (highest-leverage, taught early
// regardless of module) or already part of *this* lesson's own module
// syllabus (main or review) — everything else is dropped. Suggestions from
// the explanation-marks path (pair-proposals.ts) are unaffected; this only
// gates the sentence-pair-term path (matchPairTermsToConcepts above).
export function isSyllabusEligiblePairMatch(
  match: PairConceptMatch,
  syllabusSets?: { mainOfModule: Set<string>; inSyllabusUncovered: Set<string> },
): boolean {
  if (match.concept.role === "P1") return true;
  if (!syllabusSets) return false;
  return (
    syllabusSets.mainOfModule.has(match.concept.id) ||
    syllabusSets.inSyllabusUncovered.has(match.concept.id)
  );
}

const LEADING_SUBJECT_PRONOUNS = new Set(["i", "you", "he", "she", "it", "we", "they"]);

// Full normalization for *matching*: drop bracket placeholders and their
// contents entirely, fold accents, strip all punctuation (not just edges —
// "¿Quieres?" must equal "quieres"), lowercase, collapse whitespace.
function normalizeMatchText(raw: string): string {
  const withoutPlaceholders = raw.replace(/\[[^\]]*\]/g, " ");
  const folded = foldAccents(withoutPlaceholders);
  const withoutPunctuation = folded.replace(/[\p{P}\p{S}]/gu, " ");
  return withoutPunctuation.toLowerCase().replace(/\s+/g, " ").trim();
}

// Drops a single leading "to" or subject pronoun so "I want" and "to want"
// (an infinitive concept vs. a conjugated pair) can be compared. Applied to
// both sides of an English comparison — never mixed with the untouched form.
function dropLeadingFrame(normalized: string): string {
  const [first, ...rest] = normalized.split(" ");
  if (first === "to" || LEADING_SUBJECT_PRONOUNS.has(first)) {
    return rest.join(" ");
  }
  return normalized;
}

// Whole-phrase (word-boundary) containment inside a normalized example
// sentence — not a substring match, so "algo" never hits inside a longer
// word. Both sides are already space-normalized, so padding with spaces
// gives real boundaries.
function containsWholePhrase(normalizedHaystack: string, normalizedNeedle: string): boolean {
  if (!normalizedHaystack || !normalizedNeedle) return false;
  return ` ${normalizedHaystack} `.includes(` ${normalizedNeedle} `);
}

const MAX_EXAMPLE_MATCHES_PER_LESSON = 3;

// Match tiers, best first — direct matches always outrank example-sentence
// matches (the lemma net below), which exist only to catch a conjugated pair
// ("quiero") naming an infinitive concept ("querer") whose *example* uses the
// conjugated form, not the concept's own headword.
const TIER_SPANISH_DIRECT = 0;
const TIER_ENGLISH_DIRECT = 1;
const TIER_EXAMPLE = 2;

type ScoredMatch = {
  term: string;
  candidate: PairMatchCandidate;
  tier: number;
  labelLength: number;
};

// Matches extracted lesson terms against a pool of candidate curriculum
// concepts. Whole-term matching only (no prefix/substring): a term matches a
// concept iff it equals the concept's Spanish text, equals its English
// target, or equals the English target once a leading "to "/subject pronoun
// is dropped from both sides. Failing that, a term also matches a concept
// whose bilingual example sentence contains it as a whole phrase — ranked
// below any direct match and capped at 3 per lesson (one call = one lesson's
// terms) so a lemma net doesn't drown out the terms the pairs actually name.
// Pure and DB-agnostic: the caller (the suggest API route) fetches the
// candidate pool with one broad query; this does the real matching decision.
export function matchPairTermsToConcepts(
  terms: string[],
  candidates: PairMatchCandidate[],
): PairConceptMatch[] {
  const normalizedCandidates = candidates.map((candidate) => {
    const spanish = normalizeMatchText(candidate.spanish);
    const english = normalizeMatchText(candidate.english);
    return {
      candidate,
      spanish,
      english,
      englishFrame: dropLeadingFrame(english),
      exampleSpanish: normalizeMatchText(candidate.exampleSpanish ?? ""),
      exampleEnglish: normalizeMatchText(candidate.exampleEnglish ?? ""),
    };
  });

  const scored: ScoredMatch[] = [];

  for (const term of terms) {
    const normalizedTerm = normalizeMatchText(term);
    if (!normalizedTerm) continue;
    const termFrame = dropLeadingFrame(normalizedTerm);

    // Every (candidate, tier) pair this term clears — direct tiers first,
    // the example tier only computed when no direct tier won (below).
    // `labelLength` is the concept's own *raw* (unnormalized) text length —
    // not the normalized/matched length, which bracket-stripping can make
    // coincide across unrelated concepts (e.g. "hacer" and "hacer [reparar
    // algo]" both normalize to "hacer"); the raw label is what actually
    // distinguishes the plain concept from the bracketed one for the
    // "shorter label" tiebreak.
    const hits: Array<{ candidate: PairMatchCandidate; tier: number; labelLength: number }> = [];
    for (const entry of normalizedCandidates) {
      if (entry.spanish && entry.spanish === normalizedTerm) {
        hits.push({
          candidate: entry.candidate,
          tier: TIER_SPANISH_DIRECT,
          labelLength: entry.candidate.spanish.length,
        });
        continue;
      }
      if (
        entry.english &&
        (entry.english === normalizedTerm ||
          (termFrame && entry.englishFrame && termFrame === entry.englishFrame))
      ) {
        hits.push({
          candidate: entry.candidate,
          tier: TIER_ENGLISH_DIRECT,
          labelLength: entry.candidate.english.length,
        });
      }
    }

    // Only fall back to the example net if no direct hit exists for this term.
    if (hits.length === 0) {
      for (const entry of normalizedCandidates) {
        if (
          containsWholePhrase(entry.exampleSpanish, normalizedTerm) ||
          containsWholePhrase(entry.exampleEnglish, normalizedTerm)
        ) {
          hits.push({
            candidate: entry.candidate,
            tier: TIER_EXAMPLE,
            labelLength: entry.candidate.english.length,
          });
        }
      }
    }

    let best: { candidate: PairMatchCandidate; tier: number; labelLength: number } | undefined;
    for (const hit of hits) {
      const better =
        !best ||
        hit.tier < best.tier ||
        (hit.tier === best.tier &&
          (hit.labelLength < best.labelLength ||
            (hit.labelLength === best.labelLength &&
              conceptPriority(hit.candidate.role).rank < conceptPriority(best.candidate.role).rank)));
      if (better) best = hit;
    }

    if (best) scored.push({ term, candidate: best.candidate, tier: best.tier, labelLength: best.labelLength });
  }

  scored.sort((left, right) => {
    if (left.tier !== right.tier) return left.tier - right.tier;
    const priorityDiff =
      conceptPriority(left.candidate.role).rank - conceptPriority(right.candidate.role).rank;
    if (priorityDiff !== 0) return priorityDiff;
    return left.labelLength - right.labelLength;
  });

  const matches: PairConceptMatch[] = [];
  let exampleCount = 0;
  for (const entry of scored) {
    if (entry.tier === TIER_EXAMPLE) {
      if (exampleCount >= MAX_EXAMPLE_MATCHES_PER_LESSON) continue;
      exampleCount += 1;
    }
    matches.push({ term: entry.term, concept: entry.candidate });
  }

  return matches;
}
