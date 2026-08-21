# Curriculum Database Discovery

This document records the working decisions that emerge while representative curriculum data is entered in JSON. These are migration checkpoints, not a frozen relational schema.

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
