# Curriculum guidance

These Markdown files are human-readable curriculum specifications and the current intermediate source of truth. Source material comes from the owner's textbook and Excalidraw notes. Preserve the owner's accurate teaching logic and terminology while correcting errors and filling genuine conceptual gaps.

## Canonical pillars

- Use [`mappings/`](mappings/README.md) for frequent one-to-many translation choices. Its additional object and phase rules live in [`mappings/AGENTS.md`](mappings/AGENTS.md).
- Use [`cognates/`](cognates/README.md) for Spanish-English similarity, memory bridges, and false-cognate confusion sets.
- Use [`past-and-past-participle/`](past-and-past-participle/README.md) for the canonical sound-based inventory of English past and participle forms.
- Use [`transformations/`](transformations/README.md) for productive or memorable English prefix and suffix relationships.
- Use [`structure/`](structure/README.md) for reusable sentence-building rules.
- Use [`vocabulary/`](vocabulary/README.md) for flat, table-first reference categories that do not justify independent mapping families.

The hierarchy is an authoring reference, not a course sequence. Lessons and learner state will eventually reference curriculum objects from separate data layers.

## Writing and organization

- Before editing or adding material, inspect the nearest related lessons and `confusion-sets/` for structure, terminology, duplication, and filename conventions.
- Keep each lesson compact and atomic; do not turn it into an exhaustive grammar chapter.
- Give every distinct meaning one strong, complete sentence example with enough context to resolve the pronoun, word, or grammatical distinction.
- Prefer coherent master sentence sets: minimally different sentences that teach the full contrast together.
- Prefer a transparent Spanish-to-English pattern over grammatical terminology when the learner can make the distinction directly from Spanish. Avoid labels such as **countable** and **uncountable** unless they are genuinely necessary to explain a contrast.
- Include natural standard contractions and relevant informal spoken reductions such as **kinda**, **gonna**, **wanna**, **gotta** and **lemme**. During every migration audit, check whether the target construction has a natural contraction or spoken reduction; when it changes register or learner behavior, record it as a separate Supporting entry under the same construction. Distinguish standard contractions from phonetic spellings, explain register, and do not force a form into an unrelated lesson.
- When the words support it, use memorable tongue twisters or playful minimal-difference sentences that repeat similar-looking or similar-sounding forms with different meanings, such as **It's pretty important to be pretty** or **She quit because it was too quiet and found it quite boring**. Keep the contrast accurate and explain the teaching purpose.
- Always identify and teach relevant homophones, using context-rich contrastive sentences so learners distinguish both spelling and meaning. Include closely related sound contrasts when they prevent a likely pronunciation error.
- Treat each longer lesson as a complete concept map that can later be compressed into one to three mastery sentences. Aim for sentences whose combined vocabulary, grammar, sound contrasts, and context let a learner demonstrate the whole lesson without losing an essential distinction.
- For cognates, organize examples around a visible, reusable spelling pattern so a learner can infer unfamiliar pairs from one or two examples.
- Organize cognate lessons by learning difficulty: direct forms, spelling patterns, word families, memory bridges, then confusion sets. Treat parts of speech as secondary organization within those tiers.
- Add a `## False Cognates` section when a similar-looking Spanish word could lead learners to infer the wrong English meaning. State the contrast directly and illustrate both meanings in context; do not add empty sections or remote, unlikely traps.
- Preserve intentionally literal or humorous Spanish used as a bridge into English thinking, but label it as a teaching device and place the natural Spanish expression beside it. Do not present deliberately unnatural Spanish as a normal translation.
- Use natural Colombian/Latin American Spanish and `ustedes`, never `vosotros`. Correct inaccurate or unnatural Spanish honestly.
- Identify real English–Spanish distinctions that the source omits; do not mechanically preserve an incomplete mapping.
- Preserve useful source examples, but improve them when a clearer contextual sentence set teaches the same distinction better.
- Match the closest files' Markdown structure and established directory organization. Put focused contrasts under an appropriate `confusion-sets/` directory.
- Keep vocabulary flat: add material to the most useful root-level category file and express Core versus Supporting or Reference status inside the document rather than recreating directory trees.

## English-to-Spanish words and particles

- Put high-frequency words whose meaning or function changes substantially with context under `/mappings/`; do not force them into a single part-of-speech folder merely because one use is a preposition, adverb, adjective, connector, or phrasal-verb particle.
- For multi-function words such as **on** and **off**, organize lessons by how much meaning a learner can infer: **core uses**, a visible **core picture**, **predictable extensions**, **fixed connections**, then **whole expressions** that must be memorized.
- Teach the reusable physical or conceptual image before idiomatic meanings. Clearly say when the image remains helpful and when context or memorization must carry the meaning.
- Keep ordinary preposition uses separate from phrasal verbs. Keep fixed combinations such as **depend on** or **plan on doing** separate from expressions whose complete meaning is not predictable, such as **put off** or **show off**.
- Use parts-of-speech terminology only when it resolves a real ambiguity. Prefer the learner-facing question “What does this word mean here?” and transparent Spanish bridges.
- Give every large translation-map folder a master README for fast review and every pedagogical subfolder its own linked summary table and one to three mastery phrases.

## Scope and uncertainty

- When converting source material, recommend its filename and location.
- Do not expand beyond the lesson's atomic scope or propose unrelated curriculum, architecture, automation, or maintenance work.
- Do not design or produce JSON schemas, database models, lesson engines, or import pipelines unless explicitly requested. Add metadata incrementally when an approved lesson or migration task demonstrates the need.
- If the source or intended distinction is unclear, identify the uncertainty instead of silently inventing content.

## Current machine-readable migration problem

- The active discovery database is `web/data/curriculum.json`. The detailed record-shape decisions and migration checkpoints live in [`DATABASE-DISCOVERY.md`](DATABASE-DISCOVERY.md).
- The near-term success criterion is complete coverage of **Core Functional Language**, not perfect population of the entire curriculum database. Supporting and Reference classifications can remain provisional until Core coverage is secure.
- Work in small verb-family batches, normally one Spanish verb such as **querer** or **necesitar** at a time. Search this curriculum source for evidence, then audit for basic complements, infinitive and person-plus-action constructions, independently useful meanings, meaning-changing forms, common fixed expressions, and nonliteral English realizations.
- Present the proposed batch for owner review before migration. Make Core candidates especially easy to inspect. The owner should be able to approve them, change their curriculum role, correct or split a mapping, or delete low-value material without constructing the records manually.
- Treat the owner's approval notes as durable curation criteria: preserve them with the review batch and apply the resulting preferences to later audits. In particular, rank the most common useful mapping above secondary alternatives, keep advanced phrasal verbs Supporting or Reference by default, and omit unwanted sensitive senses even when a phrase has them outside the course context.
- A review candidate may be approved, left pending, or deleted. Deleted candidates stay in the review history with the owner's note, are excluded from migration, and may be restored if the owner later changes their mind.
- It is acceptable to include too many plausible non-Core mappings with provisional curriculum roles; they do not enter the main teaching path merely by existing. Avoid silently omitting a plausible independent mapping during a completeness audit.
- Still apply the compositionality test: do not create a separate record when the learner can reliably produce the result by combining concepts already taught. Do create a record when form, context, register, or construction changes the natural English mapping or teaching behavior.
- Every migrated mapping currently needs one Spanish concept, exactly one English target, one minimal generic bilingual example, appropriate collections, and a provisional curriculum role. Every verb-family record belongs to that verb's collection; add construction collections when they support reusable lesson planning.
- Collections may represent vocabulary, semantic collisions, grammatical patterns, phrasal-verb labels, particles, or lesson-plan groupings. Mark particle constructions with `phrasal verb` plus the particle collection such as `up`, `out`, `on`, or `with`, so later queries can find all Core or Supporting verbs using a given particle. Do not duplicate them with a separate grammar field unless actual migration work repeatedly exposes information that collections cannot represent.
- Treat the most common natural English realization as the initial Core teaching choice. Do not promote a competing polite, form-specific, or secondary realization to Core when it would add cognitive load before learners control the default mapping.
- Fixed expressions are normally Supporting unless they are necessary and productive Core Functional Language. Situationally narrow or archaic material belongs in Reference.
