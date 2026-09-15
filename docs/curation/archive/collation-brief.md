# Curriculum collation — brief for the curation session

Owner's goal (2026-09-15): the concept database must tell an AI (and the teacher) **what
to teach in which order** and **which examples of each pattern are enough**. The current
P1–P5 ladder encodes importance, which is not the same thing. This brief replaces it.

## Three axes

1. **Stage** — scaffolding order. A short ordered list (aim 12–20) of teaching stages
   derived from the method: e.g. `S01 querer + infinitive`, `S02 objects (algo, nada,
   cosa)`, `S03 object pronouns (lo, la, me, te)`, `S04 querer que + person + infinitive`,
   `S05 poder / tener que / ir a`, … Each concept gets exactly one `stage:NN` facet =
   the earliest stage at which it can be taught (its prerequisites are all earlier).
   Example: "I want you to do something" is `stage:04`, because it needs `S03`.
2. **Role** — coverage within a pattern. Exactly one of:
   - `role:exemplar` — one of the 3–5 concepts that *introduce* a pattern so the
     student learns the pattern exists (phrasal verbs: *to look for* vs *to look at*;
     cognates: *importante → important*, *posible → possible*).
   - `role:core` — must be known regardless of pattern (the verb spine, connectors).
   - `role:supplementary` — taught in advanced/supplementary modules.
   - `role:reference` — in the database for lookup; never in a lesson unless asked.
3. **Taxonomy** — the existing topic → family → group collections stay as the browsing
   structure and become the checklist: **every family needs ≥ 3 exemplars**, and the
   coverage page reports families whose exemplars have no stage yet.

Stages and roles are collection facets (`stage:`, `role:`), so **no schema change**;
the `collections.ts` registry gains the two facets. The old P1–P5 enum is retired once
every row has a `role:`.

## Process (for the curation session)
1. Read `AGENTS.md` (curriculum boundaries), `docs/curriculum-database.md`,
   `docs/teaching-methodology.md`, and the owner's two real lessons in
   `web/data/lessons.json` (they are stage 1–2 evidence).
2. Draft `docs/curation/stages.md`: the ordered stage list with a one-line definition
   and 3 example concepts each. **Owner approves before any DB write.**
3. Batches by family, ≤ 150 rows, one TSV manifest per batch with `stage`, `role`,
   one-line rationale; apply via the existing manifest scripts; snapshot export after
   each batch; owner spot-checks ~10 %. Do not run concurrently with owner edits.
4. Order of batches: verb spine first (querer, poder, tener que, ir a, hacer, saber,
   necesitar), then connectors (si, que, con, para, porque), then the families the
   first eight modules need; cognates and phrasal verbs get their exemplars chosen
   early and the tail marked `reference`/`supplementary` in bulk.
5. Model routing: a strong model drafts `stages.md` and the exemplar picks; Sonnet runs
   the batches; Haiku is fine for bulk `reference` tagging of long tails.

## What the lesson builder will read
`stage:` order and `role:exemplar|core` are what lesson drafting, auto-Covers, and the
coverage page consume. Nothing in the builder depends on P1–P5.
