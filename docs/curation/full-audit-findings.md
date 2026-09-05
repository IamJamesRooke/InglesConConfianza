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

