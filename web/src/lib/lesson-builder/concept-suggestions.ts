import { curriculumRoles } from "@/lib/curriculum/types";
import type { Lesson, LessonBlock } from "@/lib/lesson-builder/types";

export type ConceptPriorityBand = "high" | "medium" | "low" | "neutral";

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
const LANG_MARK = /\[\[(?:es|en):([^\]]+)\]\]/g;

// Strips leading/trailing punctuation and collapses whitespace. Pure — no
// normalization beyond that; matching (below) handles accents/case.
function cleanTerm(raw: string): string {
  return raw.replace(EDGE_PUNCTUATION, "").replace(/\s+/g, " ").trim();
}

// Every distinct term named by a lesson's own content: each pair's Spanish
// text and accepted English answers, plus `[[es:…]]`/`[[en:…]]` marks in
// explanation prose. Order is preserved (first appearance wins) so callers
// can break suggestion ties by "which term named it first".
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
    if (block.type === "explanation") {
      for (const match of block.contentMarkdown.matchAll(LANG_MARK)) {
        add(match[1]);
      }
      continue;
    }
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

// Same normalization the concept typeahead uses: drop the bracketed
// placeholder half of a label, fold accents, lowercase.
export function normalizeConceptText(text: string): string {
  return foldAccents(stripConceptPlaceholder(text)).toLowerCase();
}

export type PairMatchCandidate = SuggestionConceptDisplay & { id: string };

export type PairConceptMatch = {
  term: string;
  concept: PairMatchCandidate;
};

// Matches extracted lesson terms against a pool of candidate curriculum
// concepts: exact match on Spanish text or English target wins, then a
// prefix match (either direction, so "querer" also catches a term like
// "querer algo"). No fuzzy/substring tier — a near-miss here would tag the
// wrong concept with one keystroke, which is worse than missing one.
// Pure and DB-agnostic: the caller (the suggest API route) fetches the
// candidate pool with one broad query; this just picks the best concept per
// term. One match per term, in input term order.
export function matchPairTermsToConcepts(
  terms: string[],
  candidates: PairMatchCandidate[],
): PairConceptMatch[] {
  const normalizedCandidates = candidates.map((candidate) => ({
    candidate,
    spanish: normalizeConceptText(candidate.spanish),
    english: normalizeConceptText(candidate.english),
  }));

  const matches: PairConceptMatch[] = [];
  for (const term of terms) {
    const normalizedTerm = normalizeConceptText(term);
    if (!normalizedTerm) continue;

    let best: { candidate: PairMatchCandidate; tier: number; lengthDiff: number } | null = null;
    for (const entry of normalizedCandidates) {
      for (const text of [entry.spanish, entry.english]) {
        if (!text) continue;
        let tier: number | null = null;
        if (text === normalizedTerm) tier = 0;
        else if (text.startsWith(normalizedTerm) || normalizedTerm.startsWith(text)) tier = 1;
        if (tier === null) continue;
        const lengthDiff = Math.abs(text.length - normalizedTerm.length);
        const better =
          !best ||
          tier < best.tier ||
          (tier === best.tier &&
            (lengthDiff < best.lengthDiff ||
              (lengthDiff === best.lengthDiff &&
                conceptPriority(entry.candidate.role).rank <
                  conceptPriority(best.candidate.role).rank)));
        if (better) best = { candidate: entry.candidate, tier, lengthDiff };
      }
    }

    if (best) matches.push({ term, concept: best.candidate });
  }

  return matches;
}
