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
- **2026-09-05, Verbs page, a-d done** — worked alphabetically through
  es:abrir through es:dejar (~30 lemmas, ~275 rows). Found several
  true duplicates with identical examples (apagar "turn off X"/"turn X
  off", cerrar bare/[algo] templates, caber bare/[algo] templates —
  all trashed) and one real ambiguity bug (dejar [algo] [en algún
  lugar] "to forget" used the exact same example as its "to leave"
  sibling — gave it a distinct forgetting-specific sentence). Most
  batches were clean: this page has a LOT of legitimate near-synonym
  clusters (coger/recoger alone spans ~16 rows) since it's the
  semantic-range vocabulary the whole "multi-sense" framing is built
  on. Commits `eb332d2d` through `42229be0`.
- **2026-09-05, Verbs page, d-i done** — es:desarmar through es:irse
  (~35 lemmas, ~265 rows). Found and fixed several more "identical
  example as a sibling row" bugs (devolver la llamada/devolverle la
  llamada, encontrar's generic vs [adjetivo] sense, entender's
  understand/get pair). This "check for an exact-duplicate example
  shared with another row in the same facet" check has been the
  single highest-signal step of the checklist on this page — worth
  running explicitly (compare exampleSpanish AND exampleEnglish, not
  just Spanish) on every remaining lemma facet. Commits `d55c5db1`
  through `662e5b4d`.
- **2026-09-05, Verbs page, j-p done** — es:jugar through es:prestar
  (~40 lemmas, ~350 rows). Two more "identical example as a sibling"
  fixes: pagar (bare) vs pagar por [algo], and left necesitar la
  información específica untouched (still flagged for the user from
  the Determiners audit — don't re-tag flagged rows as reviewed just
  because they surface again in a later facet). Otherwise a long clean
  stretch — llegar/llevar/mantener/pasar/pedir/pegar/pensar/perder all
  checked out with distinct correct examples on every row. Commits
  `546107db` through `8a0dd250`.
- **2026-09-05, Verbs page, q-t done** — es:quedar through es:terminar
  (~35 lemmas, ~260 rows). One more real bug: "subir" -> "to go up"
  had the identical example as its "to come up" sibling AND its own
  English translation literally said "come up" — fixed. Otherwise
  clean: quitar/sacar/salir/seguir/sentir all large idiom networks
  with correctly distinct examples. Commits `a97750c2` through
  `04aca676`.
- **2026-09-05, VERBS PAGE COMPLETE** — finished es:tirar through
  es:volver plus the topic:verb-other catch-all (~150 rows). All 185
  named lemma facets + the one-off bucket on the restructured Verbs
  page are now audited — roughly 1,700+ rows, going from "~1,800 of
  2,000 verbs invisible on the page" (the user's original complaint)
  to fully browsable and reviewed. Found one more real bug along the
  way (fixed in the q-t batch: subir "to go up"). Commits `919bfa36`
  through `9f4cc9da`. Next: the two Mappings pages' remaining es:/en:
  facets (function words: de/en/con/por/que/a/etc. — not verbs, these
  overlap heavily with what's already done since most verb lemmas are
  also tagged topic:multi-sense), then Phrasal Verbs by
  Root/Particle — see `npm run curriculum:audit:status` (~65 units
  left total as of this entry).
- **2026-09-05, FULL-DATABASE AUDIT ESSENTIALLY COMPLETE** — cleared
  the remaining Mappings/Expressions overlap rows and the last two
  ordinary facets (en:slow, en:the). Final status:
  **846/848 Track A units fully reviewed, 4216/4225 (99.8%) Track B
  concepts reviewed.** The only 2 units left incomplete are
  intentionally open — flagged for the user's own content decision,
  not oversights: Determiners/`grammar:definite-article` (a headword/
  example mismatch needing a real content rewrite) and
  Verbs/`es:necesitar` (the same flagged row, "necesitar la
  información específica"). See `full-audit-findings.md` for both.
  Commits `78d889d8`, `1f3b62dc`. **This closes out the multi-session
  full-database audit that began at Phase 0** — every remaining
  incomplete unit in the priority queue is a deliberate exception, not
  unfinished work. Any future session should start by resolving the 2
  flagged rows with the user (or by continuing to spot-check via the 6
  global mechanical sweeps in `full-audit-plan.md` Phase 1, not yet
  run), rather than assuming there's more facet-by-facet work queued.
- **2026-09-05, NEW PROJECT: subtopic-size rule, retroactive pass** —
  user set a new standing rule (memory: curriculum_subtopic_size_rule):
  any facet-button subtopic over ~10-20 items needs a judgment call on
  splitting. Applied it to the Verbs redesign first (96 buckets), then
  found 140 more oversized buckets database-wide (properly intersected
  with each page's baseCollection — an earlier unintersected scan had
  inflated this to 173). User wants it applied retroactively,
  page by page. UI mechanism: extend the existing `facetGroup()`
  helper in topic-presentation.ts (already used by 6 topics to cluster
  facet buttons under coarse headers) rather than changing the
  topics.ts data model. Split axis differs by page purpose: thematic
  for Nouns/Adjectives/Adverbs (like Verbs), sense-cluster-within-word
  for Mappings/Phrasal-Verb pages (their whole purpose is one word's
  full range), suffix/root-family for Cognates/Transformations,
  finer-subtype for Verb-Patterns/Verb-Forms.
  Progress: Pronouns (2 buckets), Determiners (2) + Numbers (2,
  shared cardinal-number tags), Prepositions (1) done — commits
  `0d62a017`, `c2935fa6`, `29351373`. Nouns (all 9 oversized buckets:
  gender:masculine/feminine split by noun-ending pattern since gender
  has no meaning-based split, gender:common by profession-suffix,
  topic:abstract-quality by cognate suffix family, topic:people/
  everyday-objects/time/family/places by semantic sub-group) — commit
  `9e663ec7`. contrast:confusable (shared across ~8 pages) deferred to
  its own pass. Next: Adjectives (8 buckets), then Adverbs (3), then
  the sense-based Mappings/en-mappings/Phrasal-Verb pages, then
  Transformations/Verb-Forms/Verb-Patterns/Cognates, then a revisit of
  the ~38 Verbs buckets still over 20 (mostly the 21-32 range
  originally called "close enough").
