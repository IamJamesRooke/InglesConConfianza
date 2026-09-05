# Full audit — session log

**Do not read this file to find out what's left.** Run this instead —
it's cheaper than parsing a checklist and can't drift from the data:

```
cd web && npm run curriculum:audit:status
```

That prints: how many of the 656 facet-button units are fully reviewed,
overall role distribution vs. the guardrail in `full-audit-plan.md`, and the
next N incomplete units in priority order. State lives in the DB (the
`audit:reviewed` tag), not here.

This file is a short narrative log — one entry per session, for a human
skimming history, not a machine-readable state store.

## Log

- **2026-09-05, Phase 0** — scaffolding: `full-audit-plan.md` (rubric),
  this file, `full-audit-findings.md`, `audit:`/`audit:reviewed`/
  `audit:flagged` facet registered, `scripts/audit-status.ts` +
  `npm run curriculum:audit:status`. Commit `c44ad851`.
- **2026-09-05, Pilot (3 units)** — `imp:lets`, `topic:color`,
  `cognate:izar-to-ize`. ~10-15 min/unit including full apply/verify/test
  cycle; completeness check found real gaps in every single unit. Commits
  `0f5a4105`, `08003d4d`, `0757a5bd` (+ hash-fill commits).
