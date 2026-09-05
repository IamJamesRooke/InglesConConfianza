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

