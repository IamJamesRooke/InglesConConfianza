import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFeedbackIssue,
  createFeedbackIssue,
  KNOWN_LABELS,
} from "../../src/lib/feedback/github-issue";
import type { FeedbackRecord } from "../../src/lib/feedback/validate";

function baseRecord(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    moduleId: "module_1",
    moduleName: "Módulo 1",
    lessonId: "lesson_1",
    lessonName: "Lección 1",
    slideIndex: 2,
    slideCount: 5,
    slideKind: "sentence",
    slideId: "block_1",
    page: "/practice?lesson=lesson_1",
    at: "2026-09-18T00:00:00.000Z",
    appVersion: "abc1234",
    slide: {
      instruction: "Completa la frase.",
      pieces: [{ spanish: "Quiero saber algo.", acceptedAnswers: ["I want to know something."] }],
    },
    answers: [{ index: 0, typed: "I want to know something.", correct: true }],
    hintsUsed: 1,
    secondsOnSlide: 12,
    muted: false,
    speakerId: "us-man",
    progress: { lessonsCompleted: 1, lessonsTotal: 10 },
    viewport: { w: 1280, h: 800 },
    userAgent: "test-agent",
    language: "es-CO",
    pointer: "mouse",
    who: "Ana",
    message: "El botón de continuar no responde en móvil.",
    kind: "problema",
    ...overrides,
  };
}

test("buildFeedbackIssue: title is the message, prefixed by the lesson name", () => {
  const issue = buildFeedbackIssue(baseRecord());
  assert.equal(issue.title, "Lección 1: El botón de continuar no responde en móvil.");
});

test("buildFeedbackIssue: title falls back to the message alone with no lesson", () => {
  const issue = buildFeedbackIssue(baseRecord({ lessonName: null }));
  assert.equal(issue.title, "El botón de continuar no responde en móvil.");
});

test("buildFeedbackIssue: title is capped to ~70 characters", () => {
  const issue = buildFeedbackIssue(
    baseRecord({ lessonName: null, message: "a".repeat(200) }),
  );
  assert.ok(issue.title.length <= 70);
  assert.ok(issue.title.endsWith("\u2026"));
});

test("buildFeedbackIssue: title uses only the first line of a multi-line message", () => {
  const issue = buildFeedbackIssue(
    baseRecord({ lessonName: null, message: "Primera línea\nSegunda línea" }),
  );
  assert.equal(issue.title, "Primera línea");
});

test("buildFeedbackIssue: labels include nuevo, the kind, lesson and slide kind", () => {
  const issue = buildFeedbackIssue(baseRecord());
  assert.deepEqual(issue.labels, ["nuevo", "problema", "leccion: Lección 1", "slide: sentence"]);
});

test("buildFeedbackIssue: unclassified kind becomes sin clasificar", () => {
  const issue = buildFeedbackIssue(baseRecord({ kind: null }));
  assert.ok(issue.labels.includes("sin clasificar"));
});

test("buildFeedbackIssue: lesson label is capped to 40 characters", () => {
  const issue = buildFeedbackIssue(baseRecord({ lessonName: "L".repeat(60) }));
  const lessonLabel = issue.labels.find((label) => label.startsWith("leccion:"))!;
  assert.ok(lessonLabel.length <= 40 + "leccion: ".length);
});

test("buildFeedbackIssue: no lesson label or slide label when absent", () => {
  const issue = buildFeedbackIssue(
    baseRecord({ lessonName: null, lessonId: null, slideKind: "unknown" }),
  );
  assert.ok(!issue.labels.some((label) => label.startsWith("leccion:")));
  assert.ok(!issue.labels.some((label) => label.startsWith("slide:")));
});

test("buildFeedbackIssue: body quotes the message and lists every non-empty field", () => {
  const issue = buildFeedbackIssue(baseRecord());
  assert.ok(issue.body.startsWith("> El botón de continuar no responde en móvil."));
  assert.match(issue.body, /\*\*Quién:\*\* Ana/);
  assert.match(issue.body, /\*\*Tipo:\*\* problema/);
  assert.match(issue.body, /\*\*Módulo:\*\* Módulo 1/);
  assert.match(issue.body, /\*\*Lección:\*\* Lección 1/);
  assert.match(issue.body, /\*\*Slide:\*\* sentence #2 de 5/);
  assert.match(issue.body, /\*\*Texto en pantalla:\*\*/);
  assert.match(issue.body, /\*\*Respuesta escrita:\*\*/);
  assert.match(issue.body, /\*\*Pistas usadas:\*\* 1/);
  assert.match(issue.body, /\*\*Viewport:\*\* 1280×800/);
  assert.match(issue.body, /\*\*Navegador:\*\* test-agent/);
  assert.match(issue.body, /\*\*Hora:\*\* 2026-09-18T00:00:00.000Z/);
});

test("buildFeedbackIssue: omits empty/null fields entirely", () => {
  const issue = buildFeedbackIssue(
    baseRecord({
      who: null,
      moduleId: null,
      moduleName: null,
      speakerId: null,
      progress: null,
      language: null,
      pointer: null,
    }),
  );
  assert.ok(!issue.body.includes("**Quién:**"));
  assert.ok(!issue.body.includes("**Módulo:**"));
  assert.ok(!issue.body.includes("**Voz:**"));
  assert.ok(!issue.body.includes("**Progreso:**"));
  assert.ok(!issue.body.includes("**Idioma:**"));
  assert.ok(!issue.body.includes("**Puntero:**"));
});

test("buildFeedbackIssue: escapes @mentions so GitHub can't ping anyone", () => {
  const issue = buildFeedbackIssue(baseRecord({ message: "cc @someone please fix" }));
  assert.ok(!issue.body.includes("@someone"));
  assert.ok(issue.body.includes("@\u200bsomeone"));
});

test("buildFeedbackIssue: escapes #123-style autolinks", () => {
  const issue = buildFeedbackIssue(baseRecord({ message: "same as #123 from before" }));
  assert.ok(!issue.body.includes("#123"));
  assert.ok(issue.body.includes("#\u200b123"));
});

test("buildFeedbackIssue: strips HTML tags from free text", () => {
  const issue = buildFeedbackIssue(
    baseRecord({ message: "<script>alert(1)</script> broken layout", who: "<b>Ana</b>" }),
  );
  assert.ok(!issue.body.includes("<script>"));
  assert.ok(!issue.body.includes("<b>"));
});

test("buildFeedbackIssue: hard-caps the body length", () => {
  const issue = buildFeedbackIssue(baseRecord({ message: "a".repeat(3000) }));
  assert.ok(issue.body.length <= 60_000);
});

test("createFeedbackIssue: posts to the repo issues endpoint and returns the created issue", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(JSON.stringify({ number: 42, html_url: "https://example.com/42" }), {
      status: 201,
    });
  }) as typeof fetch;

  const result = await createFeedbackIssue(
    { title: "t", body: "b", labels: ["nuevo"] },
    { token: "secret-token", repo: "owner/repo", fetchImpl },
  );

  assert.deepEqual(result, { ok: true, issueNumber: 42, issueUrl: "https://example.com/42" });
  assert.equal(capturedUrl, "https://api.github.com/repos/owner/repo/issues");
  const headers = capturedInit!.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer secret-token");
  assert.equal(headers.Accept, "application/vnd.github+json");
  assert.equal(headers["X-GitHub-Api-Version"], "2022-11-28");
});

test("createFeedbackIssue: retries once with only known labels on a 422", async () => {
  const calls: Array<{ labels: string[]; body: string }> = [];
  let call = 0;
  const fetchImpl = (async (_url: string, init?: RequestInit) => {
    call += 1;
    const parsed = JSON.parse(init!.body as string) as { labels: string[]; body: string };
    calls.push(parsed);
    if (call === 1) {
      return new Response(JSON.stringify({ message: "unknown label" }), { status: 422 });
    }
    return new Response(JSON.stringify({ number: 7, html_url: "https://example.com/7" }), {
      status: 201,
    });
  }) as typeof fetch;

  const result = await createFeedbackIssue(
    { title: "t", body: "b", labels: ["nuevo", "problema", "leccion: Lección 1"] },
    { token: "secret-token", repo: "owner/repo", fetchImpl },
  );

  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0]!.labels, ["nuevo", "problema", "leccion: Lección 1"]);
  assert.deepEqual(calls[1]!.labels, ["nuevo", "problema"]);
  for (const known of KNOWN_LABELS) {
    void known;
  }
  assert.ok(calls[1]!.body.includes("leccion: Lección 1"));
});

test("createFeedbackIssue: reports failure without throwing on a network error", async () => {
  const fetchImpl = (async () => {
    throw new Error("network down");
  }) as typeof fetch;

  const result = await createFeedbackIssue(
    { title: "t", body: "b", labels: ["nuevo"] },
    { token: "secret-token", repo: "owner/repo", fetchImpl },
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /network down/);
});

test("createFeedbackIssue: rejects a malformed repo string without calling fetch", async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  const result = await createFeedbackIssue(
    { title: "t", body: "b", labels: ["nuevo"] },
    { token: "secret-token", repo: "not-a-valid-repo", fetchImpl },
  );

  assert.equal(result.ok, false);
  assert.equal(called, false);
});
