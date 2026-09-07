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
facet with gendered or formal/informal pairs. Confirmed again in
`grammar:subordinate-subject-pronoun` (nosotros/ellos demoted vs. yo/tú/él/
ella, all fixed) — now 5 facets, treat as a known systemic issue, not a
coincidence.

## 2026-09-05 — `grammar:exclamative`
- **[flagged]** The "¡Qué...!" exclamative family is well covered, but
  "¡Cuánto/a...!" exclamatives ("¡Cuánto te quiero!" = "How much I love
  you!") — a genuinely common everyday exclamative pattern distinct from
  qué — don't exist at all. Small addition for later (1-2 rows).

## 2026-09-05 — `grammar:definite-article`
- **[flagged]** Two rows (`gustarle los gatos específicos a alguien` →
  "[somebody] likes the specific cats"; `necesitar la información específica`
  → "to need the specific information") appear to be reaching for a real
  and important point — Spanish uses the definite article for *generic*
  reference where English uses none ("Me gustan los gatos" = "I like cats,"
  not "I like the cats") — but the headwords say "específicos"/"específica"
  (specific) while the examples demonstrate *possessive* specificity
  ("Laura's cats," "the document's information") instead. Headword and
  example are teaching different things. Needs an actual content decision
  (rewrite to demonstrate generic vs. specific reference contrastively, or
  reframe entirely) rather than a mechanical fix — left both tagged
  `audit:flagged`, not `audit:reviewed`.
- **RESOLVED 2026-09-07 (taxonomy-cleanup Batch 9 + P2-13):** both garbled
  rows were moved to `trash` and replaced with a clean generic-article
  concept, `los [sustantivos] (en general) → [nouns] in general`
  ("En general, me gustan los gatos. / In general, I like cats."). The
  stale `audit:flagged` tags were removed in P2-13. Track B flagged count
  is now 0.

