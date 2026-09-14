/**
 * Pure helpers for the sentence editor's single-field English-alternatives
 * entry (`formatAnswerEntry` for display, `parseAnswerEntry` for commit).
 * No React, no DOM, no lesson-store coupling — see
 * docs/design/lesson-builder.md for the authoring contract this implements.
 *
 * Delimiter: the canonical, authored-facing separator is ` / ` (slash with
 * surrounding spaces). A bare, unescaped `;` is ALSO accepted as a split
 * point on parse, purely for backward compatibility with how teachers used
 * to type multiple accepted answers before this single-field UI existed —
 * new content formatted by this module always uses `/`.
 *
 * Escaping: a literal `/`, `;`, or `\` inside one accepted answer (a URL, a
 * fraction like "1/2", a semicolon in prose, an escaped backslash itself)
 * is round-tripped via backslash escapes: `\/`, `\;`, `\\`. `formatAnswerEntry`
 * introduces these escapes (backslash first, so it never double-escapes the
 * backslashes it just inserted); `parseAnswerEntry` removes them.
 *
 * Unknown escapes: a backslash followed by any character other than
 * `/`, `;`, or `\` is not a defined escape sequence. Chosen behavior: keep
 * the backslash and the following character both literally, as plain text,
 * rather than silently dropping the backslash (which would corrupt
 * already-stored content) or throwing (which would block authoring on
 * accepted-answer arrays this module didn't itself write). This only
 * matters for pre-existing data containing a lone backslash before some
 * other character — content newly formatted by `formatAnswerEntry` never
 * produces an unknown escape.
 */

const ESCAPABLE = new Set(["/", ";", "\\"]);

function escapeAnswer(answer: string): string {
  // Backslash first, or the backslashes introduced by the next two
  // replacements would themselves get escaped again.
  return answer
    .replace(/\\/g, "\\\\")
    .replace(/\//g, "\\/")
    .replace(/;/g, "\\;");
}

/** Formats stored accepted answers into one editable string. Never splits
 * or reinterprets the input strings themselves — each array entry is one
 * atomic stored answer, escaped only so it can round-trip through the
 * shared field without being mistaken for a delimiter. */
export function formatAnswerEntry(answers: readonly string[]): string {
  return answers.map(escapeAnswer).join(" / ");
}

/** Splits one authored entry string into its raw (untrimmed) pieces on any
 * unescaped `/` or `;`, resolving `\/`, `\;`, `\\` escapes and leaving an
 * unknown `\x` escape as the literal two characters `\x`. */
function splitEntries(value: string): string[] {
  const entries: string[] = [];
  let current = "";
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "\\") {
      const next = value[i + 1];
      if (next !== undefined && ESCAPABLE.has(next)) {
        current += next;
        i += 1;
        continue;
      }
      // Unknown escape (or trailing backslash at end of string): keep the
      // backslash literally; the following character (if any) is handled
      // normally on the next iteration.
      current += char;
      continue;
    }
    if (char === "/" || char === ";") {
      entries.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  entries.push(current);
  return entries;
}

/** Parses one committed field value back into a stored accepted-answer
 * array: splits on unescaped `/` or `;`, resolves escapes, trims each
 * piece, drops empty pieces, and dedupes exact (case-sensitive) repeats
 * while preserving first-seen order. An empty/whitespace-only value
 * returns `[]`. */
export function parseAnswerEntry(value: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of splitEntries(value)) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}
