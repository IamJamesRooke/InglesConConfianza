# Verb conjugation — the `conjugation:` facet

> **Superseded** by `verb-organization-plan-2026-09-05.md`, which is the
> current spec (adds the `sense:` facet, the full ser/estar/ir/tener/haber
> sense enumeration, and `scripts/audit-verb-conjugation.ts`). Kept for
> history — this page's 5-verb/1-sense-per-verb model is what the follow-up
> plan replaced.

Regular verbs stay **infinitive-only** in the catalog (`hablar → to speak`) —
conjugation is a rule a lesson author applies when writing content, not a
vocabulary item. That breaks down for **suppletive/irregular verbs**, where the
conjugated form shares nothing with the infinitive (`voy` ≠ `ir`, `soy`/`es` ≠
`ser`, `estoy`/`está` ≠ `estar`) and so isn't findable by searching the
infinitive when tagging a lesson's concepts covered.

## Scope (2026-09-05)

The five verbs whose present-tense forms are genuinely suppletive/irregular:
**ser, estar** (both "to be" — the classic am/is/are ambiguity), **ir**
("to go" / the going-to future), **tener** ("to have," possession), **haber**
("to have [done]," the perfect auxiliary).

One row per person, present tense only, for each:

| verb | 1sg | 2sg | 3sg | 1pl | 3pl |
|---|---|---|---|---|---|
| ir a [hacer algo] | voy | vas | va | vamos | van |
| ser [algo] | soy | eres | es | somos | son |
| estar [en un estado o lugar] | estoy | estás | está | estamos | están |
| tener [algo] | tengo | tienes | tiene | tenemos | tienen |
| haber [hecho algo] | he | has | ha | hemos | han |

Roles: 1sg/3sg core (what a beginner module says and hears most), the rest
supporting, except `haber` (present-perfect is past Module 1–2 scope) which
stays supporting throughout.

**Not in scope yet:** other tenses (preterite, imperfect, future) for these
five; other irregular/stem-changing verbs (poder, querer, decir, hacer, venir
— their conjugated forms still resemble the infinitive enough to type directly
into lesson content); `tener que` obligation forms (already covered by
existing `¿tienes que…?` question-frame concepts).

## `conjugation:` facet

New facet (`src/lib/curriculum/collections.ts`), controlled vocabulary in
`KNOWN_CONJUGATION_VALUES`: `present`, `irregular`, `1sg`/`2sg`/`3sg`/`1pl`/`3pl`.
Every tagged row also keeps `pos:verb` and its infinitive's `es:` lemma
(`es:ir`, `es:ser`, `es:estar`, `es:tener`, `es:haber`) so it groups with the
existing infinitive concept.

## Contrast

`contrast:soy-vs-estoy` on `soy [algo]` / `estoy […]` — ser (identity,
classification) vs estar (state, location), the two Spanish verbs that both
map to English "am." Only the 1sg pair is tagged; extend to es/está and the
other persons if it earns its keep.

## `/curriculum?topic=verbs`

Unlike Pronouns/Determiners/Interrogatives, this topic's `baseCollection` is
`pos:verb` (the whole verb catalog, ~600 rows), not a dedicated `topic:` tag —
most of it is correctly infinitive-only and shouldn't be forced into a closed
inventory. The facet buttons (`es:ser`, `es:estar`, `es:ir`, `es:tener`,
`es:haber`, `conjugation:1sg`, `conjugation:3sg`, confusions) are the useful
view: they zoom into the irregular conjugated forms. No `topic-audit.ts` spec
was added for the same reason — the "every row needs a subcategory" check that
works for the other topics would false-positive on hundreds of correctly
untagged infinitives.

## Provenance

Manifests: `curation-2026-09-05-{verbs-new,verbs-retag-voy,verbs-contrast}.tsv`,
plus the standalone unblock `curation-2026-09-05-voy-a-unblock.tsv` (added
`voy a [hacer algo]` first, before this batch, to unblock live lesson
authoring; retagged with `conjugation:` here for consistency).
