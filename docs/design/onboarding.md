# Onboarding — PROPOSAL (not agreed, nothing built)

> 2026-09-18. Written for the owner to react to. Nothing here is decided until the
> "Decisions" section is answered. Supersedes the loose onboarding notes in
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
  home page. The cookie is only a hint: if it is lost but localStorage says done, the
  welcome route notices, re-sets the cookie and sends the learner home.
- **When the gate is on.** Only when a *published* onboarding module with at least one
  *published* lesson exists. Set that module to Draft in the builder and the gate vanishes.
  That is the kill switch, and it needs no deploy logic of its own.
- **Routing.** A dedicated route, `/bienvenida`, hosts the normal practice component in
  *onboarding mode*. Visiting `/` or `/practice?lesson=…` without having finished
  onboarding redirects there. It resumes at the first unfinished onboarding lesson, so a
  reload mid-way does not restart it.
- **Onboarding mode differs from a normal lesson in three ways only:** no close button (the
  one way out is forward); finishing lesson N opens lesson N+1 directly, with no
  completion screen in between; finishing the last lesson records completion and lands on
  the home in its first-visit state ("Empieza aquí").
- **Afterwards.** The onboarding module never appears on the learner's path. "Reiniciar todo
  el progreso" also clears onboarding, and says so, because testers will want to replay it.
- **Honest limit.** With no accounts this is a UX gate, not access control. Someone who
  clears their browser sees onboarding again; someone determined can skip it. That is fine.

## 2. Authoring (builder side)

- Module header gets a kind toggle next to Published / Free: **Course / Onboarding**. At
  most one onboarding module; it is pinned first in the navigator and labelled.
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

## Decisions needed from the owner

1. **Email:** name only (recommended), or collect email too — accepting that it waits on the
   feedback-storage decision and needs an opt-in line?
2. **Raw-HTML slide:** agree to leave it out (recommended)?
3. **Leaving mid-way:** no close button during onboarding, progress saved so a reload
   resumes (recommended) — or allow closing?
4. **After it is done:** gone from the path, with a quiet "Ver la introducción otra vez" in
   the footer (recommended) — or gone entirely?

Assumption unless told otherwise: everyone sees onboarding once, including browsers that
already have course progress (today that is only the owner's).
