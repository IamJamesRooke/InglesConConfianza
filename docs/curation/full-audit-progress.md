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
- **2026-09-05, Pronouns + Determiners + Interrogatives + Questions &
  Negation + Imperatives & Commands, all complete** — full per-row review
  (5-point checklist) for every grammar-facet unit on these five topic
  pages. Found and fixed a recurring systemic bug (gender/number/formality
  sibling forms tiered inconsistently for no reason — confirmed in 6+
  facets, logged in `full-audit-findings.md`), several copy-pasted/
  mismatched example sentences, mistagged lemmas, and two content gaps
  left `audit:flagged` for the user (possessive/demonstrative-pronoun
  plural forms, a definite-article headword/example mismatch needing a
  real content decision). Commits `9e2b0994`..`3d956b56` (many, one per
  facet unit — see individual commit messages for detail).
- **2026-09-05, Nouns page started** — switched to a lighter mechanical
  bulk-check pass for the large concrete-noun facets (duplicate-headword
  check, missing-example check, headword/example-mismatch check) since
  these don't carry the grammatical subtlety of the pronoun/determiner
  facets. Cleared `gender:masculine` (216), `gender:feminine` (217, found
  and fixed 2 genuine duplicate/mistranslated rows), `gender:common`/
  `gender:invariant`/`gender:neuter` (40, fixed an "inglés" example that
  demonstrated an unrelated idiom instead of the language sense), and 7
  small `topic:*` noun-theme facets (51 rows, fixed a "se fue la luz"
  example that was about something else entirely). Commits `312b25d8`,
  `9b423a49`, `09347972`, `eaf3c796`. Next up: the two large noun-theme
  facets `topic:time` (142 left) and `topic:abstract-quality` (213 left),
  then the rest of the Nouns page's smaller topic: facets, then
  Adjectives.
