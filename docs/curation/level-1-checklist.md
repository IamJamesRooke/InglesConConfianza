# Level-1 checklist — brainstorm for the lesson builder (2026-09-15)

Owner's ask: "an easy way to have a list of what I've taught and what still needs to be
taught." The MVP is done when every Level-1 item is covered by some lesson.

## The mechanics (no new data structures)

- **What must be taught** = rows with `curriculumRole = P1`, grouped by island
  (`es:` / `grammar:` collection) so the list reads *querer: 2 · ser: 6 · connectors: 9*.
- **What has been taught** = rows referenced by any lesson's *Covers* list
  (`lessons.json → lessons[].concepts[].conceptId`). Already exists; the builder writes it.
- **Checklist** = the first set with a tick wherever the second set contains the row.
  Nothing new is stored; it's a join the page computes.

## Where it shows up

1. **Module view (course binder):** one line under the module name —
   `Level 1: 14 / 101 rows · 12 / 58 items` with a progress bar. That's the MVP gauge.
2. **A "Level 1" panel in the builder** (toggle, `Alt+L`?): the island list, each row
   ticked ✓ with the lesson that covers it, or ○. Click ○ → the row is inserted into the
   current lesson's Covers, so writing a lesson *is* ticking the box.
3. **Curriculum page:** the same tick column when filtered to a level, so the owner can
   browse an island and see what's untaught.

## "What should I teach next?"

The untaught rows, ordered by the few real dependencies. For Level 1 there are only
three worth encoding, and they can live in the checklist doc rather than the DB:
- *can* (17) after *be able* (16)
- *going to* (21) after *I am / you are* (18, 19)
- *want to know if* (15) after *if* (34)
Everything else in Level 1 is order-free — the owner's judgement.

## Promote / demote while authoring

While picking concepts for a lesson, a row that isn't Level 1 but should be (or the
reverse) gets its level changed in place: a keyboard action on the concept row, written
through the same path as `curriculum:roles:apply` (one-row manifest, appended to a log),
so the snapshot export and `db:verify` stay truthful. The checklist updates immediately.

## Out of scope for the MVP

Per-item dependency graph over 4,000 rows · Levels 2+ (their lists don't exist yet) ·
spaced-repetition scheduling · any change to `curriculum_concepts`' shape.
