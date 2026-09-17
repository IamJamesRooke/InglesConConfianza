// Per-slide feedback (docs/backlog.md "Per-slide feedback", docs/engineering/feedback.md).
// Validates the body of POST /api/feedback before it is forwarded to the
// owner's webhook or appended to data/feedback.jsonl. Kept free of Next.js
// imports so it can be unit-tested directly (tests/unit/feedback-validate.test.ts).

// What was on screen when the note was sent — shape depends on slideKind
// (e.g. { markdown } for an explanation, { instruction, pieces } for a
// sentence/table — see FeedbackContext in feedback-sheet.tsx, which builds
// it on the client).
// Kept as a loose record (rather than a discriminated union) since it's
// coerced best-effort from an untrusted body, not constructed by our own
// code on the way in.
type FeedbackSlideSnapshot = Record<string, unknown> | null;

type FeedbackAnswerEntry = {
  index: number;
  typed: string;
  correct: boolean;
};

type FeedbackRecord = {
  // Where.
  moduleId: string | null;
  moduleName: string | null;
  lessonId: string | null;
  lessonName: string | null;
  slideIndex: number | null;
  slideCount: number | null;
  slideKind: string;
  slideId: string | null;
  page: string;
  at: string;
  appVersion: string;
  // What was on screen.
  slide: FeedbackSlideSnapshot;
  // What the learner had done.
  answers: FeedbackAnswerEntry[];
  hintsUsed: number | null;
  secondsOnSlide: number | null;
  muted: boolean | null;
  speakerId: string | null;
  progress: { lessonsCompleted: number; lessonsTotal: number } | null;
  // Device.
  viewport: { w: number; h: number } | null;
  userAgent: string;
  language: string | null;
  pointer: "touch" | "mouse" | null;
  // The note itself.
  who: string | null;
  message: string;
};

export type FeedbackValidationResult =
  | { ok: true; value: FeedbackRecord }
  | { ok: false; error: string };

const MESSAGE_MIN = 1;
const MESSAGE_MAX = 2000;
const WHO_MAX = 80;
const SLIDE_JSON_MAX_BYTES = 8 * 1024;

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asAnswers(value: unknown): FeedbackAnswerEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: FeedbackAnswerEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const index = asNullableNumber(record.index);
    if (index === null) continue;
    entries.push({
      index,
      typed: typeof record.typed === "string" ? record.typed.slice(0, 500) : "",
      correct: record.correct === true,
    });
  }
  return entries;
}

function asProgress(
  value: unknown,
): { lessonsCompleted: number; lessonsTotal: number } | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const lessonsCompleted = asNullableNumber(record.lessonsCompleted);
  const lessonsTotal = asNullableNumber(record.lessonsTotal);
  if (lessonsCompleted === null || lessonsTotal === null) return null;
  return { lessonsCompleted, lessonsTotal };
}

function asViewport(value: unknown): { w: number; h: number } | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const w = asNullableNumber(record.w);
  const h = asNullableNumber(record.h);
  if (w === null || h === null) return null;
  return { w, h };
}

function asPointer(value: unknown): "touch" | "mouse" | null {
  return value === "touch" || value === "mouse" ? value : null;
}

function asSlide(value: unknown): FeedbackSlideSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Validates and normalizes an unknown JSON body into a FeedbackRecord.
 * Only `message` (1-2000 chars, trimmed), `who` (<=80 chars) and the size of
 * the `slide` snapshot (<=8KB serialized) are strictly enforced; every other
 * field is coerced to a sensible type/default rather than rejected, since a
 * malformed or missing bit of context shouldn't block the learner's note
 * from landing.
 */
export function validateFeedbackPayload(body: unknown): FeedbackValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const record = body as Record<string, unknown>;

  const message =
    typeof record.message === "string" ? record.message.trim() : "";
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return {
      ok: false,
      error: `message must be between ${MESSAGE_MIN} and ${MESSAGE_MAX} characters.`,
    };
  }

  const whoRaw = typeof record.who === "string" ? record.who.trim() : "";
  if (whoRaw.length > WHO_MAX) {
    return { ok: false, error: `who must be ${WHO_MAX} characters or fewer.` };
  }

  const slide = asSlide(record.slide);
  if (slide) {
    const slideBytes = Buffer.byteLength(JSON.stringify(slide), "utf8");
    if (slideBytes > SLIDE_JSON_MAX_BYTES) {
      return { ok: false, error: "slide context is too large." };
    }
  }

  const slideKind =
    typeof record.slideKind === "string" && record.slideKind.trim()
      ? record.slideKind.trim()
      : "unknown";

  const at =
    typeof record.at === "string" && record.at ? record.at : new Date().toISOString();

  return {
    ok: true,
    value: {
      moduleId: asNullableString(record.moduleId),
      moduleName: asNullableString(record.moduleName),
      lessonId: asNullableString(record.lessonId),
      lessonName: asNullableString(record.lessonName),
      slideIndex: asNullableNumber(record.slideIndex),
      slideCount: asNullableNumber(record.slideCount),
      slideKind,
      slideId: asNullableString(record.slideId),
      page: typeof record.page === "string" ? record.page : "",
      at,
      appVersion:
        typeof record.appVersion === "string" && record.appVersion
          ? record.appVersion
          : "dev",
      slide,
      answers: asAnswers(record.answers),
      hintsUsed: asNullableNumber(record.hintsUsed),
      secondsOnSlide: asNullableNumber(record.secondsOnSlide),
      muted: asNullableBoolean(record.muted),
      speakerId: asNullableString(record.speakerId),
      progress: asProgress(record.progress),
      viewport: asViewport(record.viewport),
      userAgent: typeof record.userAgent === "string" ? record.userAgent : "",
      language: asNullableString(record.language),
      pointer: asPointer(record.pointer),
      who: whoRaw || null,
      message,
    },
  };
}
