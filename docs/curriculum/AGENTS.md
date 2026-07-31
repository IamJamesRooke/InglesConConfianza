# Curriculum guidance

These Markdown files are human-readable curriculum specifications and the current intermediate source of truth. Source material comes from the owner's textbook and Excalidraw notes. Preserve the owner's accurate teaching logic and terminology while correcting errors and filling genuine conceptual gaps.

## Writing and organization

- Before editing or adding material, inspect the nearest related lessons and `confusion-sets/` for structure, terminology, duplication, and filename conventions.
- Keep each lesson compact and atomic; do not turn it into an exhaustive grammar chapter.
- Give every distinct meaning one strong, complete sentence example with enough context to resolve the pronoun, word, or grammatical distinction.
- Prefer coherent master sentence sets: minimally different sentences that teach the full contrast together.
- Prefer a transparent Spanish-to-English pattern over grammatical terminology when the learner can make the distinction directly from Spanish. Avoid labels such as **countable** and **uncountable** unless they are genuinely necessary to explain a contrast.
- Include natural standard contractions and relevant informal spoken reductions such as **kinda**, **gonna**, **wanna**, **gotta** and **lemme**. Distinguish standard contractions from phonetic spellings, explain register, and do not force a form into an unrelated lesson.
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

## English-to-Spanish words and particles

- Put high-frequency words whose meaning or function changes substantially with context under `/spanish-english-bridges/english-to-spanish/`; do not force them into a single part-of-speech folder merely because one use is a preposition, adverb, adjective, connector, or phrasal-verb particle.
- For multi-function words such as **on** and **off**, organize lessons by how much meaning a learner can infer: **core uses**, a visible **core picture**, **predictable extensions**, **fixed connections**, then **whole expressions** that must be memorized.
- Teach the reusable physical or conceptual image before idiomatic meanings. Clearly say when the image remains helpful and when context or memorization must carry the meaning.
- Keep ordinary preposition uses separate from phrasal verbs. Keep fixed combinations such as **depend on** or **plan on doing** separate from expressions whose complete meaning is not predictable, such as **put off** or **show off**.
- Use parts-of-speech terminology only when it resolves a real ambiguity. Prefer the learner-facing question “What does this word mean here?” and transparent Spanish bridges.
- Give every large translation-map folder a master README for fast review and every pedagogical subfolder its own linked summary table and one to three mastery phrases.

## Scope and uncertainty

- When converting source material, recommend its filename and location.
- Do not expand beyond the lesson's atomic scope or propose unrelated curriculum, architecture, automation, or maintenance work.
- Do not design or produce JSON schemas, database models, lesson engines, or import pipelines unless explicitly requested.
- If the source or intended distinction is unclear, identify the uncertainty instead of silently inventing content.
