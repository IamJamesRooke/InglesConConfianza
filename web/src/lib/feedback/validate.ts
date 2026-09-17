// Per-slide feedback (docs/backlog.md "Per-slide feedback", docs/engineering/feedback.md).
// Validates the body of POST /api/feedback before it is forwarded to the
// owner's webhook or appended to data/feedback.jsonl. Kept free of Next.js
// imports so it can be unit-tested directly (tests/unit/feedback-validate.test.ts).

export type FeedbackRecord = {
  lessonId: string | null;
  lessonName: string | null;
  slideIndex: number | null;
  slideKind: string;
  slideText: string | null;
  message: string;
  who: string | null;
  page: string;
  userAgent: string;
  at: string;
};

export type FeedbackValidationResult =
  | { ok: true; value: FeedbackRecord }
  | { ok: false; error: string };

const MESSAGE_MIN = 1;
const MESSAGE_MAX = 2000;
const WHO_MAX = 80;

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * Validates and normalizes an unknown JSON body into a FeedbackRecord.
 * Only `message` (1-2000 chars, trimmed) and `who` (<=80 chars) are
 * strictly enforced per the spec; the contextual fields are coerced to
 * sensible types/defaults rather than rejected, since a malformed or
 * missing slide context shouldn't block the learner's note from landing.
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

  const slideKind =
    typeof record.slideKind === "string" && record.slideKind.trim()
      ? record.slideKind.trim()
      : "unknown";

  const slideIndex =
    typeof record.slideIndex === "number" && Number.isFinite(record.slideIndex)
      ? record.slideIndex
      : null;

  const at =
    typeof record.at === "string" && record.at ? record.at : new Date().toISOString();

  return {
    ok: true,
    value: {
      lessonId: asNullableString(record.lessonId),
      lessonName: asNullableString(record.lessonName),
      slideIndex,
      slideKind,
      slideText: asNullableString(record.slideText),
      message,
      who: whoRaw || null,
      page: typeof record.page === "string" ? record.page : "",
      userAgent: typeof record.userAgent === "string" ? record.userAgent : "",
      at,
    },
  };
}
