# Student experience: September 4, 2026

## Direction

The public course is a place to begin and continue real conversations. A bright,
quiet layout uses charcoal type, white surfaces, coral accents, green completion
states, and a locally stored illustration inspired by a conversation in Bogota.
The lesson content, including the James onboarding sequence, is unchanged.

## Student journey

- `/` offers the latest unfinished lesson, module selection, Spanish previews of
  final practiced sentences, approximate durations, and completed lessons.
- Module selection is reflected in `?module=...`. Exiting practice returns to the
  lesson's module. The module tabs support arrows, Home, End, and Tab.
- `/practice?lesson=...` resumes an unfinished lesson at its saved block. It keeps
  a compact header and footer around an independently scrolling teaching area.
- Answers retain immediate recognition, movement to the next answer field,
  temporary hints, authored feedback, and learner-controlled step advancement.
- Completion displays the final practiced English sentence and its Spanish
  source, offers the next lesson, and allows replay. A module-complete message
  requires all available lessons in that module to have been completed.
- Completed lessons reopen from the beginning for review. In-progress text within
  an answer field is not persisted; unfinished lessons resume at the current step.
- Empty courses, unavailable lessons, loading, and read failures have distinct
  student-facing states. Invalid lesson links return to the course home.

## Boundaries

`icc.lessonProgress.v1` stays compatible with existing local completion records.
It adds an optional stable block ID for resume, validates stored entries, listens
for storage updates, and uses session memory when storage is blocked. No accounts
or learner database were introduced. Clearing browser storage clears persistence.

The shared practice component still powers author previews. Preview sessions do
not navigate away from the builder or write student progress. Admin tools remain
under `/admin` and absent from public navigation; this is navigation separation,
not access control. Curriculum and lesson stores were not changed.

## Verification

- Unit coverage includes legacy/malformed progress, stable-ID resume, next-lesson
  selection, completion preservation, blocked storage, outcome extraction, and
  server-rendered public/empty/unavailable course states.
- HTTP checks cover the home page, onboarding route, illustration, admin builder,
  and the redirect in an invalid lesson response.
- Lint passed; all 55 unit tests passed; the production build passed.
- Browser visual and interaction QA remains pending. The requested in-app browser
  reported `Browser is not available: iab`; discovery returned no connections.
  Approval to use standalone headless Chromium was requested, not assumed.
- Responsive CSS targets desktop, tablet, and 320px-and-up phones; it includes
  dynamic viewport sizing, keyboard resize metadata, wrapping text, horizontally
  scrollable module tabs on phones, focus styling, and reduced motion. These are
  implementation details, not a claim of verified browser behavior.

Remaining checks: screenshots at 1440x900, 768x1024, 390x844, and 320x667; complete
the onboarding by typing; request a hint; test keyboard navigation; reload midway
through a lesson; verify completion after returning home; preview a lesson in the
builder; check console errors, touch/keyboard layout, overflow, and contrast.

## Artwork

Asset: `web/public/images/conversation-bogota.webp` (1600x533, about 113 KB).
Generated using the built-in image-generation tool, then encoded as WebP using
the existing Sharp dependency. The original generated PNG was preserved outside
the repository. No external image host is required at runtime.

Generation prompt:

> Use case: illustration-story. Create a polished editorial bitmap illustration
> for an adult language-learning web app in Bogota, Colombia. Wide panoramic
> composition, 3:1 aspect ratio. A friendly everyday conversation between two
> casually dressed adults at a small outdoor cafe in colorful La Candelaria-inspired
> streets, terracotta tiled roofs, green mountains subtly behind, crisp daylight.
> Contemporary sophisticated gouache/cut-paper illustration, refined shapes and
> fine paper texture, natural adult proportions, expressive but understated.
> Palette: clean pale ice blue background, tomato coral, forest green, cornflower
> blue, white, subtle mustard detail. Scene and people concentrated on the RIGHT
> HALF, left half largely clean pale ice blue open sky/wall negative space for UI
> text that will be added in code. Show people and cafe fully, no extreme crops.
> No text, no lettering, no logos, no speech bubbles, no gradients, no floating
> blobs, no border, no UI mockup. This is a quiet course cover illustration, not a
> children's cartoon.

## 2026-09-17 L0b/L1 — vibrant surfaces, one message per zone

Owner complaint: the home read as grey (grey header, a hairline, grey body) with
no vibrancy despite the purple palette landing in 1ac33c29. Two changes:

**L0b — colour lives on surfaces.** `--canvas-warm` and `--surface-subtle` in
`globals.css` gained enough chroma to read as lavender against white cards
(`--ink-muted` stays ≥4.5:1 on both). The hero is now a saturated
`--brand-primary` → `--brand-primary-vivid` (new token, magenta-purple)
gradient at 135°, white headline/eyebrow, white-90% sub-line
(`--on-hero`/`--on-hero-muted`). The hero's single CTA is a white pill with
`--brand-primary` text (`--cta-on-hero-bg`/`--cta-on-hero-fg`,
`--shadow-cta`/`--shadow-cta-hover`) — never purple-on-purple — and lifts on
hover instead of shifting colour. The promise card inside the hero stays a
plain white card with ink text so the English sentence stays the loudest
thing on the surface. The learner header lost its bottom hairline and is now
a plain white strip over the tinted canvas. "Completed" state (module tabs,
lesson rows) now colors only the check glyph with `--success`; it never fills
a whole row or tab surface.

**L1 — the home shows one message per zone, nothing else.** The hero is
eyebrow ("Empieza aquí" / "Tu próxima lección") + headline ("Habla inglés. Con
confianza." first visit, "Sigamos." returning) + one button + the promise card
("Vas a poder decir" + the next lesson's final English sentence + its Spanish
line). Removed from the home: the "Vas a aprender" concept chips and their
`+N` overflow, the "MÓDULO · LECCIÓN" line, the "· N min" clock line, the "TU
CURSO" eyebrow and the "N de N lecciones completas" counter, "Omitir módulo" /
"Reiniciar módulo" (the underlying progress functions stay; per-lesson
skip/reset stays). The module rail (left-hand list of module tabs) is hidden
entirely when the course has one module. A lesson row is now just: number,
English title, Spanish line, one play/replay affordance, a quiet success
check when done. `concept-pills.tsx` was deleted (unused after the cut,
confirmed with `npm run lint:dead`). Curriculum bracket notation
(`[the] day`, `[el] día`) is stripped to plain words on every learner surface
via `learnerLabel()` in `src/lib/learner/presentation.ts`, applied to the
practice-completion concept list.

## 2026-09-17 L2a — the practice frame (every slide inherits this)

Owner complaint, from desktop screenshots of `/practice`: a second display
font (Baloo 2) on top of Geist, an 80px purple header with a blurred halo,
a boxed close button, the lesson name and a "1 / 14" counter repeated on
every slide, a white progress streak that was hard to see on purple, and a
footer that turned green (surface + button) on a correct answer. Fixes:

**One typeface.** Baloo 2 and `--font-display` are gone — removed from
`layout.tsx` and every `font-family: var(--lesson-display)` /
`var(--font-display)` rule in `learner-foundations-home.css` and
`practice-responsive-overrides.css`. Practice text now takes its size and
weight from the type scale below, on `--font-sans` (Geist) only.

**Thin header.** `.lesson-topbar` is 48px tall (56px at ≥1024px),
`--primary` surface, no border/halo/shadow. The close button is icon-only —
no box, a 40px hit area — and white. No lesson title, no "n / N" counter.
A real `<progress>` bar sits on the header's bottom edge: 4px tall, track
white-25% (`color-mix` on `--primary-foreground`), fill white-100%,
`transition: width 240ms` (killed under `prefers-reduced-motion`, already
global). The lesson name moved out of the header entirely: it now shows
once, as an 11px/0.12em-tracked `--ink-muted` eyebrow (`.practice-lesson-
eyebrow`) above the canvas on the first slide only, and again on the
completion screen — nowhere else.

**Transparent footer, one action.** `.lesson-controls` has no surface or
box-shadow of its own — it's transparent over the canvas at every state,
including success (no more green fill + green button variant). It shows a
quiet back icon on the left and, when one exists, exactly one primary
button on the right ("Vamos a practicar →" / "Continuar →"); with no
available action (an unanswered sentence slide) that button is `display:
none`, so there is never a visible empty bar.

**Success = one purple check.** The old 44px green circle under the card
is gone. `SentencePracticeCard` now renders one small `--primary` check
(`.sentence-success`, 28px) beside the prompt, top-right of the card, on a
white disc with `--shadow-card`. The per-blank check next to each correct
Spanish word (`--primary` fill tint on the field) is unchanged.

**Canvas and one card width.** `.lesson-stage` centers its column at ~20%
top padding rather than dead center (`padding-top: clamp(56px, 20vh,
180px)`), so slides read lighter. Every slide type now shares one column
width (`--practice-column`: 760px desktop, 100% of the stage's own 20px
phone gutter below), replacing the old per-type max-widths (38rem
explanation / 44rem sentence / 30rem single-answer / 42rem vocabulary).
Both the explanation card and the answer-grid card are white, 16px radius,
`--border` hairline, `--shadow-card` (new token in `globals.css`), 32px
padding (20px on phone) — one card style everywhere.

**Type scale**, as CSS custom properties on `.lesson-session` (sizing only,
no colour literals — those still live only in `globals.css`):
`--practice-prompt-size` 28px→22px, `--practice-explanation-size`
20px→18px, `--practice-label-size` 14px (already matched, unchanged),
`--practice-eyebrow-size` 11px, all switching at the file's existing
`max-width: 760px` breakpoint. The explanation body switches from centered
to left-aligned once a paragraph or list item actually wraps to a second
line (`ExplanationStep` measures rendered height vs. line-height with a
`ResizeObserver` and sets `data-wraps` — single-line explanations stay
centered).

Not touched: the sentence card's internal blank/vocabulary-row styling,
hints, and the rest of the completion screen — those are the next
sessions' scope. Verified with `npm run lint` (CSS + ESLint), `npx tsc
--noEmit`, `tests/unit/learner-surfaces.test.ts` (12/12), and a throwaway
Playwright spec (deleted after) screenshotting the first explanation slide
and an answered sentence slide at 1280×900 and 390×844 — no Playwright
suite run beyond that one spec.

## 2026-09-17 L2b — the sentence stage (an assembling sentence, two actors)

A long sentence used to wrap into ragged rows of labelled boxes. It is now
**one sentence being assembled**, for every ordinary sentence slide
(vocabulary tables stay tables). `SentenceStageCard` is the default;
`SentencePracticeCard` — the old grid of fields — is still renderable for
side-by-side comparison via **`/practice?lesson=…&layout=grid`** and is what
vocabulary tables use. Both cards share `useSentencePractice`, so answer
matching (`isAnswerAccepted`, unchanged), hints, Tab/Enter progression and
the speech sequencing are literally the same code in both.

**The card.** Line 1 is the Spanish sentence as prose: the piece being typed
is bold `--lesson-hl-es`, finished pieces settle to regular-weight ink,
pieces still to come are `--ink-muted`, and a `given` piece is plain ink and
never highlighted. Line 2 is the English sentence growing in place: every
tested piece is an inline `<input>` in the text flow — a blank underline
(`1ch` per character of its answer, minimum `3ch`, 2px `--border`) until it
is answered, the finished word in `--primary` after, with `field-sizing:
content` so it grows as the learner types and never moves the line. Because
the blank *is* the input, clicking a blank or a finished word just focuses
it. `given` pieces are plain words from the start, and punctuation stays
attached to its piece ("algo." → "something."). Both lines are
`--practice-prompt-size` at `line-height: 1.6`; the card is 880px at
desktop. The hint lightbulb (20px, `--hint`) sits at the end of the
highlighted Spanish piece — never inside the input.

**No checks.** The whole-sentence success check and the per-piece checks are
gone: a finished word standing in the sentence is the signal, with the
speaker's bubble and Continue behind it.

**The stage.** At ≥1024px the slide is two actors: the speaker on the left
(72px avatar, flag + label under it, bubble pointing right at the card) and
the card on the right, the *group* centred at roughly a third from the top.
On phone the card comes first and the speaker row (48px avatar) sits under
it. There is **no bubble at rest** — it appears with the first words spoken
and then keeps the last thing said. When the sentence is complete the
primary button also appears centred under the composition at desktop; the
footer copy is hidden at that width, so only one is ever visible.

**Explanations.** `--practice-explanation-size` is now
`clamp(20px, 2.4vw, 32px)`, and a single-line explanation takes
`clamp(24px, 3vw, 36px)`. Alignment no longer uses the `ResizeObserver`:
`explanationWraps()` decides from the authored text (more than one block, or
more than ~60 characters), so it is right in the server-rendered HTML,
before fonts load. Two real bugs were behind "it never triggered": the
observer's `measure()` only looked at `p`/`li`, so an explanation whose
wrapping text was a heading stayed centred forever; and even when
`data-wraps="true"` was set, `PracticeMarkdown`'s own `text-center` class on
its wrapper beat the inherited `text-align: left` from the parent — so the
flag worked and nothing moved. The CSS now targets that wrapper too.

**Vocabulary tables** keep their shape but read at `--practice-prompt-size`
in both columns, the hint button moved out of the field into its own grid
column, and focus draws one ring instead of a ring over a recoloured border.

**Avatars** were redrawn at 256×256 (`public/speakers/{us-man,uk-woman}.svg`)
as two clearly different, friendly people — face shape, hair, skin tone and
clothing colour all differ.

Verified with `npm run test:unit` (366/366), `npx eslint` on the touched
files, `npx tsc --noEmit`, `npm run lint`, and `tests/ux/speech.spec.ts`
(2/2, its selectors updated for the inline inputs). Screenshots came from a
throwaway spec, deleted after the run.

## Home v2 (direction build) — September 17, 2026

The home (`/`) was rebuilt from `docs/design/learner-direction.md`'s HOME
section and the owner-approved mockup (artboards 1–2), replacing the
module-rail/tabs dashboard entirely.

**Header** (`site-header.tsx`'s `LearnerHeader`) is now 56px, brand mark +
single-line "Inglés con Confianza" only, no border, no stacked pre/word
lines. The dead `.brand-mark`/`.brand-mark-dot` CSS (an unused leftover, not
the `BrandMark` component) was removed with it.

**Hero card**: 24px radius, purple→magenta gradient, 24px padding phone /
32px desktop, laid out with CSS grid areas (`eyebrow`/`hero`/`subcopy`/
`promise`/`cta`) so the DOM order (needed for the promise card to fall
between subcopy and CTA on phone) differs from the visual order on desktop
(promise card as its own right-hand column) without JS. First visit: eyebrow
"Empieza aquí", hero "Habla inglés. Con confianza.", a static sub-copy line.
Returning: eyebrow "Tu próxima lección", hero is the next lesson's module
name, sub-copy is that module's description or "Sigamos donde lo dejaste."
The promise card is a plain white card (no shadow) with the next lesson's
final English sentence at sentence size and its Spanish beneath, muted. CTA
is a full-width white pill, purple text, 56px tall, "Empezar →" /
"Continuar →".

**Path**: one section titled "Tu recorrido". A single module renders its
lessons flat with no sub-heading, rail, or tabs. Several modules get the
module name as a plain `<h3>` above their own rows (still under the one "Tu
recorrido" title) — `?module=` scrolls to and focuses that module's section
via `id="module-<id>"` instead of driving a tab. Rows are a vertical path (a
2px purple track, 12px nodes: filled = done, ring = next, hairline = later);
the next lesson's row is a white card (16px radius, hairline border,
`--shadow-card`); every other row is plain. No durations, no counters, no
skip, no reset — the per-row "Reiniciar"/"Omitir" controls are gone; reset
is deferred to a future completion-screen task.

**Type scale**: `--t-hero` (36→56), `--t-sentence` (26→34), `--t-section`
(22→28), `--t-body` (19→22), `--t-ui` (16→17), `--t-eyebrow` (11→12) added
to `globals.css` as fluid `clamp()`s between the 390px and 1280px reference
widths, so the lesson session can reuse the same names later.

**Owner tweak verified**: at 390×844 first visit, the first path row
("Lección 1") starts at y≈713px — well above the 844px fold — confirmed via
a throwaway Playwright spec's `boundingBox()` (deleted after the run).

Verified with `npx tsx --test tests/unit/learner-surfaces.test.ts` (19/19,
assertions rewritten for the new markup — no more module tabs/`aria-selected`
to assert on), `npx tsc --noEmit`, `npm run lint` (incl. CSS lint), and
`npm run lint:dead` (clean of the removed classes/components). Screenshots
came from a throwaway spec on an isolated `UX_CHECK_PORT=3215` server,
deleted after the run; `tsconfig.json`'s auto-added UX-check path entries
were reverted.
