# Full audit — findings for the user

Open questions and every trash decision from the full-database audit
(`full-audit-plan.md`), logged here for review rather than blocking a session
on approval. Newest entries at the bottom. Format:

```
## YYYY-MM-DD — <facet-button unit>
- **[trash|flagged]** `spanish` → `english` (id) — one-line reason.
```

## 2026-09-05 — `cognate:izar-to-ize`
- **[note]** Two false friends found and added while checking completeness:
  `realizar` → "to carry out" (NOT "to realize" — that's `darse cuenta`,
  already in the DB) and `actualizar` → "to update" (NOT "to actualize").
  Both tagged `cognate:false-friend` + `contrast:confusable` +
  `contrast:<word>-vs-<word>`. Worth a dedicated sweep later: how many other
  `-izar`/`-ar` verbs in the DB have a tempting-but-wrong `-ize`/`-ate`
  cognate translation that isn't flagged?

## 2026-09-05 — `grammar:possessive-pronoun`
- **[flagged]** Only singular-object forms exist (`el mío`/`la mía`, `el
  tuyo`/`la tuya`, `el suyo`/`la suya`, `el nuestro`/`la nuestra`). Plural-
  object forms (`los míos`/`las mías`, `los tuyos`/`las tuyas`, `los suyos`/
  `las suyas` [it already has one "theirs" masc-plural sense but no
  fem-plural or "yours-formal" sense], `los nuestros`/`las nuestras`) are
  missing entirely — roughly 8 rows. Scoped out of the audit pass itself
  (real content-authoring, not a quick fix) — worth a small dedicated add
  later, following the `mi`→core/`mis`→supporting pattern already
  established for determiners.

## 2026-09-05 — `grammar:demonstrative-pronoun`
- **[flagged]** Plural demonstrative *pronouns* (standalone "these/those
  ones," e.g. "Quiero estos, no esos.") are missing entirely — only the
  singular pronoun forms (este/esta/ese/esa/aquel/aquella → "this
  one"/"that one") and the neuter forms (esto/eso/aquello) exist. The
  plural *determiner* forms (estos/estas/esos/esas/aquellos/aquellas) do
  exist but only as `grammar:demonstrative-determiner`, not as standalone
  pronouns. ~6 rows to add later.

**Recurring pattern across 4 facets so far** (subject-pronoun, prepositional-
pronoun, possessive-determiner, reflexive-pronoun, demonstrative-pronoun):
a gender/number/formality variant gets tiered 1-2 steps below its exact
structural sibling with no apparent reason (`sus`, `a ellas`/`para ellas`,
`se`→yourselves, `aquella`→that one). This looks like leftover noise from
whatever originally assigned per-row roles rather than a deliberate
distinction — worth watching for in every remaining pronoun/determiner-style
facet with gendered or formal/informal pairs.

