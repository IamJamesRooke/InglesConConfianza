# Per-slide feedback

Owner-facing notes: `docs/backlog.md` ("Per-slide feedback"), and the
learner-facing design in `docs/design/student-experience.md`
("2026-09-17 — Feedback").

## Endpoint

`POST /api/feedback` (`web/src/app/api/feedback/route.ts`) — public, no
auth. Validated by `web/src/lib/feedback/validate.ts`
(`validateFeedbackPayload`, unit-tested in
`web/tests/unit/feedback-validate.test.ts`).

### Payload

```json
{
  "lessonId": "lesson_123",
  "lessonName": "Lección 3",
  "slideIndex": 2,
  "slideKind": "sentence",
  "slideText": "Quiero saber algo. / I want to know something.",
  "message": "El botón de continuar no responde en móvil.",
  "who": "Ana",
  "page": "/practice?lesson=lesson_123",
  "userAgent": "Mozilla/5.0 ...",
  "at": "2026-09-17T12:00:00.000Z"
}
```

- `message`: required, 1-2000 characters (trimmed).
- `who`: optional, 80 characters or fewer.
- `lessonId` / `lessonName` / `slideText`: `null` for slides with no lesson
  context (the home footer sends `slideKind: "home"` with all three null).
- `slideIndex`: a number, or `null`.
- `slideKind`: `"explanation" | "sentence" | "completion" | "home"` in
  practice; anything else coerces to `"unknown"` rather than rejecting the
  request.
- `page` / `userAgent` / `at`: best-effort context from the browser; `at`
  defaults to the server's own timestamp if omitted or malformed.

The route rate-limits lightly in memory (10 requests/minute per IP) and
never logs the `message` body to the console, in any environment.

### Two backends

- **`FEEDBACK_WEBHOOK_URL` set**: the validated JSON record is forwarded as
  a `POST` with a 5-second timeout, and the route returns that response's
  status.
- **Unset (default for local dev)**: the record is appended as one JSON
  line to `web/data/feedback.jsonl` (created on first write; gitignored),
  so `npm run dev` still captures feedback without any setup.

## Google Sheet setup (for the owner)

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

`web/src/components/learner/feedback-sheet.tsx` is the one shared
component behind three triggers: the practice footer's "¿Algo que
corregir?" (`web/src/components/practice/lesson-selector.tsx`), the
completion screen's "¿Qué te pareció?" (same file), and the home footer's
"¿Qué te pareció?" (`web/src/components/learner/lesson-dashboard.tsx`).
Styling lives in `web/src/styles/feedback-sheet.css`.
