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
- **2026-09-05, Prepositions + Expressions + Collocations + Verb
  Patterns pages all complete** — Prepositions (5) + Expressions (39,
  found a real completeness gap: the standalone answer word "no" didn't
  exist in the DB at all, added it as core alongside promoting "sí" ->
  "yes" from reference to core). Collocations (33, clean). Verb
  Patterns in full: 6 small construction: facets (31), the 3 large
  followed-by-infinitive/gerund facets (102, found a true duplicate
  "intentar" row), and the remaining 7 facets incl. going-to and
  passive (47, fixed a mistranslated "tocarle a alguien" that had
  copied an unrelated sibling's gloss). Commits `70385ba6` through
  `2230a3c3`.
- **2026-09-05, Past-Tense & Past-Participle Formation page complete +
  Transformations page complete** — bulk mechanical pass over both
  (already-normalized) large pages: all 52 `sound:*` irregular/regular
  verb-form facets (382 rows — confirmed the many duplicate-headword
  groups are legitimate spelling variants: burned/burnt, dreamed/
  dreamt, proved/proven, etc.) and all 44 `morphology:*` derivational
  facets (251 rows — duplicates here are -ward/-wards variants). No
  fixes needed on either page. Commits `845f0183`, `27c81a1e`.
  Next up: the two Mappings pages (`topic:multi-sense` and
  `topic:en-multi-sense`) and Phrasal Verbs — see
  `npm run curriculum:audit:status` for the live list.
- **2026-09-05, Spanish-to-English Mappings page, in progress** —
  working through the `es:*` lemma facets one verb at a time (this page
  alone has ~1900 rows across both Mappings pages combined, by far the
  largest remaining body of work). Confirmed the recurring person-
  conjugation demotion bug a 3rd time in `es:tener` (8 rows promoted to
  core) after fixing it in es:ser/es:estar earlier — this looks like a
  systemic issue worth checking in every remaining core verb lemma
  (haber checked clean, no bug there). Also fixed two content bugs:
  "hacer acordar" (es:hacer) and "tocarle a alguien" (Verb Patterns,
  earlier) both had examples/glosses that didn't match their own
  headword. Done so far: es:ser (42), es:estar (37), es:poner (63,
  clean — an extensive well-built phrasal network), es:tener (30),
  es:poder (28, clean), es:hacer (30), es:dar (42, clean), es:haber (31,
  clean), es:ir (11, clean). Commits `0c313ed4` through `43f34b4a`.
  Next: es:decir, es:de, es:en, es:pedir, then continue down the
  priority list — there are roughly 300+ more es:/en: lemma facets
  after that. This will span many more sessions; the person-
  conjugation-tier check is now a standard part of the 5-point
  checklist for every verb lemma facet.
- **2026-09-05, continued** — es:decir (15, clean), es:de + es:en (41
  rows — found the entire es:en facet had placeholder examples, every
  "en X"/"at/in/on X" location phrase just repeated its own headword
  with no real sentence; wrote one for each). That discovery prompted
  a **global placeholder sweep** across all 938 remaining unreviewed
  concepts (not scoped to one facet) — found only 24 more elsewhere in
  the whole DB (mostly bare adverbial/prepositional phrases like "la
  tarde," "después de," "con"), fixed all of them. This means the
  placeholder-example defect is now fully cleared database-wide, not
  just in audited facets — worth re-running a quick placeholder check
  like this periodically as more of the DB gets reviewed, in case any
  slip through in still-untouched rows. Commits `ac9eb813` through
  `d399da7f`.
- **2026-09-05, Verbs page restructured** — user flagged that the
  "Verbs" page (pos:verb, ~2,000 concepts) only had 8 facet buttons
  (5 core irregular verbs + two arbitrary conjugation:1sg/3sg person
  buckets covering 26 rows) leaving ~1,800 verbs with no browsable
  subtopic and invisible to Track A. Fixed by exposing the es:<lemma>
  tags every verb already carries as ~185 alphabetical buttons (>=2
  concepts each, filtered to exclude ~30 tags that named a
  non-infinitive word), pinned ser/estar/ir/tener/haber first, added a
  topic:verb-other "More verbs" catch-all (304 one-off-lemma rows,
  mirroring sound:reviewed on Verb-Forms), dropped conjugation:1sg/3sg,
  and added "verbs" to audit-status.ts's ORDER (it was missing
  entirely). Commit `8c1782d3`. This is now the biggest page in the
  audit (~1,700+ rows across 185 lemma facets) and comes right after
  Adverbs in priority — the es:pedir/dejar/hablar/etc. work from the
  Spanish-to-English Mappings page overlaps with it (same es:<lemma>
  tags), so progress there carries over automatically. Next: es:abrir,
  then alphabetically through the ~185 verb lemma facets.
