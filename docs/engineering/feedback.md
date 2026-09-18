# Per-slide feedback

Owner-facing notes: `docs/backlog.md` ("Per-slide feedback"), and the
learner-facing design in `docs/design/student-experience.md`
("2026-09-17 — Feedback").

## Endpoint

`POST /api/feedback` (`web/src/app/api/feedback/route.ts`) — public, no
auth. Validated by `web/src/lib/feedback/validate.ts`
(`validateFeedbackPayload`, unit-tested in
`web/tests/unit/feedback-validate.test.ts`).

### Payload (original shape)

```json
{
  "lessonId": "lesson_123",
  "lessonName": "Lección 3",
  "slideIndex": 2,
  "slideKind": "sentence",
  "message": "El botón de continuar no responde en móvil.",
  "who": "Ana",
  "page": "/practice?lesson=lesson_123",
  "userAgent": "Mozilla/5.0 ...",
  "at": "2026-09-17T12:00:00.000Z"
}
```

- `message`: required, 1-2000 characters (trimmed).
- `who`: optional, 80 characters or fewer.
- `lessonId` / `lessonName`: `null` for slides with no lesson context (the
  home screen sends `slideKind: "home"` with both null).
- `slideIndex`: a number, or `null`.
- `slideKind`: `"explanation" | "sentence" | "completion" | "home"` in
  practice; anything else coerces to `"unknown"` rather than rejecting the
  request.
- `page` / `userAgent` / `at`: best-effort context from the browser; `at`
  defaults to the server's own timestamp if omitted or malformed.

This is still the core of the payload — see "Rich payload (2026-09-17)"
below for every field added since (the old `slideText` string field was
replaced by the structured `slide` object described there).

The route rate-limits lightly in memory (10 requests/minute per IP, evicting
stale IP entries once the map grows past 1000 keys so a flood of spoofed
`X-Forwarded-For` values can't grow it unbounded) and never logs the
`message` body to the console, in any environment. It also rejects the
request body outright above 32KB (checked against `Content-Length` and
again against the actual body, before `JSON.parse`), and every free-text
field accepted by `validateFeedbackPayload` is length-capped (`message`
1-2000, `who` ≤80, short identifiers like `lessonId`/`moduleId`/`slideId`
≤500, longer/URL-shaped fields like `page`/`userAgent` ≤2000, `slide` ≤8KB
serialized) so the endpoint can't be used to pad storage.

### Privacy note

This endpoint is the one place learner data leaves the device — everything
else (progress, streaks, mute/speaker preference) lives in `localStorage`
only. A submitted feedback record includes the note itself plus incidental
device/context fields the browser supplies automatically:
`userAgent`, `viewport` (`{ w, h }`), `navigator.language`, and whether the
last interaction was `touch` or `mouse`. These are collected only when the
learner presses "Enviar" on the feedback sheet — never in the background —
and only to help triage a report (e.g. "broken on mobile Safari"), not for
tracking. `who` is optional and free text (no account system, no email).

### Two backends

- **`FEEDBACK_WEBHOOK_URL` set**: the validated JSON record is forwarded as
  a `POST` with a 5-second timeout, and the route returns that response's
  status.
- **Unset (default for local dev)**: the record is appended as one JSON
  line to `web/data/feedback.jsonl` (created on first write; gitignored),
  so `npm run dev` still captures feedback without any setup.

**2026-09-17 update**: the payload below was extended with rich triage
metadata (where/what/who-did/device — see "Rich payload" below), and the
UI moved from three text-link triggers to one floating pill. The Google
Sheet section further down is **superseded**: feedback storage is moving to
Postgres with an `/admin/feedback` page in a later session, not a Google
Sheet — that section is left as historical context, not as the current
setup path. `data/feedback.jsonl` (the no-webhook fallback) is unaffected
and stays the source `npm run feedback:report` reads.

### Rich payload (2026-09-17)

Every field below is best-effort — `null`/absent rather than a rejected
request when the browser can't supply it. Only `message` (1-2000 chars),
`who` (≤80 chars) and the serialized size of `slide` (≤8KB) are enforced;
everything else is coerced to a safe type/default by
`validateFeedbackPayload`.

| Field | What |
| --- | --- |
| `moduleId`, `moduleName`, `lessonId`, `lessonName` | Where in the course. |
| `slideIndex`, `slideCount`, `slideKind`, `slideId` | Where on the slide list (`slideKind`: `explanation \| sentence \| completion \| home`). |
| `page`, `at`, `appVersion` | Browser path+query, ISO timestamp, build git sha (`NEXT_PUBLIC_APP_VERSION`, falls back to `"dev"`). |
| `slide` | What was on screen: `{ markdown }` (explanation), `{ instruction, pieces: [{ spanish, acceptedAnswers, given }] }` (sentence/table), `{ finalSentenceEnglish, finalSentenceSpanish }` (completion), `{ nextLessonId }` (home). |
| `answers` | `[{ index, typed, correct }]` — what the learner had typed on this slide. |
| `hintsUsed`, `secondsOnSlide`, `muted`, `speakerId` | What the learner had done on this slide. |
| `progress` | `{ lessonsCompleted, lessonsTotal }`. |
| `viewport`, `userAgent`, `language`, `pointer` | Device: `{ w, h }`, UA string, `navigator.language`, `"touch" \| "mouse"`. |
| `who`, `message` | The note itself. |

Built by `FeedbackContext` in `src/components/learner/feedback-sheet.tsx`
(device/timing fields are computed at submit time; `where`/`slide`/
`answers`/`hintsUsed`/`speakerId`/`progress` are assembled by the caller —
`LessonSession` in `src/components/practice/lesson-selector.tsx`, or
`LessonDashboard` for the home screen). `hintsUsed` on a sentence/table
slide comes from a counter in `useSentencePractice`
(`src/components/practice/use-sentence-practice.ts`), reported to the
caller via an `onHintsUsedChange` callback.

## Triage report

`npm run feedback:report [path]` (`scripts/feedback-report.ts`, logic in
`src/lib/feedback/report.ts`) reads `data/feedback.jsonl` by default (or
another path passed as an argument) and prints a Markdown report grouped by
module → lesson → slide: each slide's header (kind/index), its text
(explanation markdown, or "Spanish → accepted" per sentence piece), then
every note on it (who/when/device/answers/hints/message), ending with a
summary table (notes per lesson, top slides by note count). Unit-tested on
a 3-note fixture in `tests/unit/feedback-report.test.ts`. A Postgres-backed
reader (once feedback moves there) is planned for a later session — this
script stays JSONL-only for now.

## Google Sheet setup (for the owner) — superseded, see above

1. Create a new Google Sheet — one row per feedback record.
2. In the Sheet, open **Extensions → Apps Script**.
3. Replace the default code with:

   ```js
   function doPost(e) {
     var data = JSON.parse(e.postData.contents);
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     sheet.appendRow([
       data.at,
       data.lessonName,
       data.slideIndex,
       data.slideKind,
       data.slideText,
       data.message,
       data.who,
       data.page,
       data.userAgent,
     ]);
     return ContentService.createTextOutput(
       JSON.stringify({ ok: true }),
     ).setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. **Deploy → New deployment** → type **Web app** → execute as **Me**,
   access **Anyone**. Deploy and copy the resulting web app URL.
5. Set `FEEDBACK_WEBHOOK_URL` to that URL (in `.env`, or the deploy
   platform's environment variables) and restart the server.

## Practice UI

`web/src/components/learner/feedback-sheet.tsx` renders one floating pill
(bottom-right, `MessageCircle` icon + "Comentar", icon-only on phone) on
every learner screen — practice slides (`web/src/components/practice/
lesson-selector.tsx`, offset above the footer while a slide is in
progress), the completion screen (same file, no footer to clear), and home
(`web/src/components/learner/lesson-dashboard.tsx`). The home page's site
footer also has its own "Comentar" link, which opens the same sheet
instance via an imperative handle (`FeedbackSheetHandle`) rather than
duplicating it. Both former "¿Algo que corregir?" and "¿Qué te pareció?"
text-link triggers are gone. The "¿Quién eres?" field is prefilled from
`localStorage icc.feedback.who` every time the sheet opens (not just on
page load) and saved back on every keystroke, not only on submit. The pill
fades out while the sheet is open
(150ms, instant under `prefers-reduced-motion`) so it never sits under the
sheet's own controls. Styling lives in `web/src/styles/feedback-sheet.css`.
