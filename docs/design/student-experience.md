# Student experience: September 4, 2026

## Current state (2026-09-17)

This file is a dated history of the learner experience's evolution; sections below
are kept for record but many are superseded. For the current, authoritative
visual/behavioural spec, read `docs/design/learner-direction.md` first. As of
today: purple token palette (no coral/charcoal), no dark theme, a shared dark
`SiteFooter` (learner variant carries "Reiniciar todo el progreso"; admin variant
carries section links), per-row "Reiniciar" on the home path, a floating
"Comentar" feedback pill, and the lesson player redesign (ink+underline
highlights, one neutral sentence-piece card). Treat any conflict between this
file and `learner-direction.md` in `learner-direction.md`'s favor.

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
the speech sequencing are literally the same code in both. (2026-09-18:
`normalizeAnswer` also folds curly/phone-keyboard apostrophes and quotes to
their straight forms before comparing, so a typed "I’m" (curly, from an
iOS/Android keyboard) matches a stored "I'm" and vice versa — see
`web/src/lib/lesson-builder/utils.ts`.)

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

## 2026-09-17 — Lesson v2 (direction build)

Brought the LESSON screen (explanation, sentence, vocabulary-table slides)
to `docs/design/learner-direction.md` and the owner-approved mockup
artboards 3/4/6. Mostly alignment on top of L2a/L2b, not a rewrite:

**One card recipe.** `.lesson-explanation`, `.answer-grid` (sentence and
vocabulary table) and `.stage-card` now share the same padding rule — 32px
desktop, 24px phone (added at the file's existing 760px breakpoint) — on
top of the white/16px-radius/hairline-border/`--shadow-card` they already
shared. The vocabulary table's own tighter padding override is gone; its
rows keep their own internal spacing/hairlines.

**Stage column, one rule.** `--practice-column` is 760px (was 880px),
matching the direction's "max 760 desktop" instead of the L2a-era width. The
per-type `.stage-layout .lesson-stage` override (a second, diverging
top-offset/gutter rule only sentence slides got) is deleted; `.lesson-stage`
alone now positions every slide type at `clamp(64px, 30vh, 220px)` from the
top with a 20px gutter at any width, so there is exactly one "where does the
stage sit" rule, not two. The `stage-layout` CSS class and the `layout`
prop that toggled it (`LessonSelector`/`LessonSession`) are gone.

**`?layout=grid` removed.** The query param that let `/practice` render the
older grid-of-fields sentence card for ordinary sentences is gone from
`practice/page.tsx`; `LessonSelector` no longer takes a `layout` prop.
`SentencePracticeCard` (the grid card) still renders — it's what vocabulary
tables use — just no longer reachable for an ordinary sentence slide.
`npm run lint:dead` stayed clean (nothing new to remove: the component's
non-vocabulary branches are unreachable in production now, but the class
names/strings they still reference aren't tracked by knip).

**Type scale converged, not redefined.** `--t-hero`/`--t-sentence`/
`--t-section`/`--t-body`/`--t-ui`/`--t-eyebrow` already existed in
`globals.css` (added by the concurrent learner-home session, this file's
"Type scale" section above) by the time this task's CSS edits landed, so
`practice-base.css` consumes them instead of defining its own — the
`--practice-*` sizing tokens on `.lesson-session` now alias them
(`--practice-prompt-size: var(--t-sentence)`, `--practice-explanation-size:
var(--t-body)`, a single-line explanation's `--practice-explanation-single-
size: var(--t-sentence)`, `--practice-label-size`/`--practice-eyebrow-size:
var(--t-ui)`/`var(--t-eyebrow)`), replacing several fixed-px values (28px
prompt size, 14px label size, a 20–32px explanation clamp) and one phone
override (`--practice-prompt-size: 22px` at ≤760px) that would otherwise
have fought the fluid scale.

**Marks fixed to the direction's colours.** An English `[[en:…]]` mark was
rendering in `--primary` (purple); the direction calls for Union Jack blue,
so `.learner-theme mark.english` / `[data-language="en"]` now use
`--lesson-hl-en` (already the token used everywhere else — lesson builder,
authoring — for the same purpose). Spanish marks were already correct
(`--lesson-hl-es`, bold).

**Sentence stage line-height** dropped from 1.6 to 1.35 (`.stage-line`,
`.stage-en`) to match the direction's sentence-size spec.

**The action.** The one primary button (footer + `.stage-continue`) is now
56px tall / 8px radius / `--t-ui` weight 600 text, replacing a 58px/
`--radius-lg` (~16px)/20px-weight-700 button that came from the lesson
builder's own button scale. Phone gets the footer thumb zone: the button is
full width minus the 20px gutters and the quiet back icon moves out of the
row to sit absolutely at the footer's bottom-left, instead of both sharing a
three-column grid that shrank the button to ~160px.

**Motion**, all newly scoped inside `.lesson-session` so the learner home's
own animations (420ms `.learner-enter`, defined in `globals.css`) are
untouched: slide change is a 240ms/8px-rise cross-fade
(`@keyframes lesson-slide-enter`, applied via `.lesson-session
.learner-enter`); the primary button fades/rises 4px over 200ms whenever it
appears (`@keyframes button-appear`, on `.lesson-session .learner-button.
primary` — covers both the footer's `display:none → flex` toggle and
`.stage-continue`'s mount); a finished English word settles from a tinted
background to plain text over 150ms (`@keyframes stage-word-settle`, on
`.stage-en-done` — there was already no check glyph to replace, L2b removed
those). `prefers-reduced-motion` no longer hard-disables animation/
transition (`none !important`) — direction asks for "opacity only, 1ms", so
durations collapse to 1ms instead, keeping the fade but removing the
perceptible motion.

Verified with `npm run test:unit` (371/371), `npx eslint` on the touched
files, `npx tsc --noEmit`, `npm run lint` (incl. CSS lint), `npm run
lint:dead` (no new findings), and `tests/ux/speech.spec.ts` (2/2, no
selector changes needed). Screenshots came from a throwaway spec (deleted
after) on `UX_CHECK_PORT=3216`: `/tmp/claude-1000/explanation-v2-390.png`,
`/tmp/claude-1000/lesson-v2-390.png` (half-answered), `/tmp/claude-1000/
lesson-v2-1280.png` (complete, desktop two-actor composition). `tsconfig.
json`'s auto-added UX-check path entries were reverted after each run.

Not touched: `practice-completion.css`, the completion branch of
`LessonSession`, and everything under `src/components/learner/` — out of
this task's scope by instruction.

## 2026-09-17 — Completion v2 (direction build)

Brought the COMPLETION screen (`LessonSession`'s `complete` branch in
`src/components/practice/lesson-selector.tsx`) to
`docs/design/learner-direction.md`'s COMPLETION section and the
owner-approved mockup artboard 5. This was the one screen L2a/L2b/Home v2/
Lesson v2 all deliberately skipped.

**A quiet stack, not a card.** `.lesson-celebration` is no longer a bordered/
shadowed box (`src/styles/practice-base.css` — its old
`max-width/padding/border/border-radius/background/box-shadow/text-align:
center` are gone, replaced by `width: 100%`; the `.lesson-session
.lesson-celebration` override in `practice-responsive-overrides.css` now
only sets `max-width: 720px; margin-inline: auto`). Text is left-aligned,
largest first, directly on the canvas. The screen also starts near the top
rather than the ~30% offset every other slide uses — a new
`.lesson-stage-complete` modifier class (added by `LessonSelector` only in
the `complete` branch) sets `padding-top: 64px` instead of the shared
`clamp(64px, 30vh, 220px)`.

**Removed:** the green check-circle seal, "LECCIÓN COMPLETADA" caps title,
"Tu progreso está guardado." note, the concept-card grid (`CompletionConcepts`
and its `.completion-concept(s)`/`.completion-review` CSS), the three-button
row (Continuar/Omitir/Inicio and their `.completion-action*` CSS), and the
lesson-name eyebrow that used to sit above the seal (the mockup goes
straight from the status strip to the final sentence). `skipLesson` is no
longer called from here (direction: no skip) — the function itself stays in
`src/lib/learner/progress.ts`, still exercised by
`tests/unit/learner-progress.test.ts`.

**The final sentence, size-by-length (owner tweak).** The lesson's last
sentence block's outcome (`lessonOutcome`, unchanged) renders at one of
three sizes, chosen by `completionSentenceSize()` (new, in
`src/lib/learner/presentation.ts`) counting words in the English text: `<=5`
words → `--t-hero` (700 weight, the loudest step); 6–10 words → `--t-sentence`
(600 weight); `>10` words → a fixed 22px/600 ("body-ish", not the fluid
`--t-body` token — the direction calls out a fixed step here so a long
sentence's size doesn't creep back up on a wide phone). The bucket is set as
a `data-size` attribute on `.completion-sentence-en` and switched purely in
CSS (`src/styles/practice-completion.css`) — no inline sizing. A **replay**
icon button (`lucide-react`'s `RotateCcw`, replacing the old `Play` glyph —
closer to the mockup's circular-arrow icon) sits beside it and speaks the
sentence with the last slide's speaker, same `speakSentence` call as before.
The Spanish line beneath is `--t-body`/`--ink-muted`; "Esto ya lo puedes
decir." is `--t-ui`/600.

**Next lesson or module completion.** `showNextLesson` gates on a real next
lesson *and* not being the Lesson Builder's inline preview (which only ever
gets a single lesson, so it never has a real "next" to hand off to). When
true, a white card (`.completion-next-card`, 16px radius/hairline border/
`--shadow-card`) shows an eyebrow "Siguiente", the next lesson's own
`lessonOutcome` in English (`--t-ui`/600) and Spanish (`--t-body`/muted) —
falling back to the lesson's name/number if it has no sentence block, since
`previewText` is a Spanish-only field and was previously being read as an
English fallback by mistake in an early draft of this change. When there's
no next lesson (course end, or the builder preview), a `moduleOutcomes` list
gathers every lesson sharing this one's `moduleId` (or, absent a
`moduleId`, every lesson in the course) that has a sentence outcome, and
stacks them 16px apart under an eyebrow "Lo que ya puedes decir"
(`.completion-module-list`/`-item`/`-en`/`-es`). Both eyebrows share a new
`.completion-eyebrow` class (explicit `color: var(--muted-foreground)`,
rather than depending on the old, now-removed `.lesson-session
.lesson-celebration .learner-eyebrow { color: var(--primary) }` rule, which
would have made them purple).

**The one action.** `.completion-cta` reuses `.learner-button.primary` for
colour (the existing `.lesson-session .learner-button.primary` rule already
covers any element with those two classes inside `.lesson-session`, not
just the footer) and gets its own sizing rule (56px/8px radius/`--t-ui`
weight 600 — the same numbers as the lesson's own primary action, just not
scoped to `.lesson-controls`), full width on phone and auto-width (min
280px) from 760px up. Label and destination: "Siguiente lección →" to the
next lesson when one exists, else "Volver al inicio →" calling the same
`close()` the header's X button uses.

**Feedback and reset.** Below the CTA, small and centred: "¿Qué te
pareció?" (an `#feedback` placeholder link) and "Reiniciar esta lección" — a
real button now, wired to `resetLessonProgress()` (previously exported from
`src/lib/learner/progress.ts` but never called from anywhere in the app). A
`confirmingReset` state flips the label to "¿Seguro? Reiniciar" on first
click (an inline confirm, no browser dialog) and resets on the second click,
clearing this lesson's stored progress and local step/answer state so the
learner lands back on the first slide. Losing focus (`onBlur`) reverts the
confirm without resetting anything. Both links share a new `.muted-link`
class (13px/`--muted-foreground`, `font: inherit` so the reset `<button>`
matches the feedback `<a>`).

**Motion.** The whole screen keeps the existing 240ms slide cross-fade via
`.learner-enter`/`.lesson-session .learner-enter`. The final-sentence block
additionally gets its own 300ms fade + 8px rise (`@keyframes completion-
sentence-reveal`, applied to `.completion-sentence-group`), matching the
direction's "completion sentence reveal 300ms" line as a distinct motion
from the 240ms slide change. Being inside `.learner-theme`, it's covered by
the existing reduced-motion rule that collapses all `.learner-theme`
animation/transition durations to 1ms rather than disabling them outright.

**Speaker-row check (LESSON, not COMPLETION).** Verified on a sentence slide
at 390×844 on the isolated Playwright server: the speaker chip (48px
portrait + flag/label) renders under the card within 1.5s at rest, before
any input — `availableSpeakers()`'s manifest probe resolves because
`public/audio/manifest.json` is a real committed file the isolated dev
server serves like any other public asset; no fix was needed here.

Verified with `npm run test:unit` (372/372 — added `completionSentenceSize`
coverage in `tests/unit/learner-surfaces.test.ts`), `npx eslint` on the
touched files, `npx tsc --noEmit`, `npm run lint` (incl. CSS lint, clean of
new literal-colour findings), `npm run lint:dead` (no new findings — the
three pre-existing unused-export/type hints are unrelated to this change),
and `tests/ux/learner-polish.spec.ts` (its two completion assertions
rewritten for the new markup — `.lesson-celebration`/`.completion-cta`
instead of the removed "Lección completada" text and `.completion-actions`
button). Note: this spec's other two cases (`table.boundingBox()` height and
the keyboard-answers `piece.boundingBox()` timeout) were confirmed failing
identically on a clean `git stash` of this change, on an unrelated port —
pre-existing failures, not a regression from this task. Screenshots came
from a throwaway spec (deleted after) on `UX_CHECK_PORT=3221`:
`/tmp/claude-1000/completion-v2-390.png` (phone, 9-word sentence →
`data-size="sentence"`), `/tmp/claude-1000/completion-v2-1280.png` (desktop,
3-word sentence → `data-size="hero"`, real next-lesson card), `/tmp/
claude-1000/lesson-v2-speaker-390.png` (sentence slide, speaker row visible
at rest after 1.5s). `tsconfig.json`'s auto-added UX-check path entries were
reverted after each run.

## 2026-09-17 — Lesson v3 (owner round: composition, hints, the missed completion)

**Two actors from 768px, not 1024.** At ~950px the owner saw a stretched
phone layout: full-width card, speaker stranded under it, action in the far
corner. The stage's two-column media query now starts at `768px`
(`practice-responsive-overrides.css`, the "sentence slide as a sentence being
assembled" block). The card is capped at **720** (`--practice-column: 720px`)
and the speaker column (210) + gap (28) + card are centred on the canvas as
one group (`.sentence-stage { max-width: calc(720px + 210px + 28px) }`).

**Where the block sits.** One rule for every slide: `.lesson-stage` has
64px/112px block padding and gives its first/last child `margin-top: auto` /
`margin-bottom: auto`. Free space is shared top and bottom, and the deeper
bottom padding biases a short slide to ~40% of the viewport height; when the
slide is taller than the canvas the auto margins collapse and it starts at
64px and scrolls (a long vocabulary table never begins below the fold). The
112px bottom padding is the footer's 88px min-height + 24px, so the last
table row is never hidden behind the (still transparent) footer. Completion
keeps its top-of-canvas read (`.lesson-stage-complete > :first-child
{ margin-top: 0 }`).

**Explanations.** A single-line explanation is a card that fits its own text
(`width: fit-content`, max 720, centred) at `--t-sentence`; anything that
wraps is a 720-wide left-aligned card at `clamp(20px, 2vw, 26px)`.
`ExplanationStep`'s `data-wraps` rule decides, unchanged.

**Marks lose their italics.** A Spanish mark is bold `--lesson-hl-es`, an
English mark is bold `--lesson-hl-en` — same weight, no italics, no
underline. Updated in the shared learner/`practice-markdown` rule and in the
builder's own copy (`lesson-builder/explanation-editor.css`), so the
authoring canvas reads the same as the lesson.

**Hints are the speaker now.** The lightbulb is gone from sentence slides and
from table rows, and so are the amber hint field and the "Pista: …" diff bar
(`.stage-hint-toggle`, `.stage-hint`, `.answer-hint-toggle`, `.answer-diff*`,
`.answer-input.showing-hint`, `.stage-en-input[data-state="hint"]`, plus the
now-dead `diffChars`/`pickClosestAnswer` helpers). In their place, a quiet
text button **"Pista"** (`--t-ui`, `--ink-muted`, underline on hover) sits
under the speaker's flag/label, in the speaker column of both the sentence
stage and the vocabulary table. Using it — or `Alt+H`, or Enter/Tab on an
unanswered piece — puts the answer for the active piece (or the focused table
row) in the speaker's bubble **and** has the current speaker say it
(`speak()`), for ~4s, after which the bubble returns to whatever it was
showing (or hides if it had nothing). The field is never filled in, there is
no penalty (a used hint no longer blocks `isComplete`) and there is no limit.
With no speaker available on the device, `SpeakerChip` renders the hint text
in a plain bubble with no avatar and no audio.

**Vocabulary rows.** The row grid lost its third "hint button" column, which
only existed on the focused row and made that row's field narrower than the
rest; every row's field is now the same width, focused or not.

**Back.** The quiet back icon is positioned against the footer itself —
24px from the left, vertically centred with the primary button — instead of
riding the centred button row inward. In a dev build Next's own
dev-indicator portal still sits in that corner and swallows synthetic
pointer events (the learner-polish spec dispatches the click instead of
pressing it); the portal does not exist in a production build.

**The "old" completion screen.** Nothing in `src/` renders it: the eyebrow /
check glyph / "Lección completada" / "Tu progreso está guardado" / "Inicio"
markup was deleted wholesale in `20965ff6` (Completion v2) and a new unit
test now walks `src/` and fails if either string comes back. What was really
missing was the path: `resumeStepIndex` returned 0 for a lesson with
`completedAt`, so **reopening a finished lesson silently restarted it** and
the completion screen was unreachable once a lesson was done. It now returns
`blocks.length`, so reopening lands on the v2 completion screen (replay, next
lesson or the module's sentences, one CTA, "Reiniciar esta lección" to start
over). The screen the owner photographed was the pre-`20965ff6` bundle still
being served by a stale dev server.

**Reversed, 2026-09-17.** That landing rule was wrong in practice: once a
learner had finished a module, *every* entry point — the home's "Continuar",
every done row in the path — opened a "well done" screen, and the course read
as broken. `resumeStepIndex` returns 0 for a finished lesson again, which is
what the rule at the top of this document (and the methodology) always said:
a finished lesson **reopens from its first slide for review**, keeps its
completion record, and reaches its completion screen again at the end.

Verified with `npm run test:unit` (386/386), `npx eslint` on the touched
files, `npx tsc --noEmit`, `npm run lint` (incl. CSS lint), `npm run
lint:dead` (no new findings), `tests/ux/speech.spec.ts` (2/2, extended:
`Alt+H` shows and speaks the hint without filling the field) and
`tests/ux/learner-polish.spec.ts` (the keyboard-answers case now passes —
its stale `.answer-piece` locators were pointing at the retired grid card;
the vocabulary-height case still fails its `< 420` assertion, as it already
did on a clean stash of this work, though this round brings it from 606px
down to 514px). Screenshots from a throwaway spec (deleted after) on
`UX_CHECK_PORT=3219`: `/tmp/claude-1000/lesson-v3-960.png`,
`/tmp/claude-1000/explanation-v3-1280.png`,
`/tmp/claude-1000/completion-v3-reopen-1280.png`,
`/tmp/claude-1000/vocab-v3-1280.png`.

## 2026-09-17 — Explanation audio (playback)

The generator half of the explanation voice track (one American narrator,
`[[en:word|BRIDGE]]` pronunciation-bridge notation, SSML — see
`docs/design/speech.md` "Explanation voice track") now has its playback half
too.

**Learner.** `ExplanationStep` checks `explanationClipUrl(markdown)` on
mount; if a clip exists and speech isn't muted, it plays once automatically
— the learner has already interacted with the app, so autoplay is allowed,
and a rejected `play()` is swallowed silently like every other speech path.
A 40px "Escuchar" control (`Volume2`, `--primary`, top-right inside the
card's own padding) replays it, showing a subtle pulsing ring while it
plays (`prefers-reduced-motion`: none). Each play — auto or replay — is a
fresh `Audio` instance, so a replay is a real new request, not a re-trigger
of a cached one. Leaving the slide pauses whatever's playing. No clip → no
control at all; this never falls back to browser synthesis, since a
mixed-language explanation read by the wrong voice would be actively wrong.
The header's mute toggle silences both the autoplay and, live, a clip
already playing.

A bridged `en` mark's respelling is shown to the learner, small: quiet
`--ink-muted` text at `--t-eyebrow` size (not uppercase, no tracking)
directly after the word, e.g. "different ·DIFF-rent" — `PracticeMarkdown`
splits the mark's content on its last `|` (the bridge is always appended
last, after any nested bold/italic closes) rather than showing the raw
`[[en:…|…]]` dialect.

**Builder.** The mark popover gains a "Pronunciation" text field whenever
the caret sits inside an `en` mark, selection or not — a plain input, not a
chord, writing the `bridge` attribute on blur/Enter
(`setExplanationBridge`, `explanation-commands.ts`). Each explanation
slide's hover icon cluster gains a "Listen" button that plays the generated
clip if one exists for that exact markdown, else stays disabled with a
"Generate audio first (npm run audio:generate)" tooltip.

Verified with `npm run test:unit` (386/386, unchanged — the new behaviour
is UI-only, covered by the spec below rather than pure-function unit
tests), `npx eslint` on the touched files, `npx tsc --noEmit`, `npm run
lint` (incl. CSS lint, no new findings), `npm run lint:dead` (no new
findings), and `tests/ux/speech.spec.ts` extended with a case that fakes
the manifest and clip bytes (so the same markdown can carry a bridge for
the screenshot too), asserting one clip request on slide open and a second,
fresh one on pressing "Escuchar", and that the bridge renders. Screenshot:
`/tmp/claude-1000/explanation-audio-1280.png` (`UX_CHECK_PORT=3221`).

## 2026-09-17 — Feedback

Per-slide feedback (`docs/backlog.md` "Per-slide feedback"). One component,
`src/components/learner/feedback-sheet.tsx`, is shared by three triggers:

- The practice footer's quiet "¿Algo que corregir?" text button — desktop:
  left side, next to the back icon; phone: its own row above the primary
  button, never competing with it.
- The completion screen's existing "¿Qué te pareció?" link.
- The home footer's "¿Qué te pareció?" link.

Tapping either opens a sheet that slides up from the bottom (240ms
ease-out, instant under `prefers-reduced-motion`): a textarea ("Cuéntame
qué está mal o qué mejorarías."), an optional "¿Quién eres? (opcional)"
field remembered on the device (`localStorage icc.feedback.who`), and
"Enviar" / "Cancelar". Escape closes it (captured ahead of the lesson
session's own Escape-closes-lesson handler, so the sheet never lets that
fire while open). Sending posts the current slide's context — lesson id/
name, slide index, kind, and a plain-text rendering of what the slide
shows — to `POST /api/feedback` (`docs/engineering/feedback.md`), then
shows "¡Gracias! Anotado." for 2 seconds before closing. A failed request
shows "No se pudo enviar. Inténtalo otra vez." inline; no browser dialogs
are used anywhere in the flow.

Verified with `npm run test:unit` (406/406, 8 new validator cases), `npx
eslint` on the touched files, `npx tsc --noEmit`, `npm run lint` (incl. CSS
lint, no new findings), and a new `tests/ux/feedback.spec.ts`
(`UX_CHECK_PORT=3222`) that opens the sheet from the practice footer,
submits with `POST /api/feedback` mocked via `page.route`, and asserts the
request body and the thanks state. Screenshot:
`/tmp/claude-1000/feedback-390.png`.

## 2026-09-17 — Feedback: floating pill, rich metadata, and a real footer

Three changes, all owner-directed:

**One floating pill, not three text links.** The practice footer's "¿Algo
que corregir?" and both "¿Qué te pareció?" links (completion, home) are
gone. In their place: one pill, bottom-right, on every learner screen —
`--primary` fill, white `MessageCircle` icon + "Comentar", 48px tall,
24px radius, `--shadow-cta`, 200ms hover lift. On a practice slide it sits
16px above the footer's action zone so it never overlaps "Continuar"; the
completion screen has no footer, so it sits plain bottom-right there, same
as home. Below 768px it collapses to a 48px round icon-only button
(`aria-label="Comentar"`), 16px from the corner. While the sheet itself is
open the pill fades out (150ms, instant under `prefers-reduced-motion`) —
it used to sit visually under the sheet's Cancel button. The sheet's own
copy didn't change ("¿Algo que corregir o mejorar?" already read that way);
one new line was added under the title: "Dime qué viste y qué esperabas.
Cada comentario mejora la lección." The "¿Quién eres?" field now saves to
`localStorage` on every keystroke (not just on submit) and is re-read every
time the sheet opens, so a name typed once actually persists across
sessions — the field had been observed empty on a later visit despite
having been filled in before. "Enviar" is enabled the moment the message
has one non-space character, and reads visibly disabled (`opacity: 0.5`)
before that. On the home page, `LessonDashboard` was rebuilt with a real
site footer (`.site-footer` in `learner-foundations-home.css`): a hairline
top border, brand mark + name + tagline on the left, a small "Inicio /
Comentar / Sobre el curso" link row on the right (stacked under on phone),
and a copyright line across the bottom. Its "Comentar" link opens the same
pill's sheet instance via an imperative handle
(`FeedbackSheetHandle`/`useImperativeHandle`) rather than duplicating the
dialog.

**Rich metadata so the coordinator can triage without asking.** The
payload (`docs/engineering/feedback.md` has the full field table) grew
from lesson/slide/message/who/page/userAgent/at to also carry: module id/
name, slide count, a stable slide id; a `slide` snapshot of what was
actually on screen (markdown for an explanation, Spanish→accepted pieces
for a sentence/table, the final sentence for completion, the next lesson
id for home); an `answers` array of what the learner had typed on this
slide and whether each piece was correct; a running `hintsUsed` count for
the slide (new counter in `useSentencePractice`, reported up via
`onHintsUsedChange`); `secondsOnSlide` (derived from a `slideStartedAt`
timestamp reset on `previous`/`advance`, not from an effect — computed
once at submit rather than re-rendering on a tick); `muted`/`speakerId`;
course `progress`; and device info (`viewport`, `language`, `pointer`,
alongside the existing `userAgent`). `appVersion` is the build's short git
sha, wired in `next.config.ts` (`git rev-parse --short HEAD`, falling back
to `"dev"`) as `NEXT_PUBLIC_APP_VERSION`. `slide`/`answers`/etc. are
assembled by the caller (`LessonSession` or `LessonDashboard`) into a
`FeedbackContext` object; the device/timing fields are filled in by
`FeedbackSheet` itself at submit time, not threaded through as props.
Validation (`validateFeedbackPayload`) still only hard-rejects on
`message`/`who` length and now also rejects a `slide` snapshot over 8KB
serialized; every other field is coerced to a safe default rather than
failing the request.

**Triage report.** `npm run feedback:report [path]`
(`scripts/feedback-report.ts`, grouping/rendering logic in
`src/lib/feedback/report.ts`) reads `data/feedback.jsonl` by default and
prints a Markdown report grouped by module → lesson → slide, each slide
showing its own text and every note left on it (who/when/device/answers/
hints/message), ending with a notes-per-lesson table and a top-slides-by-
note-count table. (Feedback storage is moving to Postgres with an
`/admin/feedback` page in a later session; the Google Sheet / Apps Script
path in `docs/engineering/feedback.md` is superseded by that, and this
report stays JSONL-only until the DB reader lands alongside it.)

Verified with `npm run test:unit` (407/407 — 2 new validator cases, 4 new
grouping/rendering cases for the report), `npx eslint` on the touched
files, `npx tsc --noEmit`, `npm run lint` (incl. CSS lint, no new
findings), `npm run lint:dead` (no new findings), and
`tests/ux/feedback.spec.ts` rewritten for the pill (`UX_CHECK_PORT=3226`):
opens the sheet from the floating "Comentar" pill on a sentence slide after
typing the one correct piece and pressing Alt+H once, submits with
`POST /api/feedback` mocked, and asserts `slide.pieces`,
`answers[0].correct === true`, `hintsUsed === 1`, `slideCount`, and
`viewport` on the captured request body. Screenshots:
`/tmp/claude-1000/feedback-pill-1280.png` (practice slide, pill visible)
and `/tmp/claude-1000/footer-1280.png` (home site footer).
