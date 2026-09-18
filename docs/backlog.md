# Backlog

> Last updated: 2026-09-15. Curriculum migration is complete. PostgreSQL is the canonical curriculum store; Lesson Builder remains JSON-backed. The completed build narrative lives in the [project timeline](history/project-timeline.md).

## Current objective

Ship an MVP to friends: Module 1 authored in the Lesson Builder, a polished learner experience with local-only progress, deployed read-only.

## MVP roadmap (owner, 2026-09-15) — the active sequence

Each step has a gate; nothing below a gate starts until it passes.

1. **Lesson Builder good enough for MVP lessons** — rebuild plan in
   [lesson-builder-rebuild.md](design/lesson-builder-rebuild.md) (Phases 1–2.5 landed;
   3a landed; 3b on a branch awaiting owner review). Open: the autocomplete corruption
   fix (`fix/autocomplete-corruption`), the walkthrough's remaining items, then the
   [module syllabus](design/module-syllabus.md). *Gate:* the owner writes Module 1's
   lessons without reporting a builder bug.
2. **Module 1 content** — authored by the owner; the curation session's Level 1 set
   ([curation/level-1.md](curation/level-1.md)) and the syllabus panel feed it.
   *Gate:* the owner runs the whole module as a learner.
3. **Learner experience polish** — same research→fix loop as the builder, blue theme,
   sans-serif, phone-first (390px) + desktop; bring back the theme-neutral craft bits
   (favicon, app icons, web manifest, loading/empty/error states).
4. **Onboarding without accounts** — first-visit flow; progress in `localStorage`;
   plain-language warning ("your progress lives in this browser; clearing browser
   data erases it"); **export/import progress as a file**; a reset.
5. **Deploy shape + `/admin` guard** — decision: learner app deploys read-only with
   `lessons.json` bundled at build time and no database; the admin stays local-only
   (author → commit → redeploy). Middleware guard on `/admin` and `/api/admin` behind an
   env secret as belt-and-braces. `README` + `.env.example` for the deploy.
6. **Feedback hooks** — a "¿Qué te pareció?" link/form on the completion screen and
   cookie-free page analytics, so step 7 produces signal.
7. **Deploy (Vercel/Netlify) and show friends.**
8. **Decide next** from feedback; only then the "Marie Kondo" pass (refactor, README,
   docs, history) — don't polish what feedback may change.

Deliberate non-goals for the MVP: user accounts, server-side progress, spaced
repetition, a public admin.

## Learner polish and pre-alpha ship (owner, 2026-09-17) — the active sequence

Builder is "good enough"; the pre-alpha ships ONE larger Confianza I lesson. Palette is
purple, tokens only (`web/src/app/globals.css`, CSS lint enforces no literals elsewhere).
Cosmetic work: lint + one screenshot; behaviour: unit + one spec; the full gate only on
the owner's say-so.

- [x] L0 palette · L0b colour on surfaces · L1 home (one message per zone, no plumbing)
- [x] L2a practice frame (one typeface, thin header + progress bar, one card width)
- [x] Speech: browser synthesis + Google clips, USA/UK speakers (`docs/design/speech.md`)
- [x] L2b sentence slide (check beside the sentence, headline prompt, hint outside the field,
      no layout jump) · table slide at reading size · explanation marks loudest
- [x] Explanation voice track (owner 2026-09-17): ONE American voice reads the whole
      explanation, Spanish included ("gringo accent is fine"); an `en` mark may carry a
      pronunciation bridge `[[en:different|DIFF-rent]]` (one field in the mark popover,
      shown small to the learner) and is then spoken as: word normally · pause · each
      hyphen chunk with a pause, capitalised chunk stressed; marks without a bridge are
      read plainly (no automatic syllabification — dictionary syllables ≠ spoken ones);
      auto-plays on slide entry (mute honoured), replay on the card, "listen" in the
      builder; keyed by text like the other clips (`docs/design/speech.md`)
- [x] L2c completion: the sentence you built, "Esto ya lo puedes decir", replay, one action
- [x] L1 leftover: drop the "0 / 2" on the module header
- [x] Per-slide feedback: quiet "¿Algo que corregir?" in the practice footer → small field →
      one serverless function → a Google Sheet row (lesson, slide, slide text, device,
      optional "¿quién eres?"); completion keeps a general "¿Qué te pareció?"
- [ ] L4 craft: favicon/app icon, manifest, loading/empty/error states, focus rings,
      transitions, reduced motion
- [ ] Instruction lines spoken: the narrator (es-US male) reads a sentence/table slide's instruction ("Veamos la diferencia.") on slide open, replay on the line, generated like the other clips (owner 2026-09-17)
- [ ] Audio generation from the builder (Listen generates if missing; module "Generate audio"); manifest fetched fresh (was force-cache → new clips invisible)
- [ ] Marks in small caps (owner chose B 2026-09-17): Geist `font-variant-caps: small-caps`, weight 600 (not 700), +0.05em tracking, on explanation marks, the sentence stage's Spanish line and assembled English, the vocabulary table, and the builder document — screenshot before commit
- [ ] Spelled tokens as keycaps (owner 2026-09-17): a visible `T-H-I-N-G` renders each letter as a keycap (learner renderer + a builder editor decoration), reusing the HUD keycap style; no new font
- [ ] **Matcher bug (found 2026-09-18, blocks the pre-alpha on phones):** `normalizeAnswer` rejects the curly apostrophe (U+2019) that iOS/Android keyboards insert, so "I’m" never matches "I'm". Fold ’ ‘ ʼ ´ ` to ' (and curly double quotes) before comparing; unit tests. Queued behind the onboarding build. **Onboarding lesson 3 must not go live before this.**
- [ ] Open product question (from `product-brief.md`, now concrete): a missing FINAL full stop or a comma is rejected silently (verified 2026-09-18: "hello" ≠ "Hello."). Keep strict and teach it (current, what onboarding does), or forgive terminal punctuation? Owner decision.
- [ ] Onboarding (below)
- [x] Admin guard (env secret on `/admin` + `/api/admin`), deploy shape: static learner site
      with lessons + audio bundled + one feedback function on Vercel; admin local only;
      README + `.env.example`
- [ ] Full gate (with permission) → final polish (2026-09-18) → deploy on **Vercel** (recommended over Netlify 2026-09-17: first-party Next.js 16 support, free tier; docs/engineering/deploy.md already describes it) → friends
- [x] Feedback storage: DECIDED (owner 2026-09-18) — GitHub issues in the PRIVATE repo `IamJamesRooke/InglesConConfianza-feedback` (the project repo is public, so never there). Repo and labels created: `nuevo`, `problema`, `idea`, `elogio`, `sin clasificar`, `pregunta`, `decidido-arreglar`, `decidido-no`. No database, no admin page.
- [ ] Feedback to issues (Sonnet, after the capture piece lands): three chips in the Comentar sheet ("Algo falla" / "Una idea" / "Me gustó"); `/api/feedback` creates an issue with the full context and labels when `FEEDBACK_GITHUB_TOKEN` + `FEEDBACK_GITHUB_REPO` are set; per-visitor limit + trap field; Vercel log as fallback; local jsonl unchanged; leave room for an attach-screenshot button (deferred until a comment cannot be reproduced; images would be committed to `capturas/` in the same repo). Everything arrives OPEN, praise included.
- [ ] Triage routine + `docs/what-works.md` (Codex/Luna, docs only): list open issues, cluster by lesson and slide, propose fix / won't-fix / question, owner decides; praise is closed only after its conclusion is recorded in what-works.
- [x] DONE 2026-09-18 (f6a4591b; owner still to pick the canvas: `?canvas=glow|bare|lavender`, then delete the switch and the two losers): sentence stage beauty pass — one-line sentences get a centred fit-content card on the same axis as explanation cards, wrapping sentences stay left at 720; the active blank becomes a tinted slot with a blue underline and caret, the red underline only with several pieces; hero size for one or two pieces; "Pista" renamed "Recuérdame" and placed beside the speaker's head; kill the grey: purple-ink muted text, lavender hairlines, purple shadows, and three canvas variants (white + glow / white, no card / visible lavender) for the owner to pick from screenshots. Admin canvas unchanged. Owner edits the two "Pista" mentions in onboarding lesson 1 himself.
- [x] DONE 2026-09-18 (f19474aa): Explanation images (SVG/PNG paste, one per slide, below the text, `[[img: file | alt]]`) + `npm run assets:prune` (dry run by default) — in progress 2026-09-18. Deferred: inline Excalidraw editor, video. Tests must never call the real TTS service.
- [x] DONE 2026-09-18 (59251d59): Recuérdame marks where the mistake was, against the closest accepted alternative.
- [x] DONE 2026-09-18: READY TO DEPLOY — course + audio published to git (eae3e171), site builds and serves with no DATABASE_URL (fc7fcdb3, verified by building the pushed commit in a clean copy), stage fixes + final lavender canvas (e6cfa0a3). Owner's remaining step: import the repo on Vercel, Root Directory `web`, env `ADMIN_SECRET`, `FEEDBACK_GITHUB_TOKEN`, `FEEDBACK_GITHUB_REPO`, never a database; then one test comment from a phone.
- [ ] After pre-alpha, first job (owner asked 2026-09-18): edit from the public admin without git — builder "Publicar" button commits course, audio and images through the GitHub API and Vercel rebuilds; needs a stronger admin login and the TTS key on Vercel. Until then: reach the local builder over Tailscale and ask the coordinator to "publish the course". Hosted storage only when several people edit.
- [x] DONE 2026-09-18 evening (owner away): full new-visitor rehearsal at phone size; gate is a real 307 (5cb85eae); answer slot no longer inherits the input's 20-character default; onboarding third draft for a Colombian beginner with four diagrams, published (4e82a351, 200e5393); captured names capitalise each word; listen button no longer covers content; pushed HEAD built and smoke-tested with no database (307 → /bienvenida, diagrams served). Finding: three slides the owner pasted on the 18th were stored truncated — verified NOT the builder (paste, autosave and the rich editor are lossless; regression test added); it was the terminal copy. Lesson: never hand the owner long scripts through the terminal; put them in the course directly or in a file.
- [ ] Small: swap the dark UK portrait for one facing the learner; owner's own photo on the first onboarding slide (his to add); a slide-by-slide 1440 walk of the course lessons has not been eyeballed by a person; full `ux:check` not run since the 17th (needs the owner's word); three cosmetic orphan words at 390 in onboarding wording ("punto.", "that,")."
- [ ] Persona test agents (owner idea, 2026-09-18): create customer-avatar agents with different personality types (e.g. the impatient low-intermediate, the anxious true beginner on an old Android, the sceptic burned by academies, the older learner with large text) and have THEM go through the live site and leave comments through Comentar, so they arrive as issues and go through the normal triage. Needs: the public URL, a label such as `persona` so they never mix with real learners' feedback, and a cap per run. After the first real friends' round.
- [ ] Owner's manual (`docs/owner-manual.md`): owner said not yet (2026-09-18) — too much still moving. A Codex draft was written and discarded; regenerate on Codex when the routines settle (edit → publish → Vercel, rollback, triage, housekeeping, key rotation).
- [x] LIVE 2026-09-18: https://ingles-con-confianza.vercel.app — Vercel project `ingles-con-confianza` (team `ingles-con-confianza`, hobby), connected to GitHub, Root Directory `web`, builds on every push to master (first build 7b6d562, 55 s). Verified live: `/` → 307 `/bienvenida`, onboarding content, home, practice, diagrams, audio, security headers; `/admin` and `/api/admin` → 404. Only env var set: `FEEDBACK_GITHUB_REPO`. NOT set on purpose: `DATABASE_URL` (never), `GOOGLE_TTS_API_KEY`.
- [ ] Before telling friends (owner's steps, in Vercel → Settings → Environment Variables, then redeploy): add `FEEDBACK_GITHUB_TOKEN` (sensitive; from his password manager) so comments become issues — until then they only reach the Vercel log; decide on `ADMIN_SECRET` (left out by the coordinator: public admin cannot save anything, 404 is the closed position). Then one test comment of each kind from a phone + first triage.
- [ ] NEVER deploy with `vercel deploy` from the local `web/` folder: on 2026-09-18 the CLI tried to upload 486 MB from a ~5 MB project despite `web/.gitignore`, i.e. what it would send is not predictable, and that folder holds `.env` (Google key, database address). Both attempts aborted before anything reached Vercel. Deploy only through GitHub pushes. Also: `vercel link` silently writes a `VERCEL_OIDC_TOKEN` into `web/.env.local` (deleted; git-ignored) — delete it again if the project is ever re-linked.
- [ ] Walkthrough batch (owner's list, one session): neutral wording for the Comentar heading now that "Me gustó" exists; one-piece card is ~235px wide, wants min ~360 (landscape, calmer); pending-blank hairline that wraps sits too far below the English line; in the reminder bubble the min-width on a marked LETTER opens a gap ("hel l o") — min-width only for spaces/punctuation — and the bubble text is small on phones; delete the canvas switch once the owner picks. Open idea (owner to decide after the walkthrough): show the same marking unprompted when an answer is nearly right, e.g. only the full stop missing.
- [ ] Before friends: owner pastes the fine-grained token (created 2026-09-18, in his password manager) into Vercel himself; rehearsal = one comment of each kind from a phone, then a first triage.
- [x] Admin consistency pass (shared card/button recipes, tokens) · README · design research + direction + mockups (`docs/design/learner-direction.md`)

### Onboarding (thinking only, 2026-09-17 — not started)

> **Mechanism proposal (2026-09-18): `docs/design/onboarding.md`** — onboarding as a module of `kind: "onboarding"` authored in the builder, a first-visit gate at `/bienvenida`, and new capabilities added as options on existing slides (acknowledge, media) plus one new capture slide with a `{name}` variable. Awaiting four owner decisions; nothing built. The notes below remain the source for *content*.

A module of kind `onboarding` before Confianza I, run once, all learner text in Spanish (tú).

1. **"Antes de empezar"** — a *notice* slide: pre-alpha; progress lives only in this
   browser and clearing browser data erases it; an "Entiendo" checkbox gates Continue
   (stored on device); "tu opinión importa" pointing at the per-slide comment button.
2. **"Hola, mi nombre es…"** — a *name-capture* slide ("¿Cómo te llamas?", stored on
   device as `icc.learner.name`), then "Hola, mi nombre es [name]" → "Hello, my name is
   [name]" with the name as a given piece from that variable; `{name}` usable in any
   later piece.
3. **"Así escribimos"** — how typing works here: capital at the start, full stop at the
   end, apostrophes ("I'm"), accents don't matter in prompts, hints/help never punished.
   Taught by doing: two or three tiny sentence slides that need punctuation + one
   explanation; an image only if doing isn't enough.
4. **"Tu primera frase"** — a two-minute real lesson so onboarding ends with a win.

Owner's additional thoughts (2026-09-17, to be planned together before execution):
- **Open with a promise, not a warning.** The first screen should excite: this course
  comes from 14+ years of doing one thing — taking students from zero to conversational —
  and within an hour they will produce things students with years of classes still get
  wrong (e.g. *I want you to come here*, where learners say *I want that you come here*).
  The pre-alpha/localStorage notice comes after the promise, not before it.
- **Best with a keyboard.** Say so plainly (a phone works, but a laptop or a phone with a
  keyboard makes the typing rhythm feel like a conversation).
- **Say the answers out loud.** Explain why speaking each answer as you type it matters
  for pronunciation and recall; voice recognition may come later.
- **Follow the order even if it feels easy.** Explain that lessons are hand-curated and
  each assumes mastery of what came before; experienced learners should still go in
  order — the early lessons plant patterns later lessons build on.

Builder work implied: slide types *notice* (heading, body, optional image, optional
acknowledgement) and *name capture*; a `{name}` variable token in pieces (learner
substitutes, builder shows a chip); optional image on notice/explanation slides with
files kept in the repo; one script-mode line per new type. Feedback consolidation = the
Google Sheet above.

## Milestone: Pre-curation readiness

- [x] Retire obsolete migration and prototype surfaces, remove unused assets and loaders, align product documentation and metadata, preserve guarded concept inserts, and prepare exact role filtering for database curation.
- [x] Reslug `curriculum_concepts.id` from human-readable slugs to opaque nanoids, updating dependent `review_candidates` references and logging the old-to-new mapping.

## Phase 1: Curriculum curation

- [ ] Establish a database baseline: counts by role and collection, duplicate candidates, malformed-record patterns, and oversized or inconsistent collection families.
- [ ] Remove obvious garbage, accidental sentence records, unusable fragments, and concepts with no teaching or retrieval value.
- [ ] Normalize retained concepts consistently: infinitives, noun articles, adjective support verbs, placeholders, transformations, phrasal roots and particles, and bilingual examples. Do this before deduplication so near-duplicates that only differ by formatting (bracket conventions, accents, capitalization) actually surface as matches.
- [ ] Merge true duplicates while preserving the strongest normalized concept, examples, useful collections, and provenance.
- [ ] Consolidate collections into a predictable taxonomy for grammar, constructions, semantics, cognates, transformations, morphology, and pronunciation.
- [ ] Gut the `core` tier using the functional-necessity test; keep `supporting` selective and demote valid secondary material to `reference`.
- [ ] Complete the pronunciation-family review for concepts still marked `sound metadata pending review` when it affects the first modules or high-priority retrieval.
- [ ] Export immutable snapshots and pass database regression and parity checks after every approved curation batch.

### Curation completion gate

Begin Module 1 when obvious structural problems are gone, role definitions are being applied consistently, and the concepts needed for the module are trustworthy. Full catalog perfection is not a prerequisite; later lessons should drive further curation.

## Phase 2: Module 1

Author lessons by hand in the document-based Lesson Builder and improve the workflow from observed friction. Do not require the live course to preserve the retired presentation fixture's lesson count, names, or module shape.

### Archived presentation scaffold

These completed steps record the scaffold that validated the learner shell. Its fixed 17-lesson content was retired on September 8 when deliberate hand authoring began.

- [x] Create a real three-lesson onboarding sequence that teaches the Practice interaction through a first conversation.
- [x] Complete a 17-lesson presentation course spanning onboarding, Fundamentals I, full infinitives, and everyday plans.
- [x] Improve Lesson Builder ergonomics discovered during authoring: teaching-pair insertion, whole-lesson duplication, module placement, and visible step counts.
- [x] Add structural tests that prevent empty lessons, blank answers, duplicate IDs, or accidental loss of the onboarding sequence.

This scaffold is demo content, not a claim that Module 1 has passed learner validation. The production completion gate below remains active.

### Student experience presentation pass

- [x] Redesign the course home, module selection, answer fields, and lesson completion around the student journey.
- [x] Add local step resume, sentence-based lesson previews, and completion summaries using the final practiced English.
- [x] Keep admin previews separate from local student progress; cover progress and public route boundaries with regression tests.
- [ ] Complete desktop/mobile browser screenshots and the interactive learner walkthrough. The in-app browser was unavailable during implementation; see [the design and verification log](design/student-experience.md).

### Learner validation

- [ ] Define one concrete learner promise for the module and the final confidence-building sentence or interaction that proves it.
- [ ] Select only the Core and Supporting concepts required to fulfill that promise; use Reference concepts sparingly for context.
- [ ] Sequence short lessons using first-attempt answerability, one teaching focus at a time, immediate retrieval, cumulative reuse, and frequent confidence milestones.
- [ ] Include pronunciation bridges wherever English spelling would predictably mislead a Spanish-speaking learner.
- [ ] Author the module in Lesson Builder and test every prompt, accepted answer, hint, transition, and cumulative sentence in Practice.
- [ ] Record any missing, malformed, or poorly classified curriculum concepts revealed by authoring and curate them in PostgreSQL.
- [ ] Run the complete module as a learner and revise pacing, clarity, and lesson boundaries before expanding the course.

## Later

- [ ] ElevenLabs voices (owner 2026-09-17: keep Google TTS for now; revisit if voice quality is the weak point) — swap `synthesize()`/`synthesizeSsml()` in `web/src/lib/audio/generate-clips.ts`, segment-per-voice + concatenation for two-voice explanations; costs in `docs/design/audio-provider-costs.md`

- [ ] Derive the minimum stable lesson, question, concept-reference, and learner-history contracts from the completed module.
- [ ] Add persistent learner accounts, progress, spaced repetition, authentication, and authorization only after the first module proves the learning flow.
- [ ] Create an initial threat model when persistent authoring, authentication, or learner data introduces meaningful trust boundaries.

## Deliberate non-goals

- Re-importing retired curriculum folders or rebuilding the migration pipeline.
- Perfecting all curriculum classifications before authoring Module 1.
- Encoding course sequence or learner mastery inside the immutable source archive.
- Expanding beyond Spanish-speaking adults learning English before the first learning experience has evidence behind it.

## Curriculum gaps noticed while authoring (batch into one curation pass)

- 2026-09-18 — no row for **hola → hello** and none for **[el] nombre → name**. Found while drafting the onboarding (`docs/design/onboarding-content.md`), which carries both as unlinked Covers labels until they exist. Greetings may belong in the social-expressions vocabulary band rather than Level 1 — the owner's call.

- 2026-09-15 — no bare concept for **con / with** (only phrasal entries: "trabajar con [alguien]", "traer [algo] consigo"…). Owner hit it tagging "I want to do something with you."
- 2026-09-16 — no double object pronoun rows (**me lo / te lo / se lo / nos lo → it to me / you / him / us**). Owner hit it authoring Confianza I. Routed to the infinitive-normalization curation session.
- 2026-09-16 — conjugated rows surface instead of infinitives (`estoy [haciendo algo]`); the infinitive normalization pass (`docs/curation/infinitive-normalization-kickoff-prompt.md`) is running.
- 2026-09-16 — likely duplicates, left for a curation pass: `zqul6ydgwq` había [algo singular] → there was / `ok7p2o1dce` había [cosas plurales] → there were repeat `89ut7cha5j` / `4w8zmnbknt` haber [algo] (pasado singular/plural). Noticed during the infinitive pass.
