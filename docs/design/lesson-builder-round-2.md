# Lesson builder, round 2 — plan for owner agreement (2026-09-16)

> Status: **agreed by the owner 2026-09-16 (colour dot for levels); A and C started, B after A.** Written from the owner's screenshot of Confianza I
> with 31 Main teaching points and no lessons yet, plus the owner's two asks (group the
> teaching points by type; show each concept's level without clicking). Everything here
> is delegated; Fable reviews diffs and screenshots and gates merges.

## What the screenshot says

Thirty-one pills in one soup, all dashed because no lesson exists yet, long bracketed
labels taking the width of five short ones, eyebrows heavier than the pills, no level
visible, and the owner re-typing a list that already exists in the database as "Level 1".
The card is functionally right and visually noisy at exactly the moment the owner needs
it calm: while deciding what a module teaches.

## The work, grouped by session

### A. Syllabus card: structure and level (Opus, one session, branch `design/syllabus-groups`)

Opus because it is one dense component with several interacting rules and the owner will
judge it on sight.

1. **Group the Main and Review lists by part of speech**, derived from the concept's
   `pos:` collection (verified: every current syllabus concept has one; ~22% of the
   whole non-trash catalogue lacks one). Groups, fixed order: Pronouns · Verbs ·
   Connectors · Time, place and degree (adverbs, prepositions) · Words (nouns,
   adjectives, determiners, numbers) · Untagged. The lists stay flat arrays in the
   file; grouping is render-only; drag still reorders within the flat list. Freehand
   pills (no concept) go to Untagged. A quiet sub-eyebrow per group, only when the
   group is non-empty.
2. **Level on every pill, without clicking.** Owner's choice: a 6px colour dot at the
   pill's leading edge, one colour per level (reuse the existing `role-*` dot tokens
   from the Covers field), hollow for Unranked. Colour is never the only signal: the
   tooltip states the level and a legend line at the card's foot names each dot. Unranked is the nudge:
   "3 unranked" in the header summary so the owner sees curation debt at a glance.
3. **Quiet resting pills.** `is-uncovered` becomes a plain hairline outline; covered
   gets the success tint plus a small check; dashed is reserved for `is-missing`
   (Trash/gone). Bracket segments render lighter so the head words carry the eye.
   Eyebrows one step lighter. Progress bar hidden while the module has no lessons.
4. **"Copy as text" carries the groups and levels**, so the module brief reads like
   `docs/curation/level-1.md` and is what a future drafting agent receives.
5. **Level via the pill's quick-edit** already exists; no change.

Proof: before/after screenshots at 1280 and 760 with pills in several groups and
levels, one covered pill, one Unranked. Playwright: extend `geometry-corners` and add a
`syllabus-groups` spec (grouping order, level mark text, untagged bucket).

### B. Fill the syllabus from the database (Sonnet, after A merges, same branch lineage)

The owner is re-typing Level 1 by hand. A picker on the card: **"Add from Level…"** →
choose a level → a checklist of that level's concepts not yet in any module's syllabus
(course-wide, so Confianza II does not re-offer what I already claims), grouped the same
way as A, multi-select, "Add N to Main". Uses the existing search API pattern with a
role filter; no new tables. Sonnet: it is a list-and-add feature over known seams.

### C. Search ranking for conjugated forms (Sonnet, small, independent — can run now)

The curator verified: `estoy` now returns the generic `estoy → I am` first, but `estar
[en un lugar]` and `estar [haciendo algo]` land at #14/#15 behind fourteen unrelated
rows whose example merely starts with "Estoy". Rule to add in `concept-search-rank.ts`:
among example-only matches, prefer rows whose Spanish head word shares the query's first
three letters (`est…` → `estar`), then priority, then length. Unit tests only, plus the
existing typeahead spec.

### D. Curation follow-ups (already running in the Herdr `curator` session, Opus)

Applied: 47 rows edited, 67 to Trash, 18 double-object-pronoun rows at Level 1.
Approved and in flight: `para [hacer algo] → in order [to do something]`, singular
feminine pronouns, `level-1.md` label refresh. Held: 59 question-and-negation frames.

### Not in this round (say if you want them)

- Owner-authored dividers or numbering in the syllabus (rejected earlier).
- Grouping the lesson list itself, or the lesson's Covers field.
- Teacher notes UI on a lesson (data field exists).
- Course-level title and tagline in the file.

## Sequence and cost

C starts immediately (Sonnet, ~15 min). A starts on the owner's "go" (Opus, one
session, ~1 h). B after A merges (Sonnet, ~40 min). Fable runs the full suite and the
build once per merge. Each session: foreground checks only, targeted specs, screenshot
proof for anything visual.
