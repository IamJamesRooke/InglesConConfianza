# Curriculum Database Discovery

This document records the working decisions that emerge while representative curriculum data is entered in JSON. These are migration checkpoints, not a frozen relational schema.

## 2026-08-21 — Migrate necesitar and spoken-reduction follow-ups

- Migrated the approved `necesitar` audit: personal need, need + full infinitive, need somebody + full infinitive, and impersonal `se necesita`.
- Migrated the approved Supporting spoken reductions `wanna` and `needa` as separate entries under their parent full-infinitive constructions.
- No dedicated `necesitar` source folder existed to archive. Shared structure and pronunciation files remain active because they support multiple verb families.

## 2026-08-21 — First approved review batch migrated

- Completed the `querer` completeness audit through the Review inbox.
- Migrated six approved additions and one approved correction into `web/data/curriculum.json`, preserving the owner's final roles, collections, examples, and review notes.
- Marked the batch migrated in `web/data/curriculum-review.json` and moved the completed source folder to `docs/curriculum-archive/mappings/spanish-to-english/querer`.
- Archived source folders are excluded from normal audits and should be reopened only when the owner explicitly requests a correction or re-audit.

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
