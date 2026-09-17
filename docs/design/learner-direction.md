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
- Saturated purple only on: the hero gradient, the one CTA, the progress fill, the
  finished English words, the focus ring. Nowhere else.
- Spanish marks: flag red. English marks: Union Jack blue. Success glyph: `--success`.
  No other hue on a screen.
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
2. **The stage** (centred column, max 760 desktop, gutters 20 phone; sits at ~30% from
   the top, not dead centre):
   - **Explanation slide**: white card; text at body size (22/19), left-aligned when
     it wraps, centred only when it is one line; marks in flag red / Union Jack blue,
     bold Spanish, italic English. A single-line explanation may go to sentence size.
   - **Sentence slide**: instruction (if any) as a muted body line above the card.
     White card with two lines at sentence size: the Spanish sentence as prose (active
     piece in flag red bold, done pieces ink, pending `--ink-muted`), and the English
     sentence assembling beneath it (done words in purple 600, the active piece an
     inline field in the flow, pending pieces as underlines sized to the word). Hint
     icon: purple outline, at the end of the active Spanish piece. Nothing else in
     the card.
   - **Speaker**: desktop, a column to the left of the card: 72px round portrait,
     flag + label beneath, bubble pointing at the card; phone, a row under the card
     with a 48px portrait. No bubble until the first words; then it keeps the last
     thing said. Bubble at UI-label size, white, hairline, 12px radius.
   - **Vocabulary table**: same card, rows of Spanish (sentence size) → inline field,
     hairline between rows, hint at the row end.
3. **The action**: a single primary button, 56px tall, purple, white text, 8px
   radius: "Continuar →" / "Vamos a practicar →" / "Terminar lección →". Phone: in
   the footer thumb zone, full width minus gutters, only when there is something to
   do (never an empty bar; sentence slides show it once complete). Desktop: centred
   under the stage. Back is a quiet icon, bottom-left, only when going back is
   possible.

Success = the word settling into place (150 ms ease-out from tint field to purple
text) and the speaker saying it. No check glyphs, no colour flash of the footer, no
sound effects beyond the voice.

## COMPLETION — "you said that"

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

Lesson-name eyebrow on slides, all check glyphs, the amber lightbulb, the green
footer/button, module counters, durations, "Empieza aquí" labels, concept chips,
per-row reset on the home, the completion concept cards and the three-button row.
