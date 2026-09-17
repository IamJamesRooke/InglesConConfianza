# Learner design direction — home and lesson, from scratch

> 2026-09-17. Built on `learner-design-research.md` (numbers) and `product-vision.md` (why).
> This is the target the mockups and then the code follow. Purple palette, tokens only,
> one typeface (Geist), phone first (390×844), desktop second (1280+). The owner
> approves against mockups before anything is built.

## The idea in one line

**A quiet white page where one purple thing is always the next thing to do, and the
sentence you're building is the biggest thing on the screen.**

Everything else follows from three ratios: 90% white and ink, 5% lavender tint, 5%
saturated purple. Type in three sizes plus an eyebrow. One call to action per screen.
One signal per success. Motion between 120 and 280 ms, ease-out, never a bounce.

## Type scale (Geist, weights 500/600 only, 700 for the one hero line)

| role | phone | desktop | weight | tracking |
|---|---|---|---|---|
| hero line | 36 | 56 | 700 | −0.03em |
| sentence (Spanish + English lines, completion sentence) | 26 | 34 | 600 | −0.01em |
| section title | 22 | 28 | 600 | −0.01em |
| body / explanation | 19 | 22 | 500 | 0 |
| UI label / button | 16 | 17 | 600 | 0 |
| eyebrow | 11 | 12 | 600 | +0.12em, uppercase |

Line-height 1.15 for hero, 1.35 for sentence and titles, 1.55 for body.

## Spacing

8-point scale: 8 / 16 / 24 / 32 / 48 / 64 / 96. Section gap 96 desktop, 48 phone. Card
padding 24 phone, 32 desktop. Gutter 20 phone. Content column max 720 for reading, 1120
for the home grid.

## Colour, by role

- Canvas: `--canvas-warm` lavender tint. Cards: white, 16px radius, 1px `--border`,
  `--shadow-card`. Never a tinted card.
- **Colour is language** (owner, 2026-09-17, supersedes "finished English words are
  purple"): every piece of Spanish the learner is translating is flag red
  (`--lesson-hl-es`) and bold; every English answer is Union Jack blue
  (`--lesson-hl-en`) and bold. That holds for marks inside explanations, the
  sentence stage's two lines, and the vocabulary table.
- Saturated purple is chrome and action only: the hero gradient, the status strip,
  the one CTA, the progress fill, the focus ring. Nowhere in the language itself.
- No success glyph anywhere in practice — the colour settling and the speaker are
  the success signal. No other hue on a screen.
- Text on white: ink. Secondary: `--ink-muted`. On purple: white / white 85%.

## HOME — "your next sentence"

The home is not a course catalogue. It is one promise and a path.

Phone, top to bottom:
1. **Header, 56px**: brand mark left, nothing else. No border under it.
2. **Hero card, full width, 24px radius**, purple→magenta gradient, 32px padding:
   eyebrow "TU PRÓXIMA LECCIÓN" (or "EMPIEZA AQUÍ"), hero line in white
   ("Habla inglés. Con confianza." first visit; the module name afterwards), one
   line of sub-copy at body size white 85%, then the **promise card** (white, inside
   the hero): eyebrow "VAS A PODER DECIR", the lesson's final English sentence at
   sentence size in ink, its Spanish beneath in `--ink-muted`; then the **CTA**: white
   pill on the gradient, purple text, 56px tall, full width, "Empezar →". The whole
   hero fits above the fold on a 844px phone.
3. **Path, 48px below**: section title "Tu recorrido". Then lesson rows as one
   vertical path: a 2px purple line on the left with a 12px node per lesson (filled
   purple = done, ring = next, hairline = later); each row: number eyebrow, English
   title at UI-label weight 600, Spanish at body muted. The next lesson's row is a
   white card; done and later rows are plain rows. No durations, no counters, no
   skip/reset (reset lives on the completion screen). One module = no module chrome
   at all; several modules = the module name as a section title above its rows.
4. **Footer**: brand line and the "¿Qué te pareció?" text link, small, muted.

Desktop: hero as a two-column card (copy left, promise card right), 96px section gap,
path column max 720 centred. Same components.

## LESSON — "the stage"

The lesson screen has three layers and nothing else: a thin status strip, the stage,
and the one action.

1. **Status strip, 48px** (56 desktop): purple, icon-only close left, mute right, 4px
   progress fill along the bottom edge. No title, no counter.
2. **The stage** (centred column, card max 720, gutters 20 phone; a short slide's
   content block sits at ~40% of the viewport height, and a slide taller than the
   canvas starts at 64px and scrolls instead):
   - **Explanation slide**: white card. One line: the card fits its text
     (`width: fit-content`, max 720, centred) at sentence size. More than one line:
     max 720, left-aligned, at `clamp(20px, 2vw, 26px)`. Marks are flag red / Union
     Jack blue and **both bold, same weight — no italics** (owner, 2026-09-17).
   - **Sentence slide**: instruction (if any) as a muted body line above the card.
     White card with two lines at sentence size: the Spanish sentence as prose (active
     piece in flag red bold, done pieces ink, pending `--ink-muted`), and the English
     sentence assembling beneath it. Line 1 is all flag red and bold — the active
     piece carries a 2px red underline rather than a colour change, pieces still to
     come sit at 60% of the same red, a `given` piece is plain ink. Line 2 is Union
     Jack blue 600 as it fills in; an empty blank is a `--border` underline sized to
     the word, and the active piece is an inline field in the flow, also blue.
     Nothing else in the card — no hint icon (see **Help** below).
   - **Speaker**: the two-actor composition starts at **1024px** (owner, 2026-09-17 —
     it briefly started at 768, where a portrait beside a box read as a portrait
     stuck in the corner): a 200px column to the left of the card with a 64px round
     portrait, flag + label beneath, bubble pointing at the card, 24px to the card,
     the card capped at 720 and the whole group centred with equal air either side
     (the one action is centred under the group, not under the card); below 1024 it
     is a row under the card with a 48px portrait. No bubble until the
     first words; then it keeps the last thing said. Bubble at UI-label size, white, hairline, 12px radius.
   - **Vocabulary table**: same card, rows of Spanish (sentence size, flag red bold)
     → inline field whose answer is Union Jack blue bold, the row being answered
     marked by an underline under its Spanish prompt, hairline between rows. Every row's field is the same width, focused or not, and
     the stage's bottom padding clears the footer so the last row is never hidden
     behind it.
   - **Help**: one small ghost button, "Pista" — hairline `--border`, ink text at
     `--t-eyebrow` (not uppercase), 8px radius, 28px tall, `--surface-subtle` on
     hover. Under the speaker's flag/label in the column at 1024+, at the end of the
     speaker row below that. No lightbulb anywhere, no amber hint bar (owner,
     2026-09-17). It puts the answer
     for the active piece (or focused table row) in the speaker's bubble and has the
     speaker say it for ~4s, then the bubble goes back to what it was showing. The
     field is never filled in; no penalty, no limit; `Alt+H` does the same. With no
     speaker on the device, the bubble shows the text without audio.
3. **The action**: a single primary button, 56px tall, purple, white text, 8px
   radius: "Continuar →" / "Vamos a practicar →" / "Terminar lección →". Phone: in
   the footer thumb zone, full width minus gutters, only when there is something to
   do (never an empty bar; sentence slides show it once complete). Desktop: centred
   under the stage. Back is a quiet icon 24px from the left of the footer, vertically
   centred with the primary button, only when going back is possible.

Success = the word settling into place (150 ms ease-out from tint field to blue
text) and the speaker saying it. No check glyphs anywhere — not beside a vocabulary
row, not beside the instruction — no colour flash of the footer, no sound effects
beyond the voice.

## COMPLETION — "you said that"

0. A finished lesson reopens from its first slide for review; the completion
   screen is reached again at the end (docs/teaching-methodology.md;
   docs/design/student-experience.md).
1. Status strip stays (progress full).
2. Stack, centred, largest first: the final English sentence at hero size (36/56)
   in ink with a **replay** button beside it; the Spanish beneath at body muted;
   one line "Esto ya lo puedes decir."; 48px gap; the next lesson as a path row
   card ("SIGUIENTE" eyebrow, its promise sentence); the CTA "Siguiente lección →".
   At the end of the module: every lesson's final sentence stacked, 16px apart, then
   the CTA to the home.
3. Below the fold, small and muted: "¿Qué te pareció?" and "Reiniciar esta lección".
   No badge, no confetti, no concept cards.

## Motion budget

Word settle 150 ms; button appear 200 ms fade + 4px rise; slide change 240 ms
cross-fade with a 8px rise; progress fill 240 ms; completion sentence reveal 300 ms
fade + rise. All ease-out. `prefers-reduced-motion`: opacity only, 1 ms.

## What this removes from today

Lesson-name eyebrow on slides, all check glyphs, the amber lightbulb and its hint
bar, italic English marks, the green
footer/button, module counters, durations, "Empieza aquí" labels, concept chips,
per-row reset on the home, the completion concept cards and the three-button row.
