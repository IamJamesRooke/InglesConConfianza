# Learner design research: what "a whole team built this" looks like, in numbers

> Written 2026-09-17. Research only — no code, no new features. Answers one question:
> what concrete, measured visual/interaction patterns should the home page and lesson
> screen borrow, given our constraints (vibrant purple, Spanish-speaking adult
> beginners, phone-first, type-the-sentence practice, no punishment per
> `teaching-methodology.md`, one message per zone per `student-experience.md` L1/L2a/L2b)?
> Every referent is cited; every number below came from a fetched source, not from
> memory of "what these apps generally look like."

## Why these referents

Language apps show how competitors handle progress, streak/reward pressure, and typing
feedback (what to avoid). Polish sites (Linear, Stripe, Notion, Raycast, Arc, Headspace)
show what "a funded team" actually ships: one accent colour rationed onto a mostly
neutral field, light display type at large sizes, generous whitespace, one CTA.
Monkeytype and Kahoot isolate the "type/answer → instant feedback" moment.

## Referent table

| Referent | Type scale (hero/heading/body, px) | Base spacing unit | Colour strategy | Primary CTA | Progress display | Motion |
|---|---|---|---|---|---|---|
| **Duolingo** | Hero 64/700; body 17/500; button 15/700; one family (Feather + duolingo-sans) | ~8px grid (8/9.5/10/12/13) | 2 saturated hues (green #58CC02, blue #1cb0f6) on white; semantic reds/yellows only for state | 50px min-height, 12px radius, UPPERCASE 15px bold, solid 3D "lip" shadow `0 4px 0 #58A700`, presses translateY(4px) | Path/tree of nodes, thin bar in-lesson | 120/180/280/420ms, no easing curve published |
| **Linear** | Display sizes not fixed-px (fluid); UI text 3-weight system 400/510/590; Inter Variable w/ `cv01`,`ss03` | 4px grid; radii 4/6/12 | Near-black canvas (#08090a), one accent #5e6ad2, restraint = the brand | Small, text-weight-driven, not a giant pill — contrast comes from placement not size | Linear issue/cycle progress = thin bars + count, no gamification | Not documented in sources; known for fast, subtle (~150–200ms) transitions |
| **Stripe** | Hero 56/300, H1 48/300, H2 32/300, H3 22–26/300, body 16/300, button 16/400; Söhne var, `ss01` | 8px grid, full scale 1/2/4/6/8/10/11/12/14/16/18/20/24/32/40/48/64/80/96/120 | Purple #533afd reserved for action surfaces only; navy `#061b31` for headings, not black; body grey `#64748d`; blue-tinted shadows, not grey | Small: 8px/16px padding, 4px radius, solid `#533afd` bg, white text, 16px/400 — deliberately *not* huge | N/A (marketing site) | Not detailed; subtle fades typical of the brand |
| **Notion** | Hero 80/700 ("issue-defining"), Display-large 64/700, tight negative tracking (‑0.033em+ at hero); NotionInter 400/500/600/700 | Not extracted | Dark navy hero (#02093a) → then almost entirely white/black/light-grey product; colour is nearly absent outside icons | Simple button row under hero, no oversized pill; hierarchy from type size not button size | N/A (marketing + product is document-first) | Not detailed |
| **Headspace** | Not extracted in px; brand uses soft/rounded custom type | Not extracted | Warm illustration-led palette: deep purple #3b197f as one of several accents, hot orange #ff7300 as the "character" colour; tinted warm surfaces instead of card elevation | Rounded pill buttons, warm-toned, low-contrast-but-friendly (not stark) | Streaks/stats present but softened by illustration | Character-driven onboarding animation, not measured here |
| **Arc browser** | Product: Inter, tight tracking, generous line-height (no hero px found); marketing: display serif, editorial | Not extracted | Electric blue dominance (#3139FB) + one saturated gradient bloom (violet→fuchsia or peach→coral) on frosted-glass surfaces; colour lives in gradients and glass, not flat fills | Not detailed in sources | N/A | Frosted-glass + gradient motion is the "wow"; no numbers found |
| **Raycast** | Inter everywhere, extensive OpenType features (`calt`,`kern`,`liga`,`ss03`), +0.2–0.4px tracking on body (unusual for dark UI) | Section rhythm 96px; near-black surface ladder #07080a→#0d0d0d→#101111→#121212 | ~98% achromatic; one coral accent #ff6363 rationed to logo/hero art/badges; blue #55b3ff and green #5fc992 reserved for interactive/success states only | Not detailed in sources | Compact power-user rows, not progress bars | Not detailed |
| **Monkeytype** | Minimal chrome; monospace test text, large single-focus type block; dark theme default | Not extracted (extreme minimalism: near-zero UI) | Near-monochrome; red flash only for typos = the *entire* feedback vocabulary | No CTA — the test itself is the interaction | Live WPM graph after the test, not during | Caret animation smooth; red-flash feedback is instant, no delay |
| **Kahoot!** | Bold rounded sans, oversized numerals for scores; N/A precise px | Not extracted | 4 saturated primary hues (red/blue/yellow/green) mapped 1:1 to answer shapes — the opposite of restraint, works because it's a shared-screen party format | 4 big colour-coded tappable tiles = the CTA | Countdown timer that visibly pulses/changes colour toward red | Particle/confetti bursts, colour-pulsing timers — high-motion, high-reward |
| **NYT Games (Wordle/Connections)** | Not extracted; system font, large single-grid focus | Not extracted | Near-monochrome grid; colour used only as feedback (green/yellow tile reveal), never as decoration | No CTA screen — one board is the whole app | "One puzzle, once a day" *is* the progress model — no bar, no counter | Tile-flip reveal is the one animated moment; everything else static |
| **Babbel** (added) | Roboto, generous whitespace, no distinct hero found (in-app, not web-marketing-led) | Not extracted | Pastel, low-saturation; dark mode adopted heavily (40–50% of active users within 2 weeks of launch, per Babbel design blog) | Not detailed | Standard % complete + streak | Not detailed |
| **Speak** (added) | Not extracted precisely; "confident, high-contrast action elements with soft backgrounds" | Not extracted | Two-tier: soft pastel background, one high-contrast action colour for the mic/record control | Large mic/record control is the CTA — action-shaped, not a text pill | Level indicator, not XP-styled | Users flag *missing* motion (no waiting-state animation) as a felt gap — a documented anti-pattern to avoid |

Sources: [Duolingo tokens — Dembrandt](https://www.dembrandt.com/explorer/duolingo), [Duolingo brand — Canny Creative](https://www.canny-creative.com/atlas/brand/duolingo/), [Duolingo homescreen — Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design), [Linear tokens — shadcn.io](https://www.shadcn.io/design/linear), [Linear DESIGN.md — VoltAgent](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md), [Stripe DESIGN.md — webdesignhot](https://www.webdesignhot.com/design.md/stripe/), [Notion DESIGN.md — webdesignhot](https://www.webdesignhot.com/design.md/notion/), [Headspace case study — Raw.Studio](https://raw.studio/blog/how-headspace-designs-for-mindfulness/), [Headspace colours — ColorsWall](https://colorswall.com/palette/95679), [Arc design system — OpenDesign](https://open-design.ai/plugins/design-system-arc/), [Arc UI typography](https://arc-ui.netlify.app/docs/typography/), [Raycast tokens — shadcn.io](https://www.shadcn.io/design/raycast), [Raycast DESIGN.md — VoltAgent](https://github.com/voltagent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md), [Monkeytype](https://monkeytype.com/), [Monkeytype repo](https://github.com/monkeytypegame/monkeytype), [Kahoot UI breakdown — screensdesign](https://screensdesign.com/showcase/kahoot-play-create-quizzes), [Kahoot help](https://support.kahoot.com/hc/en-us/articles/115002308428-Kahoot-question-types), [NYT Games app](https://apps.apple.com/us/app/nyt-games-solve-puzzles-daily/id307569751), [Babbel dark mode/tokens — Babbel Design Medium](https://medium.com/babbeldesign/welcome-to-the-dark-side-we-have-tokens-68435363ba6), [Babbel review](https://ling-app.com/blog/babbel-review/), [Speak app design — Fudge](https://design.withfudge.com/share/app.speak.com-design), [Speak App Store](https://apps.apple.com/us/app/speak-language-learning/id1286609883).

Lower-confidence (search summaries only, not fetched raw tokens): Memrise, Busuu, Lingvist, Arc's exact hero px, Headspace's exact px. Their qualitative pattern (Memrise: too many saturated colours read as "aggressive" per its own users; Busuu: timeline-shaped path + streak; Lingvist: purple/blue palette kept for calm, "brighter/warmer... easier on the eye") still informed the synthesis below, marked as directional, not measured.

## What each removes from the practice/lesson screen

- **Duolingo**: keeps a header (streak, hearts, gems) and a "1/12"-style unit counter — the thing our L2a already deliberately deleted.
- **Monkeytype**: removes *everything* except the text and the cursor. No header, no counter, no button — the typing itself is the only UI.
- **NYT Games**: removes settings/chrome from the puzzle screen entirely; even the "give up" or hint affordance is a single small icon, not a bar.
- **Raycast/Linear/Stripe**: remove decoration, not information — one accent colour is rationed so hard that when it appears (a button, a link) it reads as "the one thing to do here."
- **Kahoot**: removes *nothing* — it is maximum chrome, maximum colour, maximum motion. Useful as the "avoid" reference for a solo, ongoing daily-practice tool: what works in a shared, timed party game (colour-coded tiles, pulsing countdown, confetti) reads as noisy and juvenile in a private 2-minute daily session.

## How correct answers are celebrated

- **Monkeytype**: red flash on error only; no celebration of correct at all — correctness is silence, which keeps flow uninterrupted. This matches our L2b decision to remove per-piece and whole-sentence checks in favour of the finished word itself as the signal.
- **Duolingo**: sound + colour fill + XP tick + streak-flame — three to four simultaneous signals per correct answer.
- **Kahoot**: confetti/particles + colour + score jump + leaderboard motion — a "celebration stack," appropriate to a live shared event, not a private daily habit.
- **NYT Games**: one tile-flip colour reveal, no sound, no counter tick until the whole puzzle ends.
- **Headspace/Babbel**: soft, low-arousal transitions (fade/scale), consistent with a calm brand rather than a dopamine spike.

## Synthesis — opinionated, for Inglés con Confianza

### 1. Ten patterns to adopt, with numbers

1. **One accent, rationed hard.** Keep `--brand-primary` purple, but hold it to roughly the Raycast/Stripe ratio: ~90–95% of any screen is white/near-white surface + ink text; the purple appears on the hero gradient, the one CTA, the one progress fill, and small success glyphs — nowhere else. (Matches student-experience L0b's "colour lives on surfaces" decision; this just gives it a number.)
2. **Light-weight display type at real size, not bold-everywhere.** Borrow Stripe's move: H1 44–56px at a *lighter* weight (500–600, not 700) with tight tracking (‑0.02em to ‑0.03em) reads as "designed," where bold-everywhere (Duolingo's 700 hero) reads as "gamified." Desktop hero 48–56px; phone hero 32–36px (Notion's ratio of ~hero:phone ≈ 1.4–1.6:1 downscaled to our smaller phone hero).
3. **One CTA, sized for thumb not for shouting.** Duolingo's 50px min-height pill is the right physical size for a thumb target; Stripe's restraint (small, 16px text, 4px radius, no 3D lip) is the right visual weight. Take the size, not the toy shadow: single primary button ≥52px tall, full-width on phone, 4–8px radius (not pill, not square — matches our existing card radius language), solid `--brand-primary`, no bevel/lip/gloss.
4. **8px spacing grid, generous section gaps.** Adopt Stripe's scale (8/16/24/32/48/64/96) rather than inventing one. Desktop section gap 96px, phone section gap 48px — half, not proportionally smaller-forever, so phone doesn't feel cramped.
5. **Progress = a single thin bar or none, never a counter stack.** Follow NYT Games/Monkeytype: no "3/12", no XP number, no streak flame on the practice screen itself. A 3–4px top-edge progress bar (already shipped in L2a) is the ceiling of progress chrome during a lesson. Save richer progress (path view) for the home page only, not mid-lesson.
6. **Correctness = one quiet signal, not a stack.** Confirmed by both Monkeytype (silence) and our own L2b decision (finished word = signal). Cap it at *one* visual cue per correct answer: the word settling into place. No sound, no color flash of the whole field, no counter tick, matching `teaching-methodology.md`'s "never a bad session / no failure state" and avoiding Duolingo's 3–4-signal stack.
7. **Motion budget: 120–280ms, ease-out, nothing bounces.** Duolingo's own token set (120/180/280/420ms) is a reasonable ceiling; skip its 420ms+ bounce/lip-press animations (that's the "gamified toy" tell). Use 150–200ms ease-out for state changes (word settling, button appearing), 240ms for the progress-bar fill (already shipped), and respect `prefers-reduced-motion` everywhere (already global per L2a).
8. **Headline-to-first-action distance stays under one screen.** Notion/Stripe put the CTA immediately under the hero with no scroll; on our 390px home, hero + promise card + CTA must fit above the fold without scrolling on a typical phone (~700–800px viewport height).
9. **Cards, not chrome, carry hierarchy.** Stripe/Linear/Raycast all lean on one consistent card/surface treatment (radius + hairline + soft shadow) rather than headers, dividers, or labels to separate sections — matches our L2a "one card style everywhere" decision; extend that same single card recipe (16px radius, 1px `--border`, `--shadow-card`) to the home page's promise card and completion screen.
10. **Reserve saturated secondary hues for state only, never decoration.** Stripe's ruby/magenta and Raycast's blue/green exist solely for semantic success/alert states, at low frequency. If we ever add a second accent (e.g., a warm colour for "help"), restrict it the same way — never a decorative background fill.

### 2. Patterns to avoid

- Hearts, streak flames, XP counters, gems, leaderboards (Duolingo, Kahoot) — direct conflict with product-vision §3 ("no penalties... progress = sentences you can now say").
- Confetti / particle bursts / screen-wide celebration (Kahoot) — reads as a "toy," and conflicts with "evidence, not confetti" (product-vision §3.2).
- Three-or-more simultaneous success signals (sound + colour fill + counter tick) — one is enough; see Monkeytype and our own L2b precedent.
- Centred long paragraphs of explanation (avoid Duolingo/marketing-site hero patterns applied to teaching text) — methodology already mandates left-aligned once text wraps (L2a `data-wraps`); keep it that way, don't regress toward centred blocks for "polish."
- Countdown timers that pulse/redden (Kahoot) — creates exam anxiety, opposite of "first-attempt answerability, never wrong."
- Multiple simultaneous saturated hues on one screen (2019 Memrise's own users called this "aggressive" and hard to study in) — cap the active palette per screen at one accent + neutrals + at most one semantic colour (success).
- A visible "N/N" counter or unit-tree during practice (Duolingo path chrome) — already removed in L1/L2a; don't reintroduce it as a "polish" feature.
- Oversized bold headline weight (700+) used everywhere including body/UI labels (Duolingo) — reserve heavy weight for the single hero line only.

### 3. The "type the sentence" lesson screen at 390px, top to bottom

1. **Status strip, 48px.** `--primary` purple bar, icon-only close (40px hit area, white), 4px progress hairline on its bottom edge only. No title, no counter (per L2a, keep as-is).
2. **Eyebrow, first slide only, 11px/0.12em tracked, `--ink-muted`.** Lesson name, shown once (already shipped) — omit on every screen thereafter.
3. **Speaker row, 48px avatar, 20px gap below the strip.** Flag + label under it; speech bubble only appears once the sentence starts (no bubble at rest, per L2b).
4. **The sentence card, full gutter width minus 20px each side.** White surface, 16px radius, 1px hairline border, `--shadow-card`, 20px internal padding (matches shipped tokens).
   - Line 1 (Spanish), `clamp(20–24px)`, 1.6 line-height: bold `--lesson-hl-es` piece being typed, muted-ink pieces to come, plain ink for finished/given pieces.
   - Line 2 (English), same size scale, growing left to right: inline `<input>` blanks sized `1ch` per answer character (min 3ch), 2px `--border` underline until answered, `--primary` text once filled — no separate "check" glyph per blank beyond the existing tint.
5. **One small purple check, 28px, top-right of the card on a white disc with `--shadow-card`** — the only whole-sentence success signal, appears once the full sentence is correct (already shipped in L2a/L2b; keep it capped at this one signal, resist adding a second).
6. **Primary action, appears centred below the card only once answered,** ≥52px tall, full-width minus the 20px gutters, solid `--brand-primary`, white 16–17px/500 text, 4–8px radius — "Continuar →". Hidden entirely (not disabled) when there is no action yet, so the footer is never a visible empty bar (already shipped).
7. **Nothing below that.** No footer nav, no tab bar, no ad, no secondary link — the whole vertical budget on a 390×844 phone is: strip (48) + eyebrow (~24, first slide only) + speaker row (~72) + card (variable, typically 220–320px for a one-to-two-line sentence) + button (52) + safe-area padding. That should clear comfortably within one viewport for a typical sentence.

### 4. What the completion screen should show

Per product-vision §8, this *is* the product, so keep it to exactly this stack, largest element first:

1. **The final English sentence, largest text on the screen** — bigger than the hero headline on the home page (e.g. 32–40px on phone, bold), because this is the "I said that" proof moment.
2. **Its Spanish line directly beneath, smaller (18–20px), `--ink-muted`.**
3. **One line of Spanish framing text** — "Esto ya lo puedes decir" (or module-completion equivalent) — 14–16px, not a paragraph.
4. **A visual divider or generous gap (48px), then the next lesson's promise**: its title/promise sentence + a "~2 min" estimate, presented as a tappable row/card, not a second hero.
5. **One CTA**: "Siguiente lección →", same 52px/full-width treatment as the practice screen's Continue button — visually identical component, so the learner's thumb never has to relearn where the button is.
6. **A quiet, small feedback link** ("¿Qué te pareció?") below the fold or as a text link under the CTA — never competing with the primary action for size or colour.
7. At **module completion**, replace step 1 with a short list of all the module's final sentences stacked (largest-first still, but each smaller than a single-lesson completion, since there are several) — this is the "screenshot" screen per product-vision §8, so give each sentence its own line with clear spacing (16–24px between), not a paragraph block.

No confetti, no badge, no XP tally, no streak — consistent with §2 above and with product-vision's explicit "evidence, not confetti."

### 5. Keeping purple vibrant without becoming heavy

- **Ratio, not intensity, is what reads as "premium."** Raycast is 98% achromatic with one accent; Stripe reserves its purple to action surfaces only. Apply the same ratio to our purple: roughly 90% white/near-white surface + ink text, ~5% tinted surface (`--surface-subtle`, `--canvas-warm`, already shipped), ~5% full-saturation purple (hero gradient, CTA, progress fill, success glyph).
- **Tint levels**: use full-saturation `--brand-primary`/`--brand-primary-vivid` only on (a) the home hero gradient, (b) the primary CTA fill, (c) the progress-bar fill, (d) the success check. Everywhere else purple should be a *tint* (10–15% mix into white, i.e. `color-mix(--brand-primary, white 85-90%)`) for things like a selected-state background or a subtle card accent — never a second full-saturation block competing with the CTA.
- **White does the heavy lifting.** Every content card (sentence card, explanation card, completion card) stays plain white with ink text — vibrancy comes from the *frame* (hero, header strip, progress fill, CTA) around white content, not from tinting the content itself. This is exactly the L0b decision already made ("the promise card inside the hero stays a plain white card... so the English sentence stays the loudest thing") — the synthesis here is: keep applying that rule everywhere new surfaces get added, not just the hero.
- **Avoid Memrise's failure mode**: multiple saturated hues (yellow + green + red icon accents) on one screen read as "aggressive" to its own users. If a second semantic colour is ever needed (e.g., a warm "hint" colour), keep it desaturated relative to the primary purple, and never let two full-saturation hues appear in the same viewport at once.

### 6. Motion budget

- **Durations**: 120–200ms for micro-interactions (button press, word settling into the sentence, focus ring), 240ms for the progress-bar fill (already shipped), up to 300ms for screen-level transitions (lesson slide advance, completion screen reveal). Nothing longer — avoid Duolingo's 420ms+ bounce-heavy button press.
- **Easing**: ease-out for anything appearing/advancing (feels responsive, not springy); no spring/bounce curves — those read as "gamified toy," the opposite of the Linear/Stripe/Raycast "precision" feel we're borrowing.
- **What gets to animate**: progress-bar width, the Continue button's appearance/fade-in, a finished word settling to its final weight/colour, the completion screen's sentence reveal (a single fade+slight-rise, not a bounce). What does *not* animate: no confetti, no particle bursts, no screen shake, no counter "ticking up" animation, no mascot reactions.
- **Reduced motion**: everything above collapses to instant/opacity-only under `prefers-reduced-motion`, already the global behaviour per L2a — keep any new motion gated the same way from the start rather than retrofitting.

## Notes on confidence and gaps

Duolingo, Stripe, and Raycast/Linear numbers came from fetched token-extraction pages (Dembrandt, webdesignhot DESIGN.md, shadcn.io) and are reasonably reliable, though these are third-party reverse-engineered tokens, not the companies' own published design systems — treat exact hex/px as indicative, not contractual. Notion, Headspace, Arc numbers are partially search-summary level (should be verified with a direct fetch before quoting a specific px value in a spec). Memrise, Busuu, Lingvist, Speak, Babbel are qualitative-only in this pass — their contribution here is "what to avoid" (Memrise) and "what's missing" (Speak's lack of a waiting-state animation is a documented user complaint, useful as a concrete anti-pattern for our own "checking..." states, if we ever add async feedback).
