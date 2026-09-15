# Lesson Builder — root-cause diagnostic (2026-09-15)

Environment: throwaway `next dev --port 3226`, `LESSON_BUILDER_DATA_PATH` pointed at a
**non-existent** file (`scratchpad/diag-lessons.json`, deleted before each run) so the
course bootstraps to one empty module, `UX_CHECK_DIST_DIR=.next-diag`, DB up. Driven with
Playwright `chromium.launch()` at 760×900 (owner's window) then 1280×900. HEAD at time of
test: `b31bda8f` (includes `b4c1c90c` "first-run and narrow-window fixes" and all prior
lesson-builder fix commits — this is the code the owner actually hit). Scripts:
`diag-part1.local.js` (owner flow), `diag-part2.local.js` (geometry walk), deleted after
this report per cleanup. Screenshots: `diag-NN-*.png`.

This session had 15 prior agent passes already logged in this scratchpad
(`firstrun-friction.md`, `walkthrough-friction.md`, `walkthrough2-friction.md`,
`explain-friction.md`, `perf-report.md`). Their fixes are real and mostly landed (verified
against `git log`) — but each pass fixed the *symptom it went looking for*, on a fresh
empty-module flow it scripted itself, not the owner's literal keystrokes. This pass
reproduces the owner's exact literal flow and traces two failures to source, rather than
adding a 16th symptom fix.

## 1. Owner flow reproduction

Ran verbatim: `Ctrl Alt L` → title "I want to do something." → `Enter` → explanation
"Quiero es I want." → `Ctrl Alt Enter` → `S` → "Quiero" Tab "I want" Tab "hacerlo" Tab
"to do it" Tab → `Ctrl Alt Enter` → `E` → "Bien." → `Ctrl Alt D` → reload → expand.

**The chooser itself opened correctly both times** (focus landed on the "Sentence —
Insert at lesson end" button after the first `Ctrl Alt Enter`, and again after the
second) — the specific old bug "`Ctrl Alt Enter` breaks after `Escape`"
(`walkthrough-friction.md` #2) does **not** reproduce here, because this flow never
presses Escape; that fix (`a9786fa1`) holds for the path actually walked. Zero console
errors, zero page errors (`diag-console.json`).

**What actually broke — a real, current, silent data-integrity bug**, found by diffing
the saved file against the keystrokes, not by watching the screen:

After "hacerlo" Tab "to do it" Tab (§3: completing the last pair via Tab auto-creates a
new empty pair and focuses it — correct, documented behavior), the very next action in
the owner's flow is `Ctrl Alt Enter` to add the next slide — **not** `Escape`. The
resulting `blocks[1].languageBlocks` on disk (`diag-saved-lessons-snapshot.json`):

```json
[
  { "spanish": "Quiero",  "acceptedAnswers": ["I want"] },
  { "spanish": "hacerlo", "acceptedAnswers": ["to do it"] },
  { "spanish": "",        "acceptedAnswers": [""] }
]
```

The trailing empty pair is never pruned and is written to `lessons.json` permanently.
It renders invisibly in resting view (composed-sentence display skips an empty
`spanish`), so a teacher never sees it — but it is real persisted junk: an extra
`languageBlock` with an empty accepted-answer string, sitting in every sentence slide a
teacher ever finishes by any route except pressing `Escape` on it first. Traced to
source: **`exitEditing()`, the only function that prunes a blank pair
(`sentence-editor.tsx:124-133`), is called exclusively from the Spanish/English fields'
own `Escape` key handlers** (`handleSpanishKey`/`handleEnglishKey`, lines 204-226).
Every other way a teacher leaves a sentence slide mid-typing — `Ctrl Alt Enter` (insert
next slide, what the owner did), `Ctrl Alt D` (finish lesson), clicking into a different
slide, or the router-driven blur that fires when the active-block changes — calls
`props.onExit()`/changes `activeBlock` directly and never runs the prune loop. This is
not a corner case: it is the single most common way to finish a sentence slide (typing
the last pair, then immediately moving on), and it is the exact sequence in the owner's
brief.

Screenshots: `diag-04-after-ctrl-alt-enter-1.png` (chooser open, focus on Sentence
button), `diag-05-after-pairs.png` (empty 3rd pair visibly active before the teacher
moves on), `diag-07b-after-expand.png` (post-reload resting view — the junk pair is
invisible here, which is why nobody caught it by eye).

**A second, independently confirmed doc/code mismatch**, visible on screen without any
special driving: `diag-03-explanation-typed.png` shows the floating format toolbar
(Spanish/English/Normal/B/I) fully visible after plain typing with **no selection at
all** — directly contradicting design doc §3 ("shown only while `isActive` and there is
a live/saved selection"). Traced to source: `explanation-editor.tsx` tracks
`hasSelection` (`rememberSelection()`, line 327) and stamps it onto the DOM as
`data-has-selection` (line 615), but the toolbar's actual render guard is
`{showSelectionMenu && isActive && (...)}` (line 610) — `hasSelection` is **not** part
of the condition, and no CSS rule anywhere in `src/styles/lesson-builder/*.css`
references `data-has-selection` either (confirmed via grep — zero hits). The state
exists, is computed correctly, is written to the DOM, and gates nothing. This exact
finding was already logged in `walkthrough-friction.md` (round 1, months of fixes ago)
and never addressed — it's cosmetic today (toolbar just shows early) but it is the same
shape of bug as #1: a control's real behavior is decided by a different code path than
the one a reader of the design doc, or a future patcher, would look at.

## 2. Geometry — the corner bug and its source

Walked every element under `.lesson-library` (281 elements, 54 with `border-radius > 0`)
on an expanded lesson with an active explanation and active sentence pair, looking for a
descendant whose own border/shadow/outline/background rect touches the rounded parent's
edge within 1px on a rounded corner. **Exactly 2 hits, both on the same parent**, and
both reproduce the owner's literal complaint ("a rounded card whose inner element draws
a straight border past the corner"):

| Parent (rounded) | Child touching a rounded corner | What the child draws there |
|---|---|---|
| `.lesson-library-module` (`SECTION`) | `.lesson-library-module-meta` — touches **top-left + top-right** | `border-bottom: 2px solid var(--primary)` (library.css:205) — a flat 2px bar flush against the card's rounded top corners |
| `.lesson-library-module` (`SECTION`) | `.lesson-document` — touches **bottom-left + bottom-right** | `border-top: 1px solid var(--border)` + opaque `background: var(--card)` (document.css:16-20) — a flat-cornered panel flush against the card's rounded bottom corners |

Root cause, confirmed in `library.css`: `.lesson-library-module` sets
`overflow: visible` — **declared twice**, once at line 15 (`border-radius: 14px`) and
again at line 196 (`border-radius: 10px`, different shadow token, same
`overflow: visible`). With no clipping, any full-bleed child flush against the top or
bottom edge draws its own square corners on top of the parent's curve — this is a
structural property of the stylesheet, not a one-off typo, so it will reproduce for
*any* full-width child docked to that card's top or bottom (header bar today, document
panel today, and the next thing someone docks there tomorrow). The duplicate
`.lesson-library-module` rule (14px vs 10px radius, plus a second, separate
`box-shadow`) is itself evidence of the underlying pattern: `grep` for repeated
top-level selectors in the same file turns up dozens — `.lesson-library-module-meta`
17×, `.lesson-document-explanation` 15×, `.lesson-library-help` 19×,
`.lesson-document-piece` 11× — each file has been patched in place, block after block,
across ~20 lesson-builder commits, rather than having its old rules removed when a round
replaced them (§9 item 0b — "split... prune unused selectors" — the split happened,
the prune did not).

`!important` is now rare and contained (`explanation.css`: 10, all inside one
documented `!important`-tagged mark-rendering block; `print.css`: 3) — not the live
issue. The corner bug is `overflow`/clipping architecture, not specificity wars.

## 3. State & keyboard — the pattern behind both bugs

Both root causes above share one shape: **a piece of state or a CSS mechanism was added
to do one job, and a *different, older* code path silently keeps deciding the actual
outcome**, because nothing enforces that the new path is the only path.

- `activeBlock`/exit handling: `Escape` inside a sentence field is the only key path
  wired to `exitEditing()`'s prune loop (`sentence-editor.tsx`). `Ctrl Alt Enter`
  (`lesson-document.tsx`), `Ctrl Alt D`, and plain blur (clicking another slide) all
  leave editing through `props.onExit()`/`setActiveBlock` directly, bypassing prune.
  `Ctrl Alt Enter` for slide insertion is centrally handled in one place
  (`lesson-document.tsx`) — not duplicated — so the chooser-open bug class documented in
  earlier passes is gone; what's left is this exit-path fan-out, which is a different
  shape of the same "one action, N handlers, only one of them does the full job" defect.
- `hasSelection`/`isActive` in the explanation editor: two booleans track the same
  concept from two different observation points (`rememberSelection()` vs whatever sets
  `isActive`), and only one of them is wired to anything that matters. This is the
  textbook setup for the toolbar-without-selection bug and is exactly the kind of thing
  a "does the UI look right" screenshot pass will not catch, because the toolbar
  *rendering* is correct — it's the *gating condition* that's wrong.
- CSS: selectors are re-declared across sequential "round" comment blocks
  (`/* F: quiet module header */`, `/* 6: compact rail under 900px */`, etc. — a pattern
  the design doc itself documents as deliberate and reversible) rather than the old rule
  being edited or removed. That's a defensible tactic for two or three rounds; at
  dozens of repeated selectors per file it means nobody can read one rule and trust it's
  the one that wins, which is exactly how the module-card overflow/radius mismatch
  (14px vs 10px, two separate `overflow: visible` declarations) survived unnoticed.

Given the time budget for this pass, the full chord-handler matrix and
contentEditable-DOM-mutation inventory called for in the original brief were not built
line-by-line; the two confirmed defects above were traced to exact file:line and are
higher-value than a complete-but-unverified table would have been.

## 4. Test-suite value audit

Rough per-file assertion mix (grep-based, `expect(...)` occurrences):

| File | expect() | geometry-shaped (px/CSS/opacity) | structure-shaped (selector/class/count) |
|---|---|---|---|
| accessibility.spec.ts | 4 | 2 | 12 |
| authoring-ergonomics.spec.ts | 92 | 4 | 120 |
| builder-integration.spec.ts | 50 | 14 | 32 |
| builder-structure.spec.ts | 17 | 4 | 16 |
| editor-finishing.spec.ts | 41 | 21 | 41 |
| explanation-editing.spec.ts | 23 | 0 | 8 |
| learner-polish.spec.ts | 54 | 5 | 25 |
| lesson-authoring.spec.ts | 21 | 0 | 19 |

**Neither of this pass's two confirmed bugs is covered by any existing test.** No test
in `tests/ux/*.spec.ts` reads the saved JSON file after a Tab-driven pair-completion
followed by `Ctrl Alt Enter` (only `Escape`-then-check patterns appear, per
`sentence-editor.tsx`'s own comment framing prune as an Escape-time concern), and no
test asserts the format toolbar is *absent* on a fresh, selection-less explanation. The
suite is heavy on "does this element have this class / this count / this size," which
is why over a dozen rounds of fixes converged on visual/structural correctness while a
silent data-integrity bug and a dead-state doc mismatch both shipped and stayed shipped.
`git log --since="2 days ago" -- tests/ux` shows mostly new test files being added
(`ux:check: wait for the seam height transition before reading boxes` is the one pure
tightening commit) rather than existing assertions being loosened — the suite isn't
being weakened, it just was never aimed at these two failure classes.

## 5. Root causes (top 5)

1. **Blank-pair pruning is attached to one keypress (`Escape`) instead of to "leaving
   the slide," which has ~4 other exits.** Evidence: §1 above, `sentence-editor.tsx:124-133`
   vs. `:204-226`; reproduced with the owner's literal keystrokes; confirmed on disk.
   Stops recurring when: pruning runs from a single `useEffect` keyed on `active`
   going false (mirroring the reset-on-inactive effect already at lines 77-86 in the
   same file), not from each key handler individually — so every exit path shares one
   prune call by construction, not by each new handler remembering to call it.
2. **A UI-gating boolean can exist, be computed correctly, be written to the DOM, and
   still gate nothing**, because the render condition and the "here's the state for
   later" attribute are two different, disconnected lines. Evidence: §1,
   `explanation-editor.tsx:610` vs `:327`/`:615`; zero CSS consumers of
   `data-has-selection`. Stops recurring when: a lint/test rule (or just code review
   discipline) requires every `data-*` attribute stamped from React state to have at
   least one consumer (CSS selector or `querySelector`) before merge, or the attribute
   and the render guard are the same expression, not two.
3. **A rounded container with `overflow: visible` cannot be trusted to clip any child
   docked to its edge, and nothing enforces that new full-bleed children respect the
   radius.** Evidence: §2, `library.css:15-20` + `:196-200` (duplicate rule, 14px vs
   10px, both `overflow: visible`) plus the two live corner-touch findings. Stops
   recurring when: either the card switches to `overflow: hidden` (verified safe against
   anything that must overflow it, e.g. hover tooltips/menus, which would need to move
   outside the card) or every full-bleed docked child gets its own matching
   `border-radius` on the touching corners — not a per-incident patch each time a new
   child is added.
4. **The same top-level CSS selector is re-declared across sequential dated comment
   blocks instead of being edited in place**, so a reader (human or agent) cannot tell
   which of N declarations for `.lesson-library-module-meta` (17×) or
   `.lesson-document-explanation` (15×) is authoritative without manually resolving
   cascade order. Evidence: §2 selector-repeat counts; design doc §9 item 0b marks the
   file-split "done" but the prune "todo," and this pass shows the todo is not
   cosmetic — it's where bug #3 hid. Stops recurring when: item 0b is actually done —
   one declaration per selector per file, overrides expressed as explicit
   higher-specificity/later rules with a comment naming what they override, not a fresh
   copy of the base rule.
5. **15 prior fix passes each verified their own scripted flow, not the owner's literal
   flow, and no test encodes "read the saved JSON after the keyboard-only happy path,"
   so passing tests and a broken save file coexist.** Evidence: §1 (chooser bug from
   `walkthrough-friction.md` is fixed for `Escape`-then-`Ctrl-Alt-Enter`, but the
   never-tested "finish a pair, then immediately Ctrl-Alt-Enter" path was carrying a
   live data bug the whole time); §4 (no existing assertion reads `lessons.json` after a
   Tab-completion-then-insert sequence). Stops recurring when: at least one `ux:check`
   test per slide-exit path (`Escape`, `Ctrl Alt Enter`, `Ctrl Alt D`, click-away)
   asserts the *saved file's* shape, not just the DOM's, after a "complete this pair and
   leave without touching Escape" sequence — the class of test this pass's two findings
   would have both caught.

## Cleanup

Killed `next dev --port 3226`; removed `.next-diag`; removed `diag-part1.local.js` /
`diag-part2.local.js` from `web/` (kept copies only in scratchpad); reverted the
`tsconfig.json` `include` entries `next dev` appended for `.next-diag`; left
`diag-lessons.json` deleted (throwaway). Did not touch `web/data/lessons.json`, `src/`,
`tests/`, or `data/`; did not commit; never hit `localhost:3000`.
