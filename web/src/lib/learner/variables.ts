// Learner variables — values the learner supplies about themselves during a
// lesson (their name today, maybe a favourite colour later) and that lessons
// can then speak back with a `{key}` token. See docs/design/onboarding.md
// "The capture piece".
//
// localStorage is the only store; nothing is ever sent anywhere. Every
// access is try/catch-wrapped, same pattern as onboarding.ts and progress.ts
// — a private window or blocked storage degrades to "no variables", never to
// a thrown render.
//
// This module is deliberately React-free and DOM-optional so the audio
// generator (a plain Node/tsx process, src/lib/audio/generate-clips.ts) can
// import the token helpers below. The React binding lives next door in
// use-learner-variables.ts.

export const learnerVariablesStorageKey = "icc.learner.v1";

export type LearnerVariables = Record<string, string>;

/** A variable key: lowercase, starts with a letter — `name`, `color_favorito`. */
const learnerVariableKeyPattern = /^[a-z][a-z0-9_]*$/;

export function isLearnerVariableKey(key: string): boolean {
  return learnerVariableKeyPattern.test(key);
}

// -----------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------

// Snapshot cache so `useSyncExternalStore` (use-learner-variables.ts) gets a
// referentially stable object between writes — re-reading/re-parsing on every
// render would hand React a new object each time and loop forever.
let snapshot: LearnerVariables | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): LearnerVariables {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(learnerVariablesStorageKey);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const variables: LearnerVariables = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (typeof entry === "string" && isLearnerVariableKey(key)) {
        variables[key] = entry;
      }
    }
    return variables;
  } catch {
    return {};
  }
}

function invalidate() {
  snapshot = null;
  for (const listener of listeners) listener();
}

/** Every stored variable. Cached between writes — treat the result as frozen. */
export function readLearnerVariables(): LearnerVariables {
  snapshot ??= readFromStorage();
  return snapshot;
}

export function getLearnerVariable(key: string): string | null {
  return readLearnerVariables()[key] ?? null;
}

/** Stores `value` under `key`. An empty (or whitespace-only) value removes
 * the key, so a cleared field never leaves a blank name behind. */
export function setLearnerVariable(key: string, value: string): void {
  if (!isLearnerVariableKey(key)) return;
  const next = { ...readLearnerVariables() };
  const trimmed = value.trim();
  if (trimmed) next[key] = trimmed;
  else delete next[key];
  try {
    if (Object.keys(next).length === 0) {
      window.localStorage.removeItem(learnerVariablesStorageKey);
    } else {
      window.localStorage.setItem(
        learnerVariablesStorageKey,
        JSON.stringify(next),
      );
    }
  } catch {
    // Blocked storage: the value still applies for this render pass through
    // the cache below, it just won't survive a reload.
  }
  snapshot = next;
  for (const listener of listeners) listener();
}

/** "Reiniciar todo" clears these along with progress and onboarding. */
export function clearLearnerVariables(): void {
  try {
    window.localStorage.removeItem(learnerVariablesStorageKey);
  } catch {
    // Best-effort, same as resetOnboarding().
  }
  invalidate();
}

export function subscribeLearnerVariables(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test seam: drop the cached snapshot so the next read hits storage again. */
export function resetLearnerVariablesCache(): void {
  invalidate();
}

// -----------------------------------------------------------------------
// Tokens
// -----------------------------------------------------------------------

// `{name}` or `{name|amigo}` — the fallback runs to the closing brace and may
// contain spaces, but never a brace or a pipe.
const TOKEN_RE = /\{([a-z][a-z0-9_]*)(?:\|([^}|]*))?\}/g;

function hasVariableToken(text: string): boolean {
  TOKEN_RE.lastIndex = 0;
  return TOKEN_RE.test(text);
}

/**
 * Tidies what an empty substitution leaves behind: doubled spaces, a space
 * before punctuation, a comma stranded in front of a full stop ("Hi, !" →
 * "Hi!"), and a line that now starts with punctuation. Line-by-line, so a
 * multi-paragraph explanation is tidied paragraph by paragraph.
 */
function tidy(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]{2,}/g, " ")
        .replace(/[ \t]+([,.!?;:])/g, "$1")
        .replace(/([,;:])(?=[ \t]*[.!?])/g, "")
        .replace(/^[ \t,;:]+/, "")
        .trimEnd(),
    )
    .join("\n");
}

/**
 * Replaces every `{key}` / `{key|fallback}` in `text` with the learner's
 * value, the fallback, or nothing — in that order. When a token resolves to
 * nothing the result is tidied (see `tidy`); text whose tokens all resolved
 * is returned exactly as authored.
 *
 * Pure: never touches storage, never writes back into lesson data.
 */
export function substituteVariables(
  text: string,
  variables: LearnerVariables,
): string {
  let emptied = false;
  const out = text.replace(TOKEN_RE, (_match, key: string, fallback?: string) => {
    const value = variables[key]?.trim();
    if (value) return value;
    const fallbackValue = fallback?.trim();
    if (fallbackValue) return fallbackValue;
    emptied = true;
    return "";
  });
  return emptied ? tidy(out) : out;
}

/**
 * The same text with every token REMOVED (fallbacks included) and tidied —
 * "Hi, {name}!" → "Hi!". This is the text a pre-generated clip says, because
 * a clip cannot pronounce a variable. Both the generator
 * (src/lib/audio/generate-clips.ts) and playback (explanation-step.tsx,
 * instruction-audio.tsx) key their clip off THIS function, so the two sides
 * hash the same string. See docs/design/speech.md "Variables".
 */
export function spokenTextWithoutVariables(text: string): string {
  if (!hasVariableToken(text)) return text;
  return tidy(text.replace(TOKEN_RE, ""));
}

// -----------------------------------------------------------------------
// Capture values
// -----------------------------------------------------------------------

/** What a capture field accepts: any non-empty trimmed input, 1–40 chars. */
export function isAcceptableCaptureValue(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.length >= 1 && trimmed.length <= 40;
}

/**
 * The value actually stored from what the learner typed: trailing sentence
 * punctuation dropped ("James." → "James", the full stop belongs to the
 * piece's `suffix`), their own capitalisation kept, and a first letter
 * upper-cased only when they typed the whole thing lowercase ("james" →
 * "James", "mcDonald" left alone).
 */
export function normalizeCaptureValue(raw: string): string {
  const trimmed = raw.trim().replace(/[.,!?]+$/u, "").trim();
  if (!trimmed) return "";
  if (/\p{Lu}/u.test(trimmed)) return trimmed;
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}
