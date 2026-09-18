import {
  APOSTROPHE_LOOKALIKES,
  DOUBLE_QUOTE_LOOKALIKES,
  normalizeAnswer,
} from "@/lib/lesson-builder/utils";

/**
 * "Recuérdame" diff (docs/design/learner-direction.md, "Help"): when the
 * learner has typed something, the bubble shows the accepted answer closest
 * to what they typed with the characters they got wrong or missed marked,
 * and the characters they already had right left quiet. Pure and
 * React-free — the bubble (speaker-chip.tsx / use-sentence-practice.ts)
 * only calls these two functions and renders the result.
 *
 * The old diff bar (removed in e2c2ee97 when the hint moved into the
 * speaker's bubble) diffed the learner's raw typing against the raw
 * canonical answer, so a difference of case or apostrophe style — both
 * forgiven by the matcher (isAnswerAccepted/normalizeAnswer) — showed up as
 * a mistake. This version diffs the NORMALIZED forms (case and curly
 * apostrophes/quotes folded, same as matching) and maps the result back
 * onto the answer's own canonical spelling for display, so only real
 * mistakes — including missing/wrong punctuation, which the matcher does
 * care about — are ever marked.
 */

export type AnswerDiffSegment = { text: string; status: "same" | "fix" };

/** Plain Levenshtein edit distance, used to find the accepted answer
 * closest to what the learner typed. */
function editDistance(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  const dp: number[] = new Array(m + 1);
  for (let j = 0; j <= m; j++) dp[j] = j;
  for (let i = 1; i <= n; i++) {
    let previousDiagonal = dp[0];
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? previousDiagonal
          : 1 + Math.min(previousDiagonal, dp[j], dp[j - 1]);
      previousDiagonal = temp;
    }
  }
  return dp[m];
}

/** The accepted answer (canonical spelling) with the smallest edit
 * distance, normalized the same way the matcher does, between what the
 * learner typed and each candidate — so typing "hii" points at "hi", not
 * "hello". Ties go to the earlier alternative. Empty/whitespace-only input,
 * or no candidates, returns the primary (first) answer. */
export function closestAcceptedAnswer(
  typed: string,
  accepted: string[],
): string {
  const primary = accepted[0] ?? "";
  const normalizedTyped = normalizeAnswer(typed);
  if (!normalizedTyped || accepted.length <= 1) return primary;
  let best = primary;
  let bestDistance = Infinity;
  for (const candidate of accepted) {
    const distance = editDistance(
      normalizedTyped,
      normalizeAnswer(candidate),
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

/** Lowercases and folds curly apostrophes/quotes to straight ones, same as
 * normalizeAnswer, but one character at a time with no trim/whitespace
 * collapse — so the result stays index-aligned with the original answer
 * string and a diff computed against it can be mapped straight back onto
 * the answer's own canonical characters. */
function normalizeCharForDiff(char: string): string {
  return char
    .toLowerCase()
    .replace(APOSTROPHE_LOOKALIKES, "'")
    .replace(DOUBLE_QUOTE_LOOKALIKES, '"');
}

type DiffOp = "same" | "fix" | "skip";

/** Character-level LCS diff between `from` (the learner's normalized
 * typing) and `to` (the answer, normalized character-by-character). Returns
 * one op per character of `to`, in order — "same" where it lines up with
 * what was typed, "fix" where it doesn't (missing or wrong) — plus interior
 * "skip" ops standing for characters only in `from` (extra typing, which
 * has no answer character to attach to and is dropped by the caller). Same
 * backtracking shape as the pre-e2c2ee97 diffChars so "one missing letter"
 * still lands on exactly that letter. */
function diffOpsAgainstAnswer(from: string, to: string): DiffOp[] {
  const n = from.length;
  const m = to.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        from[i] === to[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (from[i] === to[j]) {
      ops.push("same");
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push("skip"); // from[i] only — extra typing
      i++;
    } else {
      ops.push("fix"); // to[j] only — missing/wrong
      j++;
    }
  }
  while (i < n) {
    ops.push("skip");
    i++;
  }
  while (j < m) {
    ops.push("fix");
    j++;
  }
  return ops;
}

const NOISE_SIMILARITY_FLOOR = 0.4;

/** The answer, split into "same"/"fix" runs against what the learner typed
 * (adjacent same-status characters merged). Diffing happens on normalized
 * forms so case and curly-apostrophe differences are never marked — only
 * real mismatches, punctuation included. When there's nothing to compare
 * (typed is empty/whitespace) or the typing is too far off for the diff to
 * be useful (fewer than ~40% of the answer's characters line up), the whole
 * answer comes back as one "same" segment — the plain-answer case. */
export function diffAgainstAnswer(
  typed: string,
  answer: string,
): AnswerDiffSegment[] {
  const plain: AnswerDiffSegment[] = answer
    ? [{ text: answer, status: "same" }]
    : [];
  const normalizedTyped = normalizeAnswer(typed);
  if (!normalizedTyped || !answer) return plain;

  const answerChars = Array.from(answer);
  const normalizedAnswer = answerChars.map(normalizeCharForDiff).join("");
  const ops = diffOpsAgainstAnswer(normalizedTyped, normalizedAnswer);
  const answerOps = ops.filter((op) => op !== "skip") as Array<
    "same" | "fix"
  >;

  const sameCount = answerOps.filter((op) => op === "same").length;
  if (sameCount / answerChars.length < NOISE_SIMILARITY_FLOOR) return plain;

  const segments: AnswerDiffSegment[] = [];
  answerChars.forEach((char, index) => {
    const status = answerOps[index];
    const last = segments[segments.length - 1];
    if (last && last.status === status) last.text += char;
    else segments.push({ text: char, status });
  });
  return segments;
}
