# Curriculum Database Contract

PostgreSQL is the curriculum source of truth. The former mappings, cognates, vocabulary, transformations, structure, and past-form folders have been captured and retired. Their raw documents remain immutable database provenance; all teachable content now lives in the single `curriculum_concepts` catalog.

## Concept shape

Every curriculum concept has:

- one normalized Spanish source;
- exactly one normalized English target;
- one generic Spanish example and its natural English equivalent;
- reusable collections for retrieval and lesson building; and
- exactly one curriculum role: `core`, `supporting`, or `reference`.

The database is a Spanish-to-English map. Only Spanish belongs in Spanish fields and only English belongs in English fields. Keep independently teachable phrases and constructions intact instead of reducing everything to dictionary words.

## Normalization

- Store ordinary verbs as infinitives with meaningful slots: `comer [algo]` -> `to eat [something]`.
- Store nouns with natural Spanish articles when the concept is nominal: `el territorio` -> `territory`.
- Store adjective and state mappings with the support verb that expresses the intended meaning: `ser listo` -> `to be smart`, `estar listo` -> `to be ready`, and `tener hambre` -> `to be hungry`.
- Use stable bracket placeholders such as `[algo]`, `[alguien]`, `[hacer algo]`, `[something]`, `[somebody]`, and `[to do something]`.
- Preserve one target per concept. Split bundled alternatives when they have different meanings or teaching behavior.
- Store transformations as one normalized relationship on each side using ` ==> `, for example `el poder ==> ser poderoso/a` and `the power ==> to be powerful`.
- Keep English `be` forms independently searchable when their surface form matters. Use collections such as `to be`, `am`, `is`, and `are` without changing the Spanish-first record direction.

## Collections

Collections are flat, reusable query labels. They may describe:

- part of speech: `verb`, `noun`, `adjective`, `adverb`;
- semantic families: `days of the week`, `date`, `time`, `location`;
- constructions: `followed by full infinitive`, `followed by bare infinitive`, `followed by gerund`, `uses past participle`;
- transformations and morphology: `transformation: -ful`, `transformation: noun => adjective`, `prefix: be-`;
- cognate and spelling families, including false cognates;
- phrasal verbs, including both the lexical root and every stable particle; and
- pronunciation families and homophones.

Prefer controlled, predictable labels. During curation, merge spelling variants, vague one-off labels, and collections that encode the same idea. Do not introduce a second tag system until demonstrated needs exceed collections.

## Curriculum roles

- `core`: language learners must explicitly master to make basic English function. Frequency alone is insufficient; every concept must earn this role.
- `supporting`: highly useful, broadly reusable language that directly strengthens Core instruction. This tier is also selective.
- `reference`: useful but secondary, situational, specialized, readily inferable, or retained for later retrieval.

Promotion and demotion are curation decisions. Deleting genuinely low-value material is expected now that lossless source provenance is secure.

## Curation workflow

1. Select a bounded database slice by role, collection, source family, or suspicious pattern.
2. Inspect canonical concepts and likely duplicates together.
3. Delete low-value or malformed concepts, merge true duplicates, normalize retained records, and simplify their collections.
4. Check that examples remain generic, bilingual, and natural.
5. Export updated immutable snapshots through the established script when the batch is approved, then run database regression tests and snapshot parity verification.

Do not attempt to perfect all curriculum records before lesson building. Complete the broad correctness and priority pass, then let Module 1 expose the next high-value curation work.
