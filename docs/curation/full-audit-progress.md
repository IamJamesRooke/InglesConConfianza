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
  `9b423a49`, `09347972`, `eaf3c796`.
- **2026-09-05, Nouns page complete + Adjectives page complete** —
  finished `topic:time` (130), `topic:abstract-quality` (213, found 3
  headword/example mismatches including one mislabeled ser/estar-listo
  duplicate), and the last 5 small Nouns topic facets (14). Then the
  whole Adjectives page: `grammar:ser-adjective` (57, fixed 3 placeholder
  "examples" that were just the headword repeated), `grammar:estar-
  adjective`/`grammar:tener-adjective` (25, fixed 2 more placeholders +
  1 duplicate), the `degree:*` comparative/superlative facets (32, found
  a real tag-membership bug — 4 rows contradicted their own
  sound:comparison-pattern-one-syllable tag by being filed under
  comparative-more/superlative-most instead of -er/-est), and the
  Adjectives topic: facets (52). Commits `f2b97899` through `b6cf2e69`.
- **2026-09-05, Adverbs page complete + Numbers page complete +
  Connectors page complete** — `grammar:frequency-adverb`/`manner`/
  `intensifier` (25, fixed 4 placeholder examples), `topic:location`
  (37, fixed a true duplicate + 2 placeholders), `topic:cognate` (348,
  the single biggest facet-button unit in the DB — clean aside from 1
  placeholder; confirmed the 4 "opaque-gloss" core rows, e.g.
  decir/tener, are correctly categorized, not a membership error),
  `adv:possibility`/`degree`/`habitual`+`grammar:addition` (20). Then
  Numbers' one remaining facet (6) and the whole Connectors page (79,
  fixed 4 more placeholders). Commits `f0437dfa` through `0c50486d`.
  Next up: Prepositions (3 tiny facets), Expressions (several small
  expr: facets), then Collocations, Verb Patterns, Verb-Forms,
  Transformations, the two Mappings pages, Phrasal Verbs — see
  `npm run curriculum:audit:status` for the live list.
