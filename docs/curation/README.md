# Curriculum curation log

The Postgres curriculum (`web/prisma/seed-data/curriculum.json`) is curated from
reviewed TSV manifests in this folder. See
[`../../web/CLAUDE.md`](../../web/CLAUDE.md) and the memory note
`curriculum-curation-plan` for the workflow and rationale.

## How to run a batch

```
cd web
npm run curriculum:apply docs/curation/<manifest>.tsv [...] --apply
```

`curriculum:apply` detects each manifest's type, applies it, then re-exports the
snapshot and runs `db:verify` + `db:test`, halting on the first failure. Then
`git add docs/curation/ web/prisma/seed-data/` and commit, one commit per batch,
listing the manifests in the message.

Individual scripts (each dry-run by default, `--apply` to write):

| script | manifest columns |
|---|---|
| `curriculum:concepts:apply` | `concept-id · spanish · english · role · \|-collections-to-add · reason · [exSpanish · exEnglish]` — rewrites a row (collections merge, never remove) |
| `curriculum:concepts:add` | `spanish · english · exSpanish · exEnglish · role · \|-collections` — new rows |
| `curriculum:concepts:untag` | `concept-id · collection-name · reason` — removes one membership |
| `curriculum:roles:apply` | `concept-id · role · reason` — move tiers |
| `curriculum:collections:apply` | `DELETE\|MERGE\|RENAME · from · [into/to] · reason` |
| `curriculum:audit [slug]` | audits `topic:*` macrotags against `TOPIC_AUDIT_SPECS` |
| `curriculum:audit:verbs` | audits `sense:`/`conjugation:` paradigm completeness (bespoke, not `TopicAuditSpec`) |
| `curriculum:audit:cognates` | audits `cognate:` type/pattern-family structure (bespoke, not `TopicAuditSpec`) |
| `curriculum:audit:phrasal-verbs` | audits `topic:phrasal-verb` completeness (classification/root/particle tags) and sweeps the rest of the database for untagged look-alikes (bespoke, not `TopicAuditSpec`) |

`trash` is the only deletion path — move a row there, never hard-delete as a
judgement call.

## Naming

Going forward: `curation-YYYY-MM-DD-<slug>.tsv`. A canonical topic spec is
`<topic>-matrix.md`.

## Log

| date | batch | commit | manifests |
|---|---|---|---|
| 2026-08-23 | Migrate & retire the file-based curriculum into Postgres | `7361be93`..`eb7be422` | — |
| 2026-08-24 | Snapshot before deletions; sentence-record triage | `d3acde73`, `c8ae0ddf` | `sentence-record-triage-2026-08-24.json` |
| 2026-09-02 | Curate corrupted sentence records; add `trash` role | `ec40f38e` | — |
| 2026-09-02 | Sort every concept into a role tier | `b891bc17` | `role-sort-2026-09-02.tsv` |
| 2026-09-02 | Normalize sentence-shaped records into constructions | `a1c42c62` | `sentence-record-normalization-2026-09-02.{md,tsv}` |
| 2026-09-02 | Retire the review pipeline; curate via `trash` | `8f6f39c4` | — |
| 2026-09-02 | Retire migration-artifact collections | `b3f4b6a3` | `collections-phase1-2026-09-02.tsv` |
| 2026-09-02 | `es:` / `en:` lemma facets | `07b0d1ac` | `collections-phase3a-*-2026-09-02.tsv` |
| 2026-09-02 | Namespace collections into `facet:value` + registry | `b1ebb13e` | `collections-phase3b-facet-rename-2026-09-02.tsv` |
| 2026-09-02 | Topic subpages; Pronouns first | `86693cef` | `collections-phase4-pronoun-facets-2026-09-02.tsv` |
| 2026-09-02 | Normalize pronoun rows; fix facet bugs | `9c56a8f3`, `d54b5cae`, `922fb652` | `pronoun-phaseA-facet-fixes-2026-09-02.tsv`, `pronoun-phaseC-normalize-2026-09-02.tsv`, `pronoun-untag-control-frames-2026-09-02.md` |
| 2026-09-02 | Split slashed determiner/demonstrative rows | `9c683ccf` | `pronoun-slash-split-2026-09-02.tsv` |
| 2026-09-02 | Lock the pronoun topic; add `contrast:` facet | `83e734f1`, `9fde0359` | — |
| 2026-09-03 | Compound-indefinite prefix/suffix morphology | `50cc254d` | — |
| 2026-09-03 | Close the pronoun matrix (author every cell) | `75969e17` | `pronoun-batches/`, `pronoun-matrix.md` |
| 2026-09-03 | Manner adverb `bien` | `470aefdd` | `add-hacer-algo-bien-2026-09-03.tsv` |
| 2026-09-03 | **Determiners topic** (137 rows) | `57d80529`..`71c8b694`, `af920218` | `determiner-matrix.md`, `determiner-2026-09-04-{A,B,C,E,F,G}-*.tsv` |
| 2026-09-03 | **Curation pass** — tag hygiene, number examples, Interrogatives topic, bundled-row splits, determiner contrasts | `eb30a60b`..`e38ce2b2` | `curation-2026-09-04-{1b,1c,1d,2,3,4,5a,5b,5c}-*.tsv` |
| 2026-09-03 | Tooling cleanup — unified topic auditor, `scripts/lib/manifest.ts`, `curriculum:apply` | `7aeb207e`, `8828832e`, `6f81a081` | — |
| 2026-09-05 | **Verb organization** — `sense:` facet, 5-person present-tense paradigms for ser/estar/ir/tener/haber, `audit-verb-conjugation.ts` | `0ee27928`..`4261360e` | `verb-organization-plan-2026-09-05.md`, `curation-2026-09-05-verbs-*.tsv`, `curation-2026-09-05-voy-a-*.tsv` |
| 2026-09-05 | **Cognates topic** — promoted misfiled `morphology:suffix-*` root/etymology data to named `cognate:<stem>-to-<root>` families, retired 6 legacy junk values, modeled false friends as `contrast:` pairs, `audit-cognates.ts` | `cba02c4`, `3e8acf1` | `cognates-plan-2026-09-05.md`, `curation-2026-09-05-cognates-*.tsv` |
| 2026-09-04 | Nouns/adjectives: bracket the article/copula, `gender:` facet | `8ec42013` | `curation-2026-09-04-nouns-gender-bracket.tsv`, `curation-2026-09-04-adjectives-copula-bracket.tsv` |
| 2026-09-04 | Adjectives: `degree:` facet on existing comparative/superlative rows | `498d83db` | `curation-2026-09-04-adjectives-degree.tsv` |
| 2026-09-04 | Nouns/adjectives theme categorization (`topic:` facet) | `465f2e4` | `curation-2026-09-04-nouns-adjectives-theme.tsv` |
| 2026-09-04 | **Nouns/Adjectives topics** — tag degree: derivation rows `pos:adjective` so they surface on the new pages | *(pending commit)* | `curation-2026-09-04-adjectives-degree-pos-tag.tsv` |
| 2026-09-05 | **Spanish-to-English Mappings topic** — `topic:multi-sense` facet on the 44 `es:` lemmas with 14+ distinct English senses, excluding `es:be` and `es:mañana` as mistagging bugs | `88502be7` | `curation-2026-09-05-multi-sense-topic.tsv` |
| 2026-09-05 | **English-to-Spanish Mappings topic** — `topic:en-multi-sense` facet on the 107 `en:` lemmas with 7+ distinct Spanish senses and a >=0.6 lemma-containment ratio (screens out topical bucket-tags like `en:place`, `en:expression`, `en:order`) | `25f8c94` | `curation-2026-09-05-en-multi-sense-topic.tsv` |
| 2026-09-05 | **Bucket-mistagging cleanup** — removed `es:mañana` and 11 `en:` bucket tags (place/expression/people/possibility/future/nationality/obligation/possession/condition/result/feeling) from 185 rows that weren't real senses of those words; reclassified 8 orphaned nationality rows into the existing `topic:nationality` facet | `0181705` | `curation-2026-09-05-fix-manana-bug.tsv`, `curation-2026-09-05-fix-en-bucket-tags-{untag,reclassify}.tsv` |
| 2026-09-05 | Fix `en:order` bucket-mistagging bug — stripped the ordinal-number series (first..millionth, 32 rows) missed in the previous batch | `535fef3` | `curation-2026-09-05-fix-en-order-ordinals.tsv` |
| 2026-09-05 | Retire `pos:function-word` — reclassified 79 rows into `pos:determiner` (49), `pos:adverb` (4), or removed as a duplicate of an already-correct pos: tag (25) | `84d2f66` | `curation-2026-09-05-function-word-{untag,add-determiner,add-adverb}.tsv` |
| 2026-09-05 | Consolidate 25 orphaned `topic:` tags into existing wired siblings (time cluster -> `topic:time`, several near-duplicate domain pairs); retired 2 incoherent tags outright | `0d170fd` | `curation-2026-09-05-topic-consolidation-{add,untag}.tsv` |
| 2026-09-05 | Wire 11 consolidated `topic:` tags as new Nouns/Adjectives facet buttons (Food, Technology, Health, Government & politics, Crime & law, Art & culture, Communication & requests, Sports & travel, Events, Weather, Speed) | `d436cce` | — |
| 2026-09-05 | **Adverbs topic** — new page on `pos:adverb` (86 rows); tagged 5 manner adverbs missing `grammar:manner` | `a138e5a` | `curation-2026-09-05-adverbs-manner-tag.tsv` |
| 2026-09-05 | **Numbers topic** — new page on `pos:number` (71 rows, fully classified already) | `62ec6d0` | — |
| 2026-09-05 | **Connectors topic** — new page on `pos:connector` (70 rows); tagged 7 connectors missing any grammar: classification | `4bdd316` | `curation-2026-09-05-connectors-grammar-tag.tsv` |
| 2026-09-05 | **Prepositions topic** — new page on `pos:preposition` (23 rows, fully classified already). Completes the pos:-based topic-page set | `f1b3743` | — |
| 2026-09-05 | **Coverage audit** — tagged 887 orphaned infinitive verb phrases with `pos:verb`, tripling the Verbs page's real coverage (761 -> 1648 rows) | `0973052` | `curation-2026-09-05-coverage-audit-pos-verb.tsv` |
| 2026-09-05 | Coverage audit — tagged 301 English irregular-verb form drills ("pasado de X"/"participio de X") with `pos:verb` | `c7c53fc2` | `curation-2026-09-05-coverage-audit-form-drills.tsv` |
| 2026-09-05 | Coverage audit — tagged 65 more orphans across `pos:adverb`/`noun`/`preposition`/`adjective`/`verb` (time words, compound prepositions, predicate adjectives, verb phrases the first regex pass missed) | `dbf74635` | `curation-2026-09-05-coverage-audit-misc-pos.tsv` |
| 2026-09-05 | **Expressions topic** — new page on the previously-unwired `topic:social-expression` (21 rows: please, thank you, excuse me...) | `fc6d6a57` | — |
| 2026-09-05 | Coverage audit — closed final 9 gaps (determiners, interrogative constructions, frequency adverbs); reverted 2 that broke the Determiners audit spec (missing grammar: subcategory, example-sentence mismatch) and fixed 2 that broke the Interrogatives audit spec instead of working around it. Coverage audit ends at 230/4184 non-trash concepts (5.5%) still outside every topic page's baseCollection — almost entirely morphology-derivation/comparative transformation pairs ("X ==> Y") and compound sentence-pattern drills that are deliberately left pos:-less elsewhere in the database too | `7ad814f6` | `curation-2026-09-05-coverage-audit-{final,revert-poco,interrogatives-fix}.tsv` |
| 2026-09-05 | **Phrasal verb project, Phase 1-2** — exhaustive discovery sweep found 626-row true scope (588 known across 5 fragmented tagging schemes + 38 completely untagged); consolidated the 5 schemes into 2 (`grammar:phrasal-verb`/`construction:prepositional-verb`), retiring 5 mistagged rows and 13 dead legacy tag values along the way; classified and particle-tagged the 38 new discoveries | `ed82b1f7`, `c893971a` | `curation-2026-09-05-phrasal-consolidate-{add,untag}.tsv`, `curation-2026-09-05-phrasal-new-discoveries.tsv` |
| 2026-09-05 | **Phrasal verb project, Phase 3** — backfilled `particle:` to 100% coverage across the 590-row union (213 rows tagged); found and untagged 31 more mistagged rows in the process (English absorbed the Spanish preposition's meaning into a plain transitive verb, or the match was really a full-infinitive complement); backfilled `en:` root tags to complete coverage (66 rows, mostly `en:be` on copula idioms); added `KNOWN_PARTICLE_VALUES` registry | `d181ac10`, `9202e9cc`, `49b34012` | `curation-2026-09-05-phrasal-particle-backfill.tsv`, `curation-2026-09-05-phrasal-mistagged-untag.tsv`, `curation-2026-09-05-phrasal-root-{be,misc}-backfill.tsv` |
| 2026-09-05 | **Phrasal verb project, Phase 4** — tagged the audited 590-row union with `topic:phrasal-verb`; shipped Phrasal Verbs by Root (~51 roots) and Phrasal Verbs by Particle (39 particles) topic pages | `84a625fb`, `57cf317d` | `curation-2026-09-05-phrasal-topic-tag.tsv` |
| 2026-09-05 | **Phrasal verb project, Phase 5** — `audit-phrasal-verbs.ts` standing audit wired into `db:test`; its first run immediately found 10 more genuinely missed phrasal/prepositional verbs and 1 mistagged particle, now fixed (595 rows final) | `c9cdf05d`, `e1c00045` | `curation-2026-09-05-phrasal-audit-{fixes,untag}.tsv` |
| 2026-09-05 | **Transformations topic, tagging** — scoped `morphology:derivation` down to the 249 rows that are English-only category-changing derivation pairs (excluding Spanish cognate-spelling patterns already on Cognates, and degree: comparison pairs already on Adjectives); fixed 31 duplicate-tagged suffix/prefix families (259 redundant bare-tag instances retired); tagged the final set `topic:transformation` | `a69bad41` | `curation-2026-09-05-transformation-{dedup-untag,topic-tag}.tsv` |
| 2026-09-05 | **Transformations topic page** — new page on `topic:transformation`, 45 facet buttons (one per suffix/prefix/category-change family) | `21dce7c2` | — |
| 2026-09-05 | **Past-Tense Formation, regular -ed classification** — fixed a mistag (`form:past` on an infinitive gloss) and classified 47 regular-verb past-tense rows into `/d/`/`/t/`/`/ɪd/` pronunciation families, kept separate from the same-sounding tags already used for participial-adjective cognates | `a44fd10d` | `curation-2026-09-05-form-past-mistag-untag.tsv`, `curation-2026-09-05-regular-past-sound-tag.tsv` |
| 2026-09-05 | **Past-Tense Formation, irregular sound-family audit** — found the existing 25-family taxonomy covered only ~1/3 of irregular verbs (196 of 322 irregular past/participle rows had no family); extended 8 existing families and created ~20 new ones by cross-referencing each family against its missing past/participle counterpart, plus one large zero-change family; 53 genuine singletons marked `sound:reviewed` instead of forced into a bad rhyme. 100% coverage verified | `dc79c5b6` | `curation-2026-09-05-irregular-sound-families.tsv` |
| 2026-09-05 | Fix 5 family-name forks from the previous batch (extended families got a new tag instead of reusing the original) | `df6d3483` | `curation-2026-09-05-family-rename-{add,untag}.tsv` |
| 2026-09-05 | Classify the 30 participle-side regular-variant rows the earlier `/d/`/`/t/`/`/ɪd/` pass missed (same words, different row from the past-tense side) | `003d8216` | `curation-2026-09-05-regular-participle-sound-tag.tsv` |
| 2026-09-05 | Tag the 382-row verb-form drill set `topic:verb-form` | `4f475c7f` | `curation-2026-09-05-verbform-topic-tag.tsv` |
| 2026-09-05 | **Past-Tense & Past-Participle Formation topic page** — new page on `topic:verb-form`, 52 facet buttons (3 regular pronunciation classes, the zero-change class, every irregular rhyme family, plus a one-off bucket for singletons) | `7fd853e7` | — |
| 2026-09-05 | **Normalization pass 1** — reformatted all 382 `topic:verb-form` rows to the `[pasado]`/`[participio]` bracket-tag convention and replaced every self-referential example sentence ("El pasado de X es Y") with a real natural usage sentence; found and hand-fixed 3 verbs whose past-participle forks in meaning (bear: bore/borne vs born; hang: hung vs hanged; bid: bid vs bidden) | `e9f5d930` | `curation-2026-09-05-verbform-normalize.tsv` |
| 2026-09-05 | Split `actor/actriz` into two concepts — the bundled row only translated the masculine side, silently losing "actress" | `e4b1b1d5` | `curation-2026-09-05-actor-fix-{update,add}.tsv` |
| 2026-09-05 | Trashed duplicate `[estar] listo` concept (`3kvxnmbfe5`) found while normalizing gender-slash rows; unique `grammar:estar-adjective` tag merged onto the surviving core concept | `fec05225` | `curation-2026-09-05-estar-listo-dup-trash.tsv` |
| 2026-09-05 | **Normalization pass 2** — collapsed 265 Spanish masculine/feminine slash-notation rows (`poderoso/a`, `ser rápido/a`, `el/la organizador/a`, etc.) to the bare masculine form wherever gender is pure grammatical agreement (translation unchanged); also stripped the same slash notation from 24 example sentences; disambiguated `hecho/a`→done from the unrelated verb-participle `hecho`→done via the `[estar]` bracket convention | `fec05225` | `curation-2026-09-05-adjective-gender-normalize.tsv` |
| 2026-09-05 | Fixed `[ser] incorrecto → [to be] wrong`, whose example sentence used the antonym ("Tu respuesta es correcta.") instead of the word being taught | `9455aa49` | `curation-2026-09-05-incorrecto-example-fix.tsv` |
| 2026-09-05 | **Copy-pasted placeholder example sweep** — a broader check for the same bug found 6 example sentences duplicated verbatim across 3–23 unrelated rows each (colors/prices sharing "Tu respuesta es correcta.", random nouns sharing "¿Qué es esa cosa?", locations sharing "La tienda está allí.", days of the week sharing "La reunión es el lunes.", politeness phrases sharing "Discúlpame por llegar tarde.", adverbs sharing "Casi terminé."); wrote a real, word-specific example for the 57 affected rows (a handful of legitimate matches within those groups were left alone) | `9455aa49` | `curation-2026-09-05-placeholder-example-fix.tsv` |
| 2026-09-05 | Reviewed the remaining smaller (3–4x) shared-example groups from the same sweep by hand — 18 more genuine mismatches fixed (e.g. `el hombre`→man and `a casa`→home shared unrelated siblings' sentences), while groups that were legitimately one sentence demonstrating several senses of the same word (`vivir`/`vivir con`/`vivir en`, `subir`/`bajar` contrast pair, bracket-scaffolding templates) were left as-is | `a25c1b6a` | `curation-2026-09-05-small-group-example-fix.tsv` |
| 2026-09-05 | Relabeled the Past-Tense & Past-Participle Formation pills to one representative "verb → form" pair each (e.g. "buy → bought") instead of listing every rhyming verb in the button text; no data touched, all member rows unchanged | `6e51e6a6` | — |
| 2026-09-05 | **Topic-coverage audit** — 99% of non-trash concepts already had a `pos:`/`topic:` home; found two real gaps: a `construction:` cluster describing verb-complementation (gerund/infinitive/bare-infinitive after a verb) with no page, and ~40 fixed-idiom rows untagged `topic:expression`. Consolidated 7 fragmented/duplicate `construction:` tags (e.g. `verb-plus-infinitive`, `verb-full-infinitive`, `infinitive-construction` all → `followed-by-full-infinitive`) into their canonical form, then tagged the 179-row union `topic:verb-pattern` | `0e1f7cde` | `curation-2026-09-05-verb-pattern-tag-merge.tsv`, `curation-2026-09-05-verb-pattern-topic-tag.tsv` |
| 2026-09-05 | **Verb Patterns topic page** — new page on `topic:verb-pattern`, 14 facet buttons covering full/bare infinitive, gerund, either-works verbs, perception-verb constructions, causatives (have/get something done), preposition + gerund, go + gerund, progressive, and auxiliary do | `0e1f7cde` | — |
| 2026-09-05 | Closed most of the remaining topic-coverage gap: 11 fixed idioms (`sin falta`, `¡Ya basta!`, `más vale tarde que nunca`, etc.) tagged `topic:expression`; `sí`→yes tagged `pos:interjection` + `topic:expression`; 6 rows that were simply missing a `pos:` tag entirely got one. 13 rows deliberately left untouched — correlative/comparison/wish-mood grammar patterns (`entre más...más`, `ni...ni`, `ojalá`, etc.) that are the subject of the next `grammar:` facet audit, not expressions | `1e9c5159` | `curation-2026-09-05-orphan-tag-fix.tsv` |
| 2026-09-05 | **`grammar:` facet audit** — confirmed it's a cross-cutting classifier, not a page-worthy topic of its own: 1,629 of 1,641 `grammar:`-tagged rows already live on an existing page via `pos:`/`topic:`. Closed the last 15 true orphans (correlative connectors, wish-mood `ojalá` rows, comparison determiners, etc.) by giving each the `pos:` tag matching its actual word class. **Topic-coverage audit series complete: 0 concepts left with neither a `pos:` nor a `topic:` tag** | `e1735712` | `curation-2026-09-05-grammar-orphan-tag-fix.tsv` |
| 2026-09-05 | **Core kinship vocabulary** — added the 8 essential pairs missing from the database entirely (padre/madre, papá/mamá, hijo/hija, abuelo/abuela, tío/tía, primo/prima, sobrino/sobrina, novio/novia), 16 new rows on `topic:family`; extended in-laws/step-family/etc. deliberately left out of scope | `0dd79120` | `curation-2026-09-05-kinship-core-add.tsv` |
| 2026-09-05 | **Within-page facet-coverage audit** — checked every topic page for rows that carry the base tag but match none of the page's facet buttons (invisible unless viewed unfiltered); found six real gaps (Expressions 100%, Prepositions 66%, Connectors 59%, Adverbs 47%, Cognates 33%, Phrasal Verbs by Root 22%) | — | — |
| 2026-09-05 | Fixed a bug from the earlier orphan-cleanup pass: 12 rows got tagged `topic:expression`, but the Expressions page's `baseCollection` is `topic:social-expression` — those rows never reached the page. Merged the tags | `aa0ab99f` | `curation-2026-09-05-expression-tag-fix.tsv` |
| 2026-09-05 | **Expressions page facets** — registered a new `expr:` collection facet, sorted all 34 rows into 7 communicative-function buckets (politeness, greetings, apologies, response words, farewells, warnings/commands, idioms & fixed phrases); page previously had zero facet buttons | `aa0ab99f` | `curation-2026-09-05-expressions-facet-tag.tsv` |
| 2026-09-05 | **Prepositions page facets** — 25/38 rows were uncovered by the page's 2 facets; tagged 16 spatial preps `topic:location` and 1 `topic:time` that were simply missing the tag, completed the `según`-family "According to" cluster, and added Purpose/Without/Except facets reusing existing `grammar:` tags. 36/38 rows now covered (`ante`, `junto con` are genuine one-off leftovers) | `630a8358` | `curation-2026-09-05-prepositions-facet-tag.tsv` |
| 2026-09-05 | **Connectors page facets** — 43/73 rows uncovered by the page's 6 facets. Backfilled missing `grammar:reason`/`grammar:concession`/`topic:time-connector` tags (14 rows), extended `grammar:discourse` from 2 to 12 rows (es decir, de hecho, por cierto, por lo tanto, etc.), extended `grammar:sequence`/`grammar:conditional` (5 rows), and added Correlative/Comparison facets reusing tags that already existed with no page. 68/73 rows now covered | `61b6e8c5` | `curation-2026-09-05-connectors-facet-tag.tsv` |
| 2026-09-05 | **Questions & Negation topic** — new page + new `qn:` facet on `topic:question-negation` (61 rows), splitting English's two negation/question systems: do-support (don't/doesn't/didn't, Do/Does/Did you...?) vs. modal/be/have direct contraction (can't, isn't, haven't; Can you...? Are you...? Have you...?), plus negative questions and the emphatic "I DO like it". Retagged 41 rows that already existed scattered across modal-verb/multi-sense rows; added 20 new rows filling real gaps (isn't/aren't/wasn't/weren't/hasn't/hadn't were completely missing, as was the DOES emphatic form) | `7169f784` | `curation-2026-09-05-qn-new-rows-add.tsv`, `curation-2026-09-05-qn-retag-existing.tsv` |
| 2026-09-05 | **Verb Patterns extended** — global audit for sizeable `grammar:`/`construction:` values with no page found 4 more real verb-complementation patterns already fully vocabulary-homed but invisible as a pattern: double object (give somebody something, 11 rows), object + complement (make/expect somebody to do something, 27 rows), passive voice (something is needed, 9 rows), and going-to future (11 rows). Tagged all 42 `topic:verb-pattern` and added the 4 facets | `19327585` | `curation-2026-09-05-verb-pattern-extend-tag.tsv` |
| 2026-09-05 | **Imperatives & Commands topic** — new page + new `imp:` facet on `topic:imperative` (20 rows): affirmative tú vs. usted/ustedes, negative commands, and nosotros "let's" — the point being Spanish commands change conjugation by formality/number while English stays invariant ("Close the door" either way). Retagged 13 existing rows (hazlo/hágalo/háganlo, cállate, vamos, etc.) and added 7 new rows with an ordinary verb (cerrar/close) since the only prior content used the confusing self-referential "hacer/do it" | `TBD` | `curation-2026-09-05-imperatives-add.tsv`, `curation-2026-09-05-imperatives-retag.tsv` |
