# Kickoff prompt: fold conjugated rows into their infinitive concepts

> Paste this into a fresh **Opus** session (judgement-heavy, hundreds of rows). Run it
> as its own session, never alongside a live authoring session that writes the
> database, and never while another curation batch is open. Written 2026-09-16 after
> the owner hit "estoy [haciendo algo]" in the syllabus typeahead.

---

You are curating the PostgreSQL curriculum of Inglés con Confianza (repo at
`/data/MEGA/Projects/InglesConConfianza`, app in `web/`). Read first, in this order:
`AGENTS.md` (curriculum boundaries), `docs/curation/README.md` (manifest workflow and
naming), `docs/curation/level-1.md` (the spine and the infinitive rule), and the
`curriculum_normalize_infinitive` memory note if it is in your context.

## The rule you are applying

A concept is the reusable construction, stored as an infinitive with bracketed
placeholders: `estar [en un lugar] → to be [at a place]`, `estar [haciendo algo] → to be
[doing something]`, `ser [una identidad] → to be [an identity]`, `tener que [hacer algo]
→ to have to [do something]`. A conjugated form (`estoy`, `soy`, `tengo`, `quiero`,
`puedo`…) is never a concept of its own; it is at most the example sentence under the
infinitive row. Lessons show the conjugated form; the database stores the infinitive.

Only exception, owner-approved: `puedo → can` (`0zuw37lnfv`) stays as a row because the
lesson teaches *can* as the surprise right after *poder → to be able to*. Do not
generalise from it.

## What to do

1. **Inventory.** Query every non-Trash row whose Spanish field begins with, or is, a
   conjugated first- or second-person form (yo / tú / usted) of a verb, including
   reflexive and bracketed variants (`estoy [en un estado o lugar]`, `me gusta [algo]`
   is NOT conjugated for this purpose: it is the fixed construction, leave it). Use
   `npm run curriculum:sources:query` or a read-only Prisma script under
   `web/scripts/`; do not write yet. Expect a few hundred rows. Group them by infinitive.
2. **Decide per group,** with a one-line reason each:
   - infinitive row exists with the same bracket sense → move the conjugated row's
     example (or the row itself as the example) onto the infinitive row if that row's
     example is weaker, then send the conjugated row to `Trash` (never hard-delete);
   - infinitive row exists but the conjugated row carries a *different* sense →
     create the missing infinitive sense (`curriculum:concepts:add`), then trash the
     conjugated one;
   - no infinitive row exists → rewrite the row in place to the infinitive
     (`curriculum:concepts:apply`), demoting the sentence to the example;
   - genuinely fixed expressions where the conjugated form is the unit (`no sé`,
     `¿cómo estás?`-type social formulas) → leave, list them for the owner.
   Keep the bracket conventions consistent with the specs in `docs/curation/specs/`.
   Preserve collections (merge, never remove) and the row's level: if the conjugated
   row was P1 and the infinitive is Unranked, the infinitive becomes P1.
3. **Manifests, not ad-hoc writes.** Produce reviewed TSVs named
   `curation-2026-09-16-infinitive-<batch>.tsv`, dry-run first, show the owner the
   diff counts and ten representative lines per batch, then `--apply` batch by batch
   with `npm run curriculum:apply … --apply` (it re-exports the snapshot and runs the
   parity checks). One commit per batch; move applied manifests to
   `archive/manifests/`.
4. **Verify the trigger case:** after applying, a search for `estoy` in the lesson
   builder typeahead must offer `estar [en un lugar]` and `estar [haciendo algo]`, not a
   conjugated row (the typeahead also matches example sentences, so the example under
   each infinitive row should use the first person: `Estoy en casa.` / `I'm at home.`).
5. **Report** what changed (counts per decision type), what you left for the owner,
   and any Level 1 items whose rows moved.

Do not touch `web/data/lessons.json`, the lesson builder code, or any row's level
outside the rule above. Run every check in the foreground with a timeout.
