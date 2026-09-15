# Module syllabus — brief for the lesson-builder session (2026-09-15)

Owner decision: **the course is organised by modules, and each module carries its own
list of mandatory concepts.** Levels on concepts are retired (all rows reset to
`Unranked`; the enum stays, unused). "What must be taught" is a property of a module,
not of a concept. Anything a lesson teaches beyond the module's list is bonus.

Paste-ready prompt for the builder agent is at the bottom.

## Data (in `web/data/lessons.json`, the builder's store — no DB change)

```jsonc
"modules": [{
  "id": "module_…", "name": "Module I", "kind": "course",
  "lessonIds": ["lesson_…"],
  "requiredConcepts": [                      // NEW — same shape as lessons[].concepts
    { "id": "module_concept_…", "conceptId": "w7bu9jslac", "label": "querer [algo]" }
  ]
}]
```

- `requiredConcepts` is ordered (teaching order the owner intends); duplicates by
  `conceptId` are invalid; the label is a snapshot like in lessons.
- **Coverage is derived, never stored:** a required concept is *covered* when any lesson
  in `lessonIds` lists that `conceptId` in its `concepts`. Bonus = concepts in the
  module's lessons that are not in `requiredConcepts`.
- Nothing is written to `curriculum_concepts`. No "modules taught" table. If a later
  page needs "required by which module?", it reads lessons.json server-side, exactly as
  `/admin/curriculum`'s taught/untaught column already does.

## UI (course binder, `/admin/lesson-builder`)

1. **Module header → "Syllabus" section**, collapsed by default, above the lessons.
   Same concept picker as a lesson's Covers (search, suggestions, keyboard flow, Alt
   shortcuts per the existing keymap). Items render as the existing concept chips.
2. **Each chip is lit** when covered: green check + the covering lesson's name on
   hover; grey when not. A one-line summary in the module header: `Syllabus 6 / 14
   covered` with the thin bar already used on `/admin/curriculum`.
3. **Bonus line** under the syllabus: "Also covered in this module: …" listing lesson
   concepts not in the syllabus (chips, dimmer), so bonus teaching is visible.
4. **From a lesson:** the lesson's Covers picker shows a small marker on suggestions
   that are in the module's syllabus and not yet covered — the natural "teach this
   next" hint. Picking one in a lesson lights it in the syllabus (derived).
5. **From `/admin/curriculum`:** the row detail panel gains "Required by: Module I
   (not yet covered)" — read-only, computed.
6. Keep the existing blue theme; no redesign. Admin chrome in English.

## Rules the picker must respect (from curation)

- One Spanish → one English per concept; infinitives only; compositional phrases are
  not concepts (docs/curriculum-database.md §Normalization). The picker offers
  what's in the DB; it never creates rows.
- Rules (contractions, *to* after *want*, object-pronoun position) are taught in the
  lesson's explanation and are not concepts — they don't appear in a syllabus.

## Tests

- Unit: coverage derivation (required ∩ union of lesson concepts), bonus derivation,
  duplicate rejection, module with zero lessons → 0/N.
- Reducer: add/remove/reorder syllabus items; label snapshot; undo.
- Migration: modules without `requiredConcepts` load as `[]` (existing file).

## Out of scope

Levels, `/admin/curriculum` level filter behaviour (leave as is; harmless), spaced
repetition, learner-facing anything.

---

## Prompt for the builder-session agent

> Implement the **module syllabus** in the lesson builder per
> `docs/design/module-syllabus.md`. Data: `modules[].requiredConcepts` in
> `web/data/lessons.json`, same item shape as `lessons[].concepts`; coverage and bonus
> are derived from the module's lessons' Covers, never stored; no database change.
> UI: a collapsed "Syllabus" section in the module header with the existing concept
> picker; chips light green when a lesson in the module covers them (lesson name on
> hover); header summary `Syllabus X / N covered` with the thin progress bar; an
> "Also covered" line for bonus concepts; a marker on lesson-picker suggestions that
> are required-but-uncovered; a read-only "Required by" line in `/admin/curriculum`'s
> detail panel. Reuse the join in `web/src/lib/curriculum/level-checklist.ts` (or
> generalise it) rather than writing a second one. Keep the blue theme; no redesign;
> Alt-modifier shortcuts per `keymap.ts`; admin chrome in English. Tests as listed in
> the doc. Commit per sub-task with `Co-Authored-By`. Report ≤15 lines.
