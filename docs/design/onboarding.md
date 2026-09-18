# Onboarding — decided 2026-09-18; phase 1 being built

> 2026-09-18. The owner answered the four decisions (see the end). **Governing principle
> (owner): onboarding is part of the CMS — a teacher edits it in the Lesson Builder; no
> learner-facing onboarding text lives in code, and the on/off switch is the module's Draft
> toggle.** Build only what is needed: phase 1 now; phases 2–4 when the owner reaches for them. Supersedes the loose onboarding notes in
> `docs/backlog.md`, which remain the source for *content* ideas (the promise, keyboard,
> say it aloud, follow the order, punctuation, feedback). This document is about the
> *mechanism*.

## What the owner asked for

1. Not hard-coded: authored and edited in the Lesson Builder like any other lesson.
2. Open to new slide kinds (image, YouTube, maybe custom HTML) and to a stored variable
   (name, maybe email) — without building any of it prematurely.
3. Shown the first time someone uses the app, blocking the home page until finished, and
   never shown again.

## The shape in one paragraph

Onboarding is an ordinary module whose `kind` is `"onboarding"` — a field that already
exists on `LessonModule`. Its lessons are ordinary lessons made of ordinary slides, written
with the same keyboard flow, script mode, audio and draft/published controls as the course.
What is new is small and lives on the learner side: a **gate** that sends a first-time
visitor into that module and only lets them out at the end. Every richer capability
(acknowledge, capture a name, show media) is added later as an *option on an existing
slide* wherever that is enough, and as a new slide type only where it is not.

## 1. The gate (learner side)

- **State.** `localStorage icc.onboarding.v1 = { completedAt }` is the truth. On completion
  we also set a cookie `icc_onboarded=1` so the **server** can redirect with no flash of the
  home page. The check lives in the `/` and `/practice` page server components through one
  shared server helper — **not** in `proxy.ts`, which stays admin-only and small. The cookie is only a hint: if it is lost but localStorage says done, the
  welcome route notices, re-sets the cookie and sends the learner home.
- **When the gate is on.** Only when a *published* onboarding module with at least one
  *published* lesson exists. Set that module to Draft in the builder and the gate vanishes.
  That is the kill switch, and it needs no deploy logic of its own.
- **Routing.** A dedicated route, `/bienvenida`, hosts the normal practice component in
  *onboarding mode*. Visiting `/` or `/practice?lesson=…` without having finished
  onboarding redirects there. It resumes at the first unfinished onboarding lesson, so a
  reload mid-way does not restart it.
- **Onboarding mode differs from a normal lesson in these ways only:** no close button and
  Escape does not exit (the one way out is forward; back-a-slide still works); the progress
  bar spans the WHOLE onboarding, not one lesson, so the end is always visible; the
  "Comentar" pill stays available; finishing lesson N opens lesson N+1 directly, with no
  completion screen in between; finishing the last lesson records completion and lands on
  the home in its first-visit state ("Empieza aquí").
- **Afterwards.** The onboarding module never appears on the learner's path, and learner-facing
  lesson numbers do not count it (the first course lesson is "Lección 1"). A quiet footer link,
  "Ver la introducción otra vez", opens `/bienvenida` in **replay mode**: close button present,
  no flags changed. "Reiniciar todo
  el progreso" also clears onboarding, and says so, because testers will want to replay it.
- **Honest limit.** With no accounts this is a UX gate, not access control. Someone who
  clears their browser sees onboarding again; someone determined can skip it. That is fine.

## 2. Authoring (builder side)

- **One fixed Onboarding slot, pinned first in the navigator** (owner: "a mandatory module
  that stays as the first module"). No kind toggle on ordinary modules. If no onboarding
  module exists the slot shows "Add onboarding". It cannot be dragged, nothing can be dropped
  above it, and the file is normalised on load so there is at most one and it is always first.
  Its header shows Published/Draft (the kill switch) with one helper line, and hides
  Free/Premium (onboarding is always free).
- Preview from the builder runs in onboarding mode without touching learner state (previews
  already never write progress).
- Onboarding lessons stay in the course timeline. "Hello, my name is…" is real language, so
  its Covers count as *introduced* for everything after it.
- Type-predicted insertion never predicts the new slide kinds below; they are explicit.

## 3. New capabilities — smallest thing that works, in the order they earn their place

| need (from the backlog notes) | proposal | new slide type? |
|---|---|---|
| Pre-alpha / localStorage warning with "Entiendo" | `acknowledge?: { label }` **option on an explanation slide**: a checkbox; Continue stays disabled until ticked; remembered per slide on the device | no |
| "Hola, mi nombre es …" | a **capture slide**: Spanish prompt, one field, a storage key (`name`), text or email input, required or not. Stored in `localStorage icc.learner.v1` | **yes** — it is a different interaction from translating |
| Use the name later | a `{name}` token usable in explanation text and in sentence pieces, substituted on the learner side, shown as a chip in the builder. `{name|amigo}` gives a fallback when empty | no |
| A picture or an intro video | `media?: { kind: "image" \| "youtube", … }` **option on an explanation slide**. Images are committed under `web/public/lesson-media/` like the audio. YouTube stores only the video id and loads on click from the no-cookie domain, so no third party is contacted until the learner presses play | no |
| "Customizable HTML" | **recommend against** — see below | — |

Knock-on effects that must be handled when each lands, listed so they are not discovered
late: the captured name should prefill the feedback sheet's "¿Quién eres?"; a sentence
piece containing `{name}` is matched against the stored name, case-insensitively; the audio
generator must **skip** any text containing a variable (a pre-generated clip cannot say the
learner's name — those lines fall back to the browser voice or stay silent); script mode
gets one line per new option.

### Why not a raw-HTML slide

It would be rendered unescaped from `lessons.json`, which is an injection risk the moment
anyone but the owner authors a lesson; it sidesteps the design tokens, so it is the one
slide that will not look like the rest; the narrator has nothing defined to read; and script
mode cannot round-trip it. Typed options (acknowledge, capture, media) cover every case in
the backlog notes. If a true escape hatch is ever needed, the safe form is a sandboxed
frame — later, and only with a concrete need.

## 4. Name, email, and where data lives

There is no server-side store and no accounts. "Stored somewhere" therefore means *on the
learner's device*, which is perfect for a **name** (personalisation, nothing leaves the
browser, no privacy question).

An **email** is different. Stored locally it is useless — the owner can never read it. To
be useful it has to be sent to a server, which (a) depends on the parked feedback-storage
decision, and (b) is personal data: it needs an explicit opt-in sentence and a privacy note,
and it would be the first personal data the app collects. Recommendation: **name only for
the pre-alpha.** The friends receiving the link are people the owner can already reach.

## 5. Phasing and model routing

Each phase ships alone and is useful alone. Nothing later is built until it is needed.

1. **Gate + onboarding module kind**, using only today's slide types. Already enough to
   write the promise, keyboard, say-it-aloud, follow-the-order, punctuation and feedback
   lessons. *Sonnet; behaviour lane (unit tests + one spec).* Escalate to Opus only if the
   no-flash server redirect fights Next.js 16's proxy.
2. **Acknowledge option** on explanation slides. *Sonnet.*
3. **Capture slide + `{name}` variable** + feedback-name prefill + generator skip. This is
   the judgement-heavy seam (markdown dialect, editor schema, answer matching, audio).
   *Opus.*
4. **Media option** — image first, YouTube second — only once there is an actual image or
   video to show. *Sonnet.*

## Decisions (owner, 2026-09-18)

1. **Name only for now**; email may be needed later. The capture slide (phase 3) stores values
   under a named key, so an email field later is content, not a rebuild. It still waits on
   the feedback-storage decision and an opt-in line.
2. **No raw-HTML slide.** "Don't create features until we need them." The point is that
   onboarding is CMS content a teacher edits without touching code.
3. **No close button**, best practice at the coordinator's judgement: whole-onboarding progress
   bar, resumable, back-a-slide works, Escape does not exit, feedback stays available.
4. **See it again**: yes, without clearing cookies — the footer replay link.

Everyone sees onboarding once, including browsers that already have course progress.

## Built — phase 1 (2026-09-18)

Everything in §1/§2 above with today's slide types (no acknowledge, no
capture slide, no `{name}`, no media — those stay phases 2–4, not built).

**Data model / normalisation**
- `enforceOnboardingSlot` (`web/src/lib/lesson-builder/lesson-file.ts`): at
  most one `kind: "onboarding"` module, always `modules[0]`; a later
  duplicate is demoted to an ordinary module (never dropped). Wired into
  both `parseLessonFile` (every read) and `reconcileLessonFile` (every
  write/import), which also re-flattens `lessons` to match so the
  ordering invariant survives a module reorder. Round-trips `kind` through
  import/export unchanged (that path already reused `isLessonModule`).
  Tests: `web/tests/unit/course.test.ts`.

**Gate**
- `onboardingGate` (`web/src/lib/learner/onboarding-gate.ts`): pure
  `{ hasPublishedOnboarding, onboardedCookie } → "welcome" | "pass"`.
- `hasPublishedOnboarding`/`findOnboardingModule`
  (`web/src/lib/lesson-builder/course-summary-core.ts`): a published
  module of kind onboarding with ≥1 published, non-empty lesson.
  `summarizeCourse`'s learner-facing `lessonNumber` now skips onboarding
  lessons entirely (they get `0`; nothing displays it) so the first
  ordinary course lesson is always "Lección 1".
- `redirectToOnboardingIfNeeded` (`web/src/lib/learner/onboarding-gate-server.ts`,
  `"server-only"`): reads `cookies()` + the raw lesson file and calls
  `redirect("/bienvenida")`. Called from `src/app/page.tsx` and
  `src/app/practice/page.tsx` — never from `src/proxy.ts`.
- Learner state (`web/src/lib/learner/onboarding.ts`): localStorage
  `icc.onboarding.v1 = { completedAt }` is the truth; `completeOnboarding()`
  also sets `icc_onboarded=1` (path=/, max-age 1y, SameSite=Lax, Secure over
  https). `resetOnboarding()` clears both (wired into "Reiniciar todo el
  progreso"). `reconcileOnboardedCookie()` re-sets a lost cookie without
  touching the completion timestamp.

**`/practice`**
- A direct `/practice?lesson=<onboarding lesson id>` never opens inline —
  it redirects to `/bienvenida` (not yet onboarded) or `/bienvenida?repasar=1`
  (already onboarded).

**`/bienvenida`** (`web/src/app/bienvenida/page.tsx`)
- Server component: builds the ordered, published onboarding lesson list
  from `readCourseSummary()`; redirects to `/` if none exists;
  `?repasar=1` is replay mode.
- Hosts `LessonSelector`/`LessonSession` (`web/src/components/practice/lesson-selector.tsx`)
  in onboarding mode via a new `onboarding?: { replay }` prop — the same
  component the course uses, not a fork. Onboarding-only behaviour:
  - `lessons` passed in IS the whole onboarding module, in order — chaining
    lesson N → N+1 and the whole-course progress bar are both derived from
    it directly (`onboardingIndex`/`onboardingIsLast`/`onboardingNextLessonId`/
    `onboardingTotalSlides`/`onboardingSlidesBefore`).
  - `advance()` on a lesson's last slide skips ever setting `complete` —
    it calls `onAdvanceLesson(nextId)` (remounts `LessonSession` via
    `key={lesson.id}`) or, on the last lesson, `onFinishAll()`
    (`completeOnboarding()` unless replay, then `router.replace("/")`).
    No completion screen ever renders between or after onboarding lessons.
  - No close button unless replay; Escape is a no-op unless replay (the
    keydown handler returns before `close()`).
  - The advance button's last-slide label is onboarding-aware
    (`lesson-selector.tsx`'s `advanceButton`): "Continuar" on the last slide
    of a lesson that isn't the last onboarding lesson (lessons chain with no
    completion screen, so "Terminar lección" would be wrong there);
    "Empezar el curso" on the last slide of the last onboarding lesson, or
    "Volver al inicio" in replay mode. Outside onboarding, unchanged.
  - The reconcile rule (localStorage says done, cookie lost) lives in
    `LessonSelector`'s lazy `useState` initializer (computes the resume
    lesson id, `null` when window is undefined during SSR) plus one
    `useEffect` that does the actual `reconcileOnboardedCookie()` +
    `router.replace("/")` side effect — split that way to avoid a
    setState-in-effect lint error while still working under SSR.

**Home** (`web/src/app/page.tsx`, `web/src/components/learner/lesson-dashboard.tsx`)
- The onboarding module is filtered out before `LessonDashboard` ever sees
  it, so the path/hero/promise/`nextLessonToStudy` all ignore it for free;
  the dead `"Primeros pasos"` label was removed.
- `hasPublishedOnboarding` (derived from the already-fetched `CourseSummary`,
  no second file read) drives the footer's replay link.

**Footer** (`web/src/components/site-footer.tsx`)
- `showOnboardingReplay` prop renders "Ver la introducción otra vez" →
  `/bienvenida?repasar=1`. "Reiniciar todo el progreso"'s confirm text is
  now "¿Seguro? Reiniciar todo, incluida la introducción" and its handler
  also calls `resetOnboarding()`.

**Builder** (`web/src/components/lesson-builder/module-navigator.tsx`,
`use-course-modules.ts`, `lesson-library.tsx`)
- The navigator renders the onboarding module (when `modules[0].kind ===
  "onboarding"`) as a pinned, non-draggable row with an "Onboarding"
  eyebrow above the ordinary module list, or a quiet "+ Add onboarding"
  button when none exists (`addOnboardingModule`: creates
  `{ kind: "onboarding", name: "Onboarding", status: "draft" }` at index 0).
  `moveModule`/`reorderModule` both refuse to move it or drop anything
  above it. Its module header hides Free/Premium and adds one helper line
  ("Shown once to every new learner before the course. Draft turns it
  off."); Published/Draft, lessons, syllabus, and delete all work as for
  any module.
- Deleting it uses the ordinary "Delete module" control — no special path.

**Tests**: `web/tests/unit/onboarding-gate.test.ts`,
`web/tests/unit/onboarding.test.ts`, additions to `course.test.ts` and
`course-summary.test.ts`, and `web/tests/ux/onboarding.spec.ts` (cases a–g
from the spec above).

**Not built** (phase 1 scope, deliberately): the acknowledge option, the
capture slide + `{name}` variable, and the media option — all phases 2–4,
built only when the owner reaches for them (§3/§5 above are unchanged).
