# Curriculum Database Discovery

This document records the working decisions that emerged while representative curriculum data was discovered in JSON and now continues in PostgreSQL. These are migration checkpoints, not a frozen schema.

## 2026-08-23 — Capture, normalize, and retire verb forms

- Captured all 51 documents under `structure/verb-forms` verbatim in PostgreSQL: 33,905 UTF-8 bytes, SHA-256 hashes, searchable branch metadata, and 268 extracted rows. Every row has exactly one disposition: 12 canonical candidates, 92 example-evidence rows, 130 reference patterns, and 34 indexes.
- Normalized 199 Spanish-first concepts in the canonical table: the six foundational **do** forms, full- and bare-infinitive selectors, gerund and present-participle jobs, modal and auxiliary constructions, imperatives, perception contrasts, passives, causatives, and all explicit third-person form bridges. The final catalog added 173 concepts and enriched 26 exact existing mappings.
- Added controlled query collections for `followed by full infinitive`, `followed by bare infinitive`, `followed by gerund`, `uses present participle`, `uses past participle`, and `uses third-person present`, plus contrast tags for allowed alternatives, whole events, events in progress, spelling behavior, and grammatical jobs.
- Stored the six-form framework once as **hacer/to do**, **hacer/do**, **haciendo/doing**, **hizo/did**, **hecho/done**, and **hace/does**. Explicit source relationships such as **hablar ==> habla** and **to speak ==> speaks** remain queryable, but ordinary lexical verbs were not mechanically expanded into six redundant records each.
- Kept gerunds and present participles distinct by job despite their shared `-ing` surface form. Kept the separate `past-and-past-participle` inventory outside this batch; this migration covers the generic **did/done** framework and constructions that select a past participle, not the later verb-by-verb sound inventory.
- Preserved existing curriculum roles on exact matches. The resulting 199-concept set is 27 Core, 36 Supporting, and 136 Reference; the six forms are Core because the owner identified this framework as foundational, while most spelling bridges and alternate constructions remain Reference.
- Verified all 199 catalog edges through a second duplicate preflight, verified the source archive byte-for-byte and row-for-row, exported immutable snapshot parity, and retired `docs/curriculum/structure/verb-forms` after repairing its two external links.

## 2026-08-23 — Capture, normalize, and retire transformations

- Captured all 178 transformation documents verbatim in PostgreSQL: 101,277 UTF-8 bytes, SHA-256 hashes, searchable family metadata, and 594 extracted rows. Every row has exactly one disposition: 216 canonical candidates, 302 example-evidence rows, 7 reference patterns, and 69 indexes.
- Normalized the pillar into 312 Spanish-first concepts in the one canonical `curriculum_concepts` table: 267 explicit transformation relationships and 45 ordinary recognition mappings. The transaction added 305 concepts and enriched 7 exact existing mappings; no parallel transformation table was created.
- Transformation relationships use exactly one ` ==> ` on both language sides, with each half normalized independently. For example, **el poder ==> ser poderoso/a** maps to **the power ==> to be powerful**. Nouns use natural articles, adjectives and states use support verbs, and verbs use infinitive patterns.
- Added flat query collections for the broad transformation family, affix or prefix, grammatical direction, word family, productivity status, spelling behavior, variants, and relevant contrasts. Recognition-only words such as **also** and **because** remain ordinary mappings tagged `prefix: al-` or `prefix: be-` rather than pretending those prefixes are productive learner rules.
- Kept priority conservative: 297 transformation concepts are Reference and 15 are Supporting, with no new Core. Productive does not mean Core, and common recognition words do not earn Core through this import.
- Verified the PostgreSQL archive byte-for-byte and row-for-row against the live tree, exported immutable snapshot parity, and retired `docs/curriculum/transformations`. Future cleanup, promotion, demotion, and collection nesting happen in PostgreSQL.

## 2026-08-23 — Capture, normalize, and retire vocabulary

- Captured all 17 vocabulary Markdown documents verbatim in PostgreSQL: 127,594 UTF-8 bytes, SHA-256 hashes, searchable metadata, and 972 extracted table rows. Every row has exactly one explicit disposition: 102 indexes, 224 canonical candidates, 572 example-evidence rows, 67 reference patterns, and 7 memory aids.
- Normalized the pillar into 592 atomic Spanish-first concepts in the one canonical `curriculum_concepts` table. The migration added 556 concepts, enriched 33 exact matches, and merged 3 article/support-verb normalized matches; no parallel vocabulary catalog or table was created.
- Kept migration priority conservative: 572 vocabulary concepts are Reference and 18 are Supporting. The 2 Core concepts were pre-existing mappings whose roles were preserved; the import itself promoted nothing to Core.
- Added flat, queryable collections for `vocabulary`, source category, exactly one grammatical type, semantic themes such as `days of the week`, `date`, `time`, and `location`, and reusable number, false-cognate, connector, phrasal-root, and particle patterns.
- Normalized nouns with natural Spanish articles except intentional calendar and language-name forms, adjectives with `ser`, `estar`, or `tener`, verbs as infinitive patterns with controlled placeholders, and English targets as single atomic values. Corrected ambiguous source-example selection before export.
- Verified the PostgreSQL source archive byte-for-byte and row-for-row against the live tree, exported immutable snapshot parity, and retired `docs/curriculum/vocabulary`. Future curation, promotion, demotion, and collection nesting happen in the database.

## 2026-08-23 — Unify cognates with canonical curriculum concepts

- Promoted all 751 captured cognate catalog items into `curriculum_concepts`, splitting the two bundled English alternatives so 753 single-target mappings were considered. The import created 748 concepts and merged cognate collections into 5 existing mappings.
- Cognate metadata now uses the same flat collections as every other concept: part of speech, direct/spelling-pattern/word-family/memory-bridge/confusion-set type, true, false, or contextual-cognate status, visible spelling pattern, morphemes, and source family. Curriculum priority remains the existing `curriculumRole` field.
- A full post-import audit found 252 noun source rows requiring article normalization: 104 explicit nouns, 120 ambiguous rows that were nouns, and 28 nouns incorrectly inferred to be adjectives from their English suffix. All now use natural article forms such as **el territorio → territory**; gender-invariant person nouns use forms such as **el/la estudiante**.
- Resolved the remaining broad source classifications instead of leaving `noun-or-adjective` in the canonical catalog: 150 adjective items now use natural `ser` or `estar` constructions, including **ser terrible → to be terrible** and **ser horrible → to be horrible**, while **aparte → apart** is tagged as an adverb.
- Atomized the ten remaining bundled noun, adjective, and verb records so every canonical row again has exactly one Spanish concept and one English target. Normalized collisions were merged into their established concept IDs, including **ser increíble → to be incredible**.
- Reclassified eight imported confusion-set edges from `false cognate` to `contextual cognate`; they describe context-dependent translations such as **estar disponible → to be free**, not genuinely deceptive word pairs. Eight older cognate verb mappings also received their missing `verb` collection.
- Added database regression checks requiring a recognized part of speech on every cognate, articles on cognate nouns, support verbs on cognate adjectives, atomic imported targets, and the absence of obsolete ambiguous POS collections.
- Removed the temporary `cognate_items` table, cognate-only snapshot, types, and commands. The 265 immutable source documents and 1,250 extracted rows remain in the generalized source archive as lossless provenance, not as a second teachable-content catalog.
- The Curriculum page now queries PostgreSQL in pages of 50. Search, collection filtering, curriculum-role filtering, result counts, and pagination are server-side, with trigram and collection-membership indexes supporting the browsing workflow.

## 2026-08-23 — Capture and structure the cognates pillar

- Captured all 265 cognate files verbatim in the generalized curriculum source archive: 240,286 bytes and 1,250 extracted table rows verified against the live tree before deletion.
- Initially staged 751 structured cognate items with part of speech, teaching tier, true versus false/contextual status, group/rule label, provisional curriculum role, tags, provenance, and exact canonical-concept links where available.
- Conservatively assigned 181 selected high-frequency cognates to Supporting and 570 to Reference; no item was promoted to Core merely because it is transparent or common.
- This staging catalog was used to prove complete capture before source retirement, then promoted into canonical concepts and removed. Cognates are now queried through ordinary bilingual search and collections.
- Retired `docs/curriculum/cognates` only after source and snapshot parity passed; its immutable documents remain in `web/prisma/seed-data/curriculum-sources.json`.

## 2026-08-23 — Capture and retire the mappings source tree

- Replaced the slow file-by-file ingestion gate with a lossless PostgreSQL source archive so completeness no longer depends on making final curation decisions during import.
- Captured all 2,225 remaining files under `docs/curriculum/mappings` verbatim: 1,524,163 UTF-8 bytes, one SHA-256 hash and searchable metadata record per file, and 4,322 extracted Markdown table rows with Spanish, English, source path, section, line, and tags where available.
- `mapping_source_documents` is immutable source evidence; `mapping_source_entries` is the first queryable extraction surface. Neither table pretends that sentence-shaped source rows are canonical concepts.
- PostgreSQL was compared field-for-field with the live source tree before deletion. `web/prisma/seed-data/curriculum-sources.json` provides reproducible bootstrap and parity verification after the source folder's retirement.
- Future mapping cleanup works from PostgreSQL. Exact matches may link or revise existing concepts; uncertain useful material defaults to Reference; role promotion, deduplication, placeholder normalization, and collection enrichment happen after capture.
- `npm run curriculum:mappings:inventory` reports archived coverage, and `npm run curriculum:sources:query -- --search <text>` queries extracted rows without restoring the Markdown tree.

## 2026-08-23 — Make full curriculum migration the active objective

- The active objective is to migrate every useful item under `docs/curriculum` into PostgreSQL, beginning with `docs/curriculum/mappings/english-to-spanish`. The five-lesson vertical slice and final curriculum curation no longer gate this migration.
- Completeness and curation are deliberately separated. Preserve uncertain but valid material as provisional Reference data so it can be queried and curated later; keep Core elite and do not create a parallel Core collection.
- Collections remain the current tagging mechanism. The migration adds consistent family, construction, grammatical, semantic, provenance, and exceptional surface-form collections instead of introducing a speculative second tag table.
- English-to-Spanish sources remain evidence rather than database direction. Each useful row must be rewritten as a neutral Spanish-first concept with exactly one English target and one minimal bilingual example.
- English `be` is an approved exception to ordinary surface-form compression: independently useful `be`, `am`, `is`, `are`, `was`, `were`, `been`, and `being` records may remain visible and receive both `to be` and surface-form collections.
- Every source file requires a recorded disposition before deletion, and every proposed batch must be compared with PostgreSQL before import. Git history remains recovery, but the manifest is the proof that nothing was skipped.

## 2026-08-22 — Repair attempted English-to-Spanish reverse import

- The English-to-Spanish reverse import initially treated example sentences as canonical `spanish` and `english` concept fields. That was incorrect: the approved database still requires a neutral Spanish concept or construction mapped to exactly one neutral English target, with full sentences stored only in `exampleSpanish` and `exampleEnglish`.
- The malformed additions were removed from the approved curriculum before commit. Their review candidates remain in the `english-to-spanish-reverse-consumption-2026-08-22` batch as deleted, with source paths, examples, and repair notes preserved for later hub-by-hub canonicalization.
- The 43 exact Spanish/English matches from the reverse audit were retained as revision candidates and migrated only as collection updates on existing Spanish-first concepts. These are safe because they did not create new sentence-shaped concepts.
- The `docs/curriculum/mappings/english-to-spanish` source tree was restored and remains active. It has not been consumed; future work must manually generalize each useful reverse row into a neutral Spanish-first mapping before migration.
- Durable rule: reverse-source examples are evidence, not concepts. A row such as `Estoy bien, gracias. → I'm fine, thanks.` must become a concept like `estar bien → to be okay` with the original sentence as the example, or it must stay un-migrated.

## 2026-08-21 — Move the curriculum runtime store to PostgreSQL

- PostgreSQL is now the canonical runtime store for approved curriculum concepts and curriculum review history. Lesson Builder and learner-facing lessons remain separately persisted in `web/data/lessons.json`.
- The relational model preserves stable concept IDs, one Spanish concept and one English target, separately queryable Spanish and English examples, ordered collection memberships, review batches, candidates, source paths, owner decisions, and historical migration state.
- The former runtime JSON files now live under `web/prisma/seed-data/` as immutable bootstrap fixtures. The seed refuses to overwrite populated tables, and the parity verifier reconstructs both domain files from PostgreSQL and compares every field and authored order with those snapshots.
- Future audits enter the review inbox through the guarded `curriculum:review:import` CLI. Approved candidates move to the curriculum through the dry-run-first, transactional `curriculum:migrate` CLI; additions, revisions, and review-state updates commit together or roll back together.
- The application keeps the learner-facing `example: { spanish, english }` shape. PostgreSQL stores the two languages in separate columns rather than combining them into a display string.

## 2026-08-21 — Complete the remaining verb-family migration

- Migrated the 57 remaining Todo verb families directly into the JSON discovery database after the owner accepted the established curation workflow for bulk use. Review history remains intact, but this pass did not create artificial review batches for already-authorized migration work.
- Large inflection-heavy source hubs such as `ser`, `estar`, `haber`, and `tener` confirmed the concept-compression rule: ordinary person, number, tense, and mood forms are evidence for a reusable concept, not independent database rows. Preserve a surface form only when it changes the natural English mapping, register, or learner behavior.
- Before consuming a parent source family, relocate genuinely unprocessed nested families to canonical top-level locations. This pass separated families such as `lograr`, `obtener`, `enviar`, `ordenar`, `detener`, `aparecer`, `acordar`, `mantener`, `mirar`, `devolver`, and `regresar` rather than deleting or silently absorbing them.
- When a newly audited family reaches an exact Spanish–English edge already present under another family, retain the existing stable ID and add the new family collection. Cross-family membership is metadata; it is not a reason to duplicate the concept.
- Reverse English hubs and mixed vocabulary, structure, transformation, and confusion-set files remain row-level sources. Remove only captured material and preserve unrelated future-family content; fully dedicated consumed sources continue to be deleted under the one-look policy.
- Bulk completeness work still uses asymmetric curation: protect plausible independent language from loss, keep Core elite, reserve Supporting for broadly reusable everyday constructions, and place most alternate targets, advanced particles, formal distinctions, and narrow word-family forms in Reference.

## 2026-08-21 — Tighten curriculum-role selection

- **Core** is an elite, highly selective tier. Every recommendation needs a strong functional-necessity justification; commonness alone is insufficient.
- **Supporting** is reserved for extremely useful, broadly reusable language that materially improves everyday expression but does not need to be the lesson's central target.
- **Reference** is the normal home for non-everyday, situational, secondary, or readily inferable material that remains useful for later retrieval.
- Completeness-first review may still surface borderline candidates, but it must not inflate Supporting. Material without enough retrieval value should be proposed for deletion.

## 2026-08-21 — Partially migrate the five-family review batch

- Migrated the 128 owner-approved candidates from the open `hablar`, `decir`, `dar`, `pedir`, and `poner` audit: 19 Core, 34 Supporting, and 75 Reference concepts.
- Added 126 new concepts and revised the two existing `querer decir` concepts to include the `decir` collection.
- Migrated the remaining 89 approved candidates after owner review: 5 Core, 19 Supporting, and 65 Reference. The four deleted candidates remain only in review history.
- Migrated two `tomar` follow-ups: `tomar una foto de [algo]` → `to take a photo of [something]` and `tomar [un curso]` → `to take [a course]`, both Supporting.
- Both batches are now marked migrated. Each migrated candidate carries explicit migration state, so later partial migrations cannot duplicate it and the inbox can distinguish ready work from completed work.

## 2026-08-21 — Adopt one-look source consumption

- Git history is now the only recovery layer for consumed curriculum sources; the repository no longer keeps a second migration archive.
- Deleted 104 fully consumed tracked files covering the completed `querer`, `necesitar`, `comer`, `tomar`, and `beber` audits plus the open `hablar`, `decir`, `dar`, `pedir`, and `poner` review batch.
- Preserved unrelated future material by splitting `entregar`, `solicitar`, `postular`, and `buscar` into their own source families and retaining focused material under `preguntar`, `prestar`, `gustar`, and `ordenar`.
- Mixed structure, vocabulary, pronunciation, spelling, and particle files lost only their consumed sections. Historical review `sourcePaths` remain as provenance and are not expected to resolve in the live tree.
- The permanent workflow is now: read a source once, capture every useful concept or move unrelated material, validate the review batch, and delete the consumed source immediately.

## 2026-08-21 — Open five-family particle-completeness review

- Opened one review batch for `hablar`, `decir`, `dar`, `pedir`, and `poner`, expanding the workload to test whether the owner can efficiently curate several verb families together.
- Enumerated independently teachable person, topic, infinitive, and other complement frames in addition to the English phrasal-verb families associated with each principal target verb.
- Particle metadata now records true phrasal verbs, fixed verb-plus-preposition constructions, each stable English particle, and useful bilingual connector mappings such as `con => with` and `de => about`.
- The batch also proposes word-family nouns, adjectives, cognates, and prefix/suffix tags, plus focused revisions that add the `decir` collection to existing `querer decir` concepts without duplicating them.

## 2026-08-21 — Migrate adverbs and extended derivations

- Migrated the approved adverb, adjective, and noun derivations from the completed `querer`, `necesitar`, `comer`, and `beber` families.
- Preserved suffix and cognate-pattern collections such as `-mente`, `-ly`, and `cognate -mente => -ly`; deleted candidates remain only in the review history.

## 2026-08-21 — Migrate completed-family word forms

- Migrated the approved word-family additions for `comer`, `necesitar`, and `beber`, plus the `adjective` grammar-tag revision for `querido/a`.
- Applied the owner's substitutability judgment: specific nouns such as `la comida` are Supporting when a learner can communicate the immediate need with a generic referent such as `this`, `that`, or `it`.

## 2026-08-21 — Migrate tomar and beber

- Migrated 28 approved mappings across `tomar` and `beber`, including their overlapping `drink` and conversational `have` realizations.
- Added broad `take` and `drink` phrasal-verb and connector coverage, keeping only foundational meanings Core and retaining advanced constructions as Supporting or Reference.
- Excluded the owner's deleted measurement and route duplicates from the database while preserving their review notes.
- The dedicated `tomar` source and the fully consumed reverse `drink` source were subsequently deleted under the one-look policy; `beber` had no dedicated Spanish-to-English folder.

## 2026-08-21 — Migrate comer and phrasal-verb family

- Migrated the approved `comer` mappings, including direct food meanings and the broader phrasal-verb family: `eat up`, `eat out`, `eat in`, `eat away at`, `eat into`, and `eat through`.
- Kept the neutral food meaning for `eat out`; the owner explicitly does not want sexual vocabulary or senses included in course content.
- The dedicated `comer` source was subsequently deleted under the one-look policy.

## 2026-08-21 — Migrate necesitar and spoken-reduction follow-ups

- Migrated the approved `necesitar` audit: personal need, need + full infinitive, need somebody + full infinitive, and impersonal `se necesita`.
- Migrated the approved Supporting spoken reductions `wanna` and `needa` as separate entries under their parent full-infinitive constructions.
- No dedicated `necesitar` source folder existed. Consumed `necesitar` sections were removed from mixed files while unrelated structure and pronunciation material remained active.

## 2026-08-21 — First approved review batch migrated

- Completed the `querer` completeness audit through the Review inbox.
- Migrated six approved additions and one approved correction into `web/data/curriculum.json`, preserving the owner's final roles, collections, examples, and review notes.
- Marked the batch migrated in `web/data/curriculum-review.json`; the completed source was subsequently deleted under the one-look policy.
- Routine audits must not reopen consumed sources. Git history may be consulted only when the owner explicitly requests a correction or recovery.

## 2026-08-21 — Store concepts, not complete conjugation tables

- The curriculum database stores reusable language concepts that may combine vocabulary, grammar, meaning, and sentence structure.
- Ordinary conjugated occurrences reuse their underlying concept. For example, **Quiero comer algo** is evidence of **querer hacer algo**; it does not require a separate **quiero** curriculum object.
- A form or form-conditioned construction becomes independently recordable when it changes the natural English translation, meaning, register, or teaching behavior.
- Examples include **querer decir** → **mean**, polite **quisiera** → **would like**, negative preterite **no quiso hacer algo** → **refused to do something**, and salutation **Querido/a + persona** → **Dear + person**.
- Participles and other forms are not automatically promoted. Ordinary **he querido** remains an inflectional realization of its concept, while lexicalized **querido/a** meanings such as **dear** or **beloved** require their own concepts.
- This compression rule applies to later verb families as well. For example, ordinary forms of **saber** reuse their concepts, while **lo supe** → **I found out** requires a distinct concept because the preterite changes the English realization.

## 2026-08-21 — Completeness means independent teaching coverage

- Completeness does not mean copying every dictionary sense, expression, conjugation, or possible sentence into the database.
- Store a concept when its natural English realization cannot be reliably produced by combining concepts the course already teaches.
- Do not store predictable additions merely because they create a longer phrase. For example, **querer algo para alguien** is composed from **querer algo** plus core **para**, and **quererse a sí mismo** or reciprocal **quererse** can be composed when reflexive language, **oneself**, and **each other** are already taught.
- Store non-compositional choices such as **querer a alguien** → **love somebody** and **querer decir** → **mean** because word-by-word composition would produce the wrong English.
- Productive free-choice constructions such as **donde quiera** → **wherever**, **cuando quiera** → **whenever**, and related patterns qualify when they provide a reusable translation strategy that is not transparent from the individual words.
- Exclude situationally narrow, rare, archaic, literary, or specialist expressions unless later lesson evidence establishes a real teaching need. Dictionary presence alone does not justify a curriculum object.
- The target is complete coverage of useful, independently teachable language—not exhaustive lexicography.

## 2026-08-21 — Replace mapping tags with collections and English search

- The narrow `mappingTags` interpretation is superseded. The underlying many-to-many grouping capability remains useful and is renamed `collections`.
- Direct case-insensitive substring search over both canonical mapping fields answers literal retrieval queries without maintaining duplicate metadata. Searching **want** returns English realizations containing **want**, while searching **quiera** returns matching Spanish concepts.
- Exclude square-bracketed placeholder text from matching. Searching **do** should not return a row merely because its replaceable slot is **[to do something]**.
- Collections serve a different purpose from search: they are authored groupings that can gather concepts for lesson planning even when those concepts share no literal English text.
- A concept may belong to several collections. Collection names should express a useful authoring or lesson-planning grouping, not mechanically duplicate every word in the English field.
- Every concept discovered during a verb-family audit belongs to that Spanish lemma's collection. All current **querer** mappings therefore belong to the **querer** collection, including forms and expressions whose English realization is **love**, **mean**, **would like**, or something else.
- Preserve direct search and collections as separate tools: search discovers text matches; collections express deliberate curriculum membership.

## 2026-08-21 — Square brackets identify construction slots

- Use square brackets inside Spanish and English concept patterns to identify replaceable placeholder material.
- For example, store **querer [algo]** → **to want [something]** and **querer que [alguien] [haga algo]** → **to want [somebody] [to do something]**.
- Bracket the complete replaceable constituent, not every individual word. In **to want [to do something]**, the bracketed phrase can be replaced by another full infinitive phrase.
- Placeholder text explains the shape of the construction; it is not a mapping owned by that concept and must not automatically produce mapping tags.
- Text outside brackets expresses the stable mapping or structure taught by the concept.
- Write the Spanish verb inside a replaceable slot in the form the construction actually requires. For example, use **querer que [alguien] [haga algo]** and **quisiera que [alguien] [hiciera algo]**. The slot represents a real Spanish subordinate clause, not an infinitive dictionary form.
- Preserve a conjugated form outside a placeholder when that form is itself responsible for a distinct English mapping. **Quisiera** remains visible because it produces polite **would like**; its subordinate-action slot remains **[hiciera algo]** because Spanish requires the imperfect subjunctive there.

## 2026-08-21 — Curriculum role replaces teaching priority

- Every approved curriculum concept carries one editable `curriculumRole`: `core`, `supporting`, or `reference`.
- **Core** (emerald) is Core Functional Language that must be explicitly taught and practiced.
- **Supporting** (blue) is useful language taught incidentally around a Core focus rather than treated as the key lesson target.
- **Reference** (gray) is retained for completeness, future consideration, uncommon or situational use, or historical value; it is not a current teaching target.
- Curriculum role describes instructional treatment, not exact lesson order. Prerequisites, scaffolding, lesson clarity, and useful sentences still determine sequence.
- Review state is separate from curriculum role. A candidate remains in the inbox until the owner checks its approval control. Unchecked candidates return in the next review round; the owner's notes explain what should change or guide future audits. A checked candidate is ready for migration but is not copied into the approved database automatically.

### Completeness-audit workflow

- During an owner-requested completeness audit, include every plausible independently teachable mapping that survives the compositionality audit instead of prematurely omitting borderline entries.
- Assign each imported concept a provisional curriculum role based on independent expressive value, likely learner need, instructional treatment, availability of a simpler Core alternative, and situational breadth.
- Treat that role as a review aid, not an authoritative judgment. The owner may edit it or delete the concept during curation.
- This workflow favors loss prevention during discovery while keeping final course scope under deliberate owner control.

## 2026-08-21 — One Spanish mapping has exactly one English target

- Every curriculum record represents one Spanish concept or construction mapping to exactly one English realization.
- Never combine target alternatives with slash notation in the English field. Duplicate the Spanish source in separate records when it legitimately maps to several English targets.
- For example, **como quieras** → **however you want** and **como quieras** → **as you wish** are two mappings with independent IDs and curriculum roles.
- Likewise, **sin querer** → **accidentally** and **sin querer** → **unintentionally** are separate records.
- Curriculum role belongs to the individual Spanish-to-English edge, not to an undifferentiated bundle of synonyms.

## 2026-08-21 — Each mapping carries one generic bilingual example

- Every concept has one structured `example` containing a Spanish phrase and its English realization.
- Use the shortest natural phrase or sentence that unambiguously demonstrates the exact mapping, with as little incidental vocabulary as possible.
- Examples are evidence and clarification for the canonical mapping, not additional curriculum concepts or situational lesson scripts.
- Keep both sides separately machine-readable; do not combine the pair into one display string.

## 2026-08-21 — Curriculum role reflects independent expressive value

- Do not classify a mapping as Core merely because a form is common among native speakers.
- Ask whether the learner needs the concept to express something that cannot already be expressed clearly with Core Functional Language.
- For example, **no quiso [hacer algo]** may map nonliterally to **refused / wouldn't [do something]**, but a learner can communicate the same essential idea with Core language such as **decidió no [hacerlo]** → **decided not to [do it]**. It therefore should not be classified as Core solely because native speakers use it.
- Treat **idiomaticity** as a separate dimension from curriculum role. In this curriculum, an idiomatic mapping is one whose natural English cannot be produced reliably through direct composition.
- An idiomatic mapping can still be Core when it is necessary and highly productive, while an avoidable idiomatic alternative may be Supporting, Reference, or excluded from the main course.
- A future field may record mapping behavior such as `compositional` or `idiomatic`; do not encode that distinction inside the curriculum role.
