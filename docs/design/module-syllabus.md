# Module syllabus — spec for the lesson-builder agent (2026-09-15)

## Why

The course is a sequence of **modules**. The teacher (or an AI drafter) must always know
the scope: what this module introduces, what it brings back, and what it must not wander
into. Today that knowledge is in the owner's head. This feature puts it in the builder,
derives everything it can from the lessons themselves, and keeps intent and reality side
by side so drift is visible.

Decisions already made (owner, 2026-09-15):
- Concept **levels are retired**. All rows are `Unranked` (commit `c298024d`); the enum
  stays but nothing depends on it. Modules are the ranking.
- **Lessons are the clock; modules are the days.** Staleness is counted in lessons.
- **Naturalness beats scope.** Out-of-scope words are flagged, never blocked.
- One concept = one Spanish → one English, infinitives only; rules (contractions, *to*
  after *want*) are taught in explanations and are not concepts.

## Data (in `web/data/lessons.json`; no database change)

```jsonc
"modules": [{
  "id": "module_…", "name": "Module I", "kind": "course",
  "lessonIds": ["lesson_…"],                       // existing, ordered
  "syllabus": {                                      // NEW
    "main":   [{ "id": "syl_…", "conceptId": "w7bu9jslac", "label": "querer [algo]" }],
    "review": [{ "id": "syl_…", "conceptId": "3wtzllym25", "label": "saber [algo]" }]
  }
}]
```

- `main` is ordered (intended teaching order). `review` is a set. Items share the shape of
  `lessons[].concepts[]`. No duplicate `conceptId` within a module's syllabus. Modules
  without `syllabus` load as `{ main: [], review: [] }`.
- **Nothing else is stored.** Coverage, "also taught", "reviewed", the known set, review
  priority, warnings, progress — all derived at read time from module order, lesson
  order, `syllabus`, and `lessons[].concepts` (Covers).

## The four lists

| list | who fills it | meaning | importance |
|---|---|---|---|
| **Main teaching points** | owner | key concepts introduced for the first time in this module | 3 |
| **Review plan** | algorithm proposes, owner prunes/adds | concepts from earlier modules to bring back | 2 |
| **Also taught** | derived | concepts a lesson in this module covered for the *first time ever* that are not main points (*arete*, *comer*) | 1 |
| **Reviewed** | derived | concepts a lesson in this module covered that had been introduced earlier, whether or not on the review plan | — |

"First time ever" = no lesson earlier in the course (earlier module, or earlier lesson in
this module) has it in Covers.

Learner-facing copy comes from these: "What you will learn" = main + also taught;
"You'll also practise" = reviewed.

## Derivations (one pure module, `web/src/lib/lesson-builder/syllabus.ts`)

Inputs: `modules` (ordered), `lessons` (ordered per `lessonIds`), a concept lookup.

- **Course timeline**: lessons numbered 1…N across modules in order. `firstTaught[c]`,
  `lastTaught[c]`, `modulesCovering[c]` (distinct modules), `deliberate[c]` = highest
  importance any syllabus ever gave it (3 main, 2 review, else 1).
- **Known set at lesson k** = every concept in Covers of lessons 1…k−1.
- **Coverage** of a syllabus item = some lesson in this module has it in Covers →
  chip lit, with the covering lesson name(s).
- **Also taught / Reviewed** per module, as defined above.
- **Review priority** for a module starting at lesson k, for every concept taught before k:
  ```
  interval   = 5 × 2^(modulesCovering − 1)          // lessons; doubles per module (Anki-like)
  staleness  = k − lastTaught                        // lessons since last covered
  foundation = 1 + (M − firstModule) / M             // earlier first module → slightly higher
  priority   = deliberate × foundation × staleness / interval
  ```
  Sorted descending; the top 10 are the proposed review plan. The two constants
  (`5`, doubling) live at the top of the file with a comment; the owner tunes by feel.
  Worked check (must hold in a test): *querer* (main in M1, 1 module, 20 lessons ago)
  outranks a word covered in 7 modules 20 lessons ago, and outranks an incidental word
  covered 3 lessons ago.
- **Warnings** (recomputed on every change, including reorders):
  - *not introduced yet*: a lesson covers a concept that is not in its known set and not a
    main point of its own module → mark on the slide/lesson and a count in the module header.
  - *not new*: a main point already taught in an earlier module → suggest moving to review.
  - *never taught*: a review item with no earlier coverage → suggest moving to main.
  - *missing*: a syllabus or Covers item whose concept is Trash or absent → red chip.
- **Module done** = every main point and every review-plan item lit. Course progress =
  modules done / total.

## UI (`/admin/lesson-builder`, course binder)

1. Module header gets a collapsed **Syllabus** panel: two authored tabs (**Main teaching
   points**, **Review**) using the existing concept picker (search, suggestions, Alt
   shortcuts per `keymap.ts`), and two read-only lists (**Also taught**, **Reviewed**).
   Summary line always visible: `Main 5/12 · Review 3/6 · Also taught 4 · ⚠ 2`, with the
   thin progress bar used on `/admin/curriculum`.
2. Chips: green + lesson name on hover when covered; grey when not; red "missing".
   One-click **promote** from Also taught → Main.
3. Review tab opens with the algorithm's top 10 as suggestions (dimmed, "+" to accept);
   Module 1 says "Nothing to review yet".
4. In a lesson's Covers picker, suggestions that are main/review items of this module
   and not yet covered carry a small marker ("in syllabus"). Words outside the known set
   show the soft "not introduced yet" dot — informational only.
5. **AI brief**: a "Copy module brief" action produces the text a drafter needs — main
   points in order, review plan, known set at the module's start, the naturalness policy
   ("prefer the known set; if a sentence needs an outside word, use it and mark it as a
   context hint"). Same function feeds a future auto-draft call; keep it pure.
6. **Backup**: Export (download `lessons.json` as a dated file) and Import (validate,
   show a diff summary — modules/lessons added/removed/changed — then replace). Admin only.
7. `/admin/curriculum`: replace the level filter's meaning with **used in a module /
   never used** (derived from Covers); detail panel shows "Main point of Module I" /
   "Reviewed in Module III". Keep the control's look; keep the blue theme; no redesign.

## Tests

- Derivations: known set, first-time detection, also-taught vs reviewed split, coverage,
  the three worked review-priority checks, each warning type, "done", module reorder
  recomputes warnings (a concept becomes not-introduced-yet after a reorder).
- Reducer: add/remove/reorder main items, accept/prune review suggestions, promote,
  undo; label snapshots; loading a file without `syllabus`.
- Import/export round-trip; import rejects malformed files without touching the store.
- Existing `test:unit` and `db:test` stay green; `tsc --noEmit` clean.

## Out of scope

Learner-facing review, spaced repetition for students, any change to
`curriculum_concepts`, lemma grouping in the review list (owner wants rows explicit).

## Delegation

Sonnet 5 for all of it, in this order, one commit each: (a) `syllabus.ts` derivations +
tests, (b) data shape + reducer + migration, (c) Syllabus panel, (d) lesson-picker
markers + warnings, (e) AI brief + import/export, (f) `/admin/curriculum` used/never-used.
Fable/Opus reviews only (a)'s worked examples and (c)'s screenshot.

---

## Paste-ready prompt for the lesson-builder agent

> Implement `docs/design/module-syllabus.md` end to end in the lesson builder. Data:
> `modules[].syllabus = { main: [], review: [] }` in `web/data/lessons.json`, items shaped
> like `lessons[].concepts[]`; everything else (coverage, also-taught, reviewed, known set,
> review priority, warnings, done) is derived in a pure module
> `web/src/lib/lesson-builder/syllabus.ts` with the formula and constants from the spec;
> no database change. UI: a collapsed Syllabus panel per module with two authored tabs
> (Main teaching points, Review — the review tab proposes the top 10 by priority) and two
> derived lists (Also taught, Reviewed), summary line + thin progress bar, green/grey/red
> chips, one-click promote, "in syllabus" markers and a soft "not introduced yet" dot in
> the lesson Covers picker, a "Copy module brief" text export, and lessons.json
> Export/Import with a diff summary. Then switch `/admin/curriculum`'s level filter to
> "used in a module / never used". Keep the blue theme and existing layout; Alt-modifier
> shortcuts per `keymap.ts`; admin chrome in English. Work in the order and commit
> granularity given under "Delegation"; tests as listed; report ≤15 lines per commit.
