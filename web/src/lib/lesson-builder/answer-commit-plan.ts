/**
 * Pure diff between a committed accepted-answers array and the parsed
 * result of the sentence editor's local English-alternatives draft. Turns
 * the diff into the minimal ordered sequence of existing mutation-callback
 * calls (update/append/remove by index) needed to reconcile them — so an
 * unedited field produces zero operations (no history noise, no eager
 * rewriting), and a shrink/grow only touches the indices that actually
 * changed. See docs/design/lesson-builder.md.
 */

export type AnswerCommitOp =
  | { kind: "update"; index: number; value: string }
  | { kind: "append"; index: number; value: string }
  | { kind: "remove"; index: number };

export function planAcceptedAnswersCommit(
  current: readonly string[],
  next: readonly string[],
): AnswerCommitOp[] {
  const ops: AnswerCommitOp[] = [];
  const overlap = Math.min(current.length, next.length);
  for (let index = 0; index < overlap; index += 1) {
    if (current[index] !== next[index]) ops.push({ kind: "update", index, value: next[index] });
  }
  if (next.length > current.length) {
    for (let index = current.length; index < next.length; index += 1) {
      ops.push({ kind: "append", index, value: next[index] });
    }
  } else if (next.length < current.length) {
    // Descending so each remove's index is still valid against the
    // not-yet-shrunk array (removing from the end never shifts an
    // earlier, still-pending removal index).
    for (let index = current.length - 1; index >= next.length; index -= 1) {
      ops.push({ kind: "remove", index });
    }
  }
  return ops;
}
