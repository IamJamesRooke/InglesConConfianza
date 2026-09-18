// Turns a validated feedback record into a GitHub issue for the private
// feedback repo (docs/backlog.md "Feedback to issues" 2026-09-18,
// docs/engineering/feedback.md, docs/engineering/feedback-triage.md). Pure
// and Next.js-free so it can be unit-tested directly
// (tests/unit/feedback-github-issue.test.ts) — the route
// (src/app/api/feedback/route.ts) is the only caller.

import type { FeedbackAnswerEntry, FeedbackRecord } from "./validate";

export type FeedbackIssueDraft = {
  title: string;
  body: string;
  labels: string[];
};

export type BuildFeedbackIssueOptions = {
  // Not built yet — reserved so a future screenshot-attachment feature
  // (docs/backlog.md) can add an image link to the body without changing
  // buildFeedbackIssue's signature.
  imageUrl?: string;
};

// Labels the private repo is known to have (docs/backlog.md 2026-09-18). A
// fine-grained token scoped to "Issues: write" cannot create new labels —
// GitHub returns 422 if the request names one it doesn't recognise — so
// createFeedbackIssue retries with only these.
export const KNOWN_LABELS = ["nuevo", "problema", "idea", "elogio", "sin clasificar"] as const;
const KNOWN_LABEL_SET = new Set<string>(KNOWN_LABELS);

const TITLE_MAX = 70;
const LESSON_LABEL_MAX = 40;
const BODY_MAX = 60_000; // GitHub's own issue body cap is 65536.
const SLIDE_TEXT_MAX = 600;

/** Defuses `@mentions` and `#123` autolinks, and strips raw HTML tags — a
 * learner's free-text message becomes a GitHub issue body verbatim, so it
 * must not be able to ping someone or link a random issue/PR. */
function escapeMarkdown(text: string): string {
  return text
    .replace(/@/g, "@​")
    .replace(/#(\d+)/g, "#​$1")
    .replace(/<\/?[a-zA-Z!][^>]*>/g, "");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function firstLine(text: string): string {
  return (text.split(/\r?\n/, 1)[0] ?? "").trim();
}

function field(label: string, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? `- **${label}:** ${text}` : null;
}

/** Best-effort one-line summary of the slide snapshot — its shape depends
 * on slideKind (see FeedbackContext in feedback-sheet.tsx). */
function describeSlide(slide: FeedbackRecord["slide"]): string | null {
  if (!slide) return null;
  if (typeof slide.markdown === "string" && slide.markdown.trim()) {
    return slide.markdown.trim();
  }
  if (typeof slide.instruction === "string" || Array.isArray(slide.pieces)) {
    const instruction = typeof slide.instruction === "string" ? slide.instruction.trim() : "";
    const pieces = Array.isArray(slide.pieces)
      ? (slide.pieces as Array<Record<string, unknown>>)
          .map((piece) => (typeof piece.spanish === "string" ? piece.spanish : null))
          .filter((value): value is string => Boolean(value))
          .join(" / ")
      : "";
    const combined = [instruction, pieces].filter(Boolean).join(" — ");
    return combined || null;
  }
  if (
    typeof slide.finalSentenceSpanish === "string" ||
    typeof slide.finalSentenceEnglish === "string"
  ) {
    const combined = [slide.finalSentenceSpanish, slide.finalSentenceEnglish]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" → ");
    return combined || null;
  }
  return null;
}

function describeAnswers(answers: FeedbackAnswerEntry[]): string | null {
  if (!answers.length) return null;
  return answers
    .map((answer) => `#${answer.index}: "${answer.typed}" (${answer.correct ? "correcta" : "incorrecta"})`)
    .join("; ");
}

/**
 * Builds the issue draft for a validated feedback record. Title = the
 * first ~70 chars of the message on one line, prefixed by the lesson name
 * when known. Body = the message as a blockquote, then every non-empty
 * field the payload carries. Labels = `nuevo`, the kind (or
 * `sin clasificar`), `leccion: <name>` when known, `slide: <kind>` when
 * known.
 */
export function buildFeedbackIssue(
  payload: FeedbackRecord,
  options: BuildFeedbackIssueOptions = {},
): FeedbackIssueDraft {
  void options; // imageUrl not built yet — see the doc comment above.

  const messageOneLine = escapeMarkdown(firstLine(payload.message)).replace(/\s+/g, " ").trim();
  const titleBody = truncate(messageOneLine || "(sin texto)", TITLE_MAX);
  const title = payload.lessonName
    ? truncate(`${escapeMarkdown(payload.lessonName)}: ${titleBody}`, TITLE_MAX)
    : titleBody;

  const quoted = escapeMarkdown(payload.message)
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");

  const slideSummaryParts = [
    payload.slideKind && payload.slideKind !== "unknown" ? payload.slideKind : null,
    payload.slideIndex !== null ? `#${payload.slideIndex}` : null,
    payload.slideCount !== null ? `de ${payload.slideCount}` : null,
  ].filter(Boolean);

  const slideText = describeSlide(payload.slide);
  const answersText = describeAnswers(payload.answers);

  const fieldLines = [
    field("Quién", payload.who ? escapeMarkdown(payload.who) : null),
    field("Tipo", payload.kind),
    field("Módulo", payload.moduleName ? escapeMarkdown(payload.moduleName) : payload.moduleId),
    field("Lección", payload.lessonName ? escapeMarkdown(payload.lessonName) : payload.lessonId),
    field("Slide", slideSummaryParts.length ? slideSummaryParts.join(" ") : null),
    field("Slide id", payload.slideId),
    field(
      "Texto en pantalla",
      slideText ? escapeMarkdown(truncate(slideText, SLIDE_TEXT_MAX)) : null,
    ),
    field("Respuesta escrita", answersText ? escapeMarkdown(answersText) : null),
    field("Pistas usadas", payload.hintsUsed),
    field("Segundos en la diapositiva", payload.secondsOnSlide),
    field("Silenciado", payload.muted === null ? null : payload.muted ? "sí" : "no"),
    field("Voz", payload.speakerId),
    field(
      "Progreso",
      payload.progress ? `${payload.progress.lessonsCompleted}/${payload.progress.lessonsTotal} lecciones` : null,
    ),
    field("Página", payload.page ? escapeMarkdown(payload.page) : null),
    field("Viewport", payload.viewport ? `${payload.viewport.w}×${payload.viewport.h}` : null),
    field("Navegador", payload.userAgent ? escapeMarkdown(payload.userAgent) : null),
    field("Idioma", payload.language),
    field("Puntero", payload.pointer),
    field("Versión", payload.appVersion),
    field("Hora", payload.at),
  ].filter((line): line is string => line !== null);

  const body = truncate(
    [quoted, "", "### Contexto", ...fieldLines].join("\n"),
    BODY_MAX,
  );

  const labels = [
    "nuevo",
    payload.kind ?? "sin clasificar",
    payload.lessonName ? `leccion: ${truncate(payload.lessonName, LESSON_LABEL_MAX)}` : null,
    payload.slideKind && payload.slideKind !== "unknown" ? `slide: ${payload.slideKind}` : null,
  ].filter((label): label is string => Boolean(label));

  return { title, body, labels };
}

export type CreateFeedbackIssueOptions = {
  token: string;
  repo: string; // "owner/name"
  fetchImpl?: typeof fetch;
};

export type CreateFeedbackIssueResult =
  | { ok: true; issueNumber: number; issueUrl: string }
  | { ok: false; error: string };

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const TIMEOUT_MS = 8000;

async function postIssue(
  repo: string,
  token: string,
  fetchImpl: typeof fetch,
  draft: FeedbackIssueDraft,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetchImpl(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Posts an issue draft to the private feedback repo. On a 422 (the
 * fine-grained token can't create the unknown labels GitHub would
 * otherwise auto-create), retries once with only the labels known to
 * exist, noting the dropped ones as a line in the body.
 */
export async function createFeedbackIssue(
  issue: FeedbackIssueDraft,
  options: CreateFeedbackIssueOptions,
): Promise<CreateFeedbackIssueResult> {
  const { token, repo } = options;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!REPO_PATTERN.test(repo)) {
    return { ok: false, error: `Invalid repo "${repo}".` };
  }

  try {
    let response = await postIssue(repo, token, fetchImpl, issue);

    if (response.status === 422) {
      const dropped = issue.labels.filter((label) => !KNOWN_LABEL_SET.has(label));
      const knownLabels = issue.labels.filter((label) => KNOWN_LABEL_SET.has(label));
      const retryBody = dropped.length
        ? truncate(
            `${issue.body}\n\n---\n_Etiquetas no aplicadas (el token no puede crear etiquetas nuevas): ${dropped.join(", ")}_`,
            BODY_MAX,
          )
        : issue.body;
      response = await postIssue(repo, token, fetchImpl, {
        title: issue.title,
        body: retryBody,
        labels: knownLabels,
      });
    }

    if (!response.ok) {
      return { ok: false, error: `GitHub returned ${response.status}.` };
    }

    const data = (await response.json()) as { number: number; html_url: string };
    return { ok: true, issueNumber: data.number, issueUrl: data.html_url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error creating issue.",
    };
  }
}
