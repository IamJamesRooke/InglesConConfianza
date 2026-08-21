# Curriculum Database Discovery

This document records the working decisions that emerge while representative curriculum data is entered in JSON. These are migration checkpoints, not a frozen relational schema.

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
- Write verbs inside replaceable Spanish slots in their root infinitive form. For example, use **querer que [alguien] [hacer algo]**, not **querer que [alguien] [haga algo]**, and **quisiera que [alguien] [hacer algo]**, not **[hiciera algo]**.
- Preserve a conjugated form outside a placeholder when that form is itself responsible for a distinct English mapping. **Quisiera** remains visible because it produces polite **would like**; only its replaceable action slot is normalized to **[hacer algo]**.

## 2026-08-21 — Teaching priority uses six color-coded tiers

- Every curriculum concept carries one editable `teachingPriority`: `essential`, `important`, `post_mastery`, `enrichment`, `supplemental`, or `reference`.
- **Essential** (emerald) means definite yes: high-priority functional language that must be taught.
- **Important** (blue) means useful, common language that should be taught after the essential foundation.
- **Post-Mastery** (purple) means worth teaching only after the earlier material is secure.
- **Enrichment** (amber) means nice to know, but not critical.
- **Supplemental** (rose) means optional material outside the main learning path.
- **Reference** (gray) means archaic, not worth teaching, or a candidate for deletion; it may remain temporarily to support completeness review.
- The tiers are ordinal, not mathematical. They express confident relative distinctions without implying false precision between nearby numeric scores.
- Priority does not prescribe an exact lesson order. Concepts with stronger priorities may be sequenced in whichever order best supports prerequisites, scaffolding, lesson clarity, and useful sentences.
- Priority and sequence remain separate: priority answers **what deserves lesson time first**; sequencing answers **in what pedagogical order it should be taught and reviewed**.
- Priority is curriculum metadata, not learner mastery, lesson membership, or evidence that a concept has already been taught.

### Completeness-audit workflow

- During an owner-requested completeness audit, include every plausible independently teachable mapping that survives the compositionality audit instead of prematurely omitting borderline entries.
- Assign each imported concept a provisional color tier based on frequency, independent expressive value, likely learner need, availability of a simpler core alternative, and situational breadth.
- Treat that tier as a review aid, not an authoritative judgment. The owner may edit it or delete the concept during curation.
- This workflow favors loss prevention during discovery while keeping final course scope under deliberate owner control.

## 2026-08-21 — One Spanish mapping has exactly one English target

- Every curriculum record represents one Spanish concept or construction mapping to exactly one English realization.
- Never combine target alternatives with slash notation in the English field. Duplicate the Spanish source in separate records when it legitimately maps to several English targets.
- For example, **como quieras** → **however you want** and **como quieras** → **as you wish** are two mappings with independent IDs and teaching priorities.
- Likewise, **sin querer** → **accidentally** and **sin querer** → **unintentionally** are separate records.
- Teaching priority belongs to the individual Spanish-to-English edge, not to an undifferentiated bundle of synonyms.

## 2026-08-21 — Each mapping carries one generic bilingual example

- Every concept has one structured `example` containing a Spanish phrase and its English realization.
- Use the shortest natural phrase or sentence that unambiguously demonstrates the exact mapping, with as little incidental vocabulary as possible.
- Examples are evidence and clarification for the canonical mapping, not additional curriculum concepts or situational lesson scripts.
- Keep both sides separately machine-readable; do not combine the pair into one display string.

## 2026-08-21 — Priority measures independent expressive value

- Do not assign a high teaching priority merely because a form is common among native speakers.
- Ask whether the learner needs the concept to express something that cannot already be expressed clearly with Core Functional Language.
- For example, **no quiso [hacer algo]** may map nonliterally to **refused / wouldn't [do something]**, but a learner can communicate the same essential idea with core language such as **decidió no [hacerlo]** → **decided not to [do it]**. It therefore should not be classified as **Common** solely because native speakers use it.
- Treat **idiomaticity** as a separate dimension from priority. In this curriculum, an idiomatic mapping is one whose natural English cannot be produced reliably through direct composition.
- An idiomatic mapping can still be core when it is necessary and highly productive, while an avoidable idiomatic alternative may be supplemental, situational, or excluded from the main course.
- A future field may record mapping behavior such as `compositional` or `idiomatic`; do not encode that distinction inside the priority name.
