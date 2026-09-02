# Curriculum Database Contract

PostgreSQL is the curriculum source of truth. The former mappings, cognates, vocabulary, transformations, structure, and past-form folders have been captured and retired. Their raw documents remain immutable database provenance; all teachable content now lives in the single `curriculum_concepts` catalog.

## Concept shape

Every curriculum concept has:

- one normalized Spanish source;
- exactly one normalized English target;
- one generic Spanish example and its natural English equivalent;
- reusable collections for retrieval and lesson building; and
- exactly one curriculum role: `core`, `supporting`, `reference`, or `trash`.

The database is a Spanish-to-English map. Only Spanish belongs in Spanish fields and only English belongs in English fields. Keep independently teachable phrases and constructions intact instead of reducing everything to dictionary words.

## Normalization

- Store ordinary verbs as infinitives with meaningful slots: `comer [algo]` -> `to eat [something]`.
- Store nouns with natural Spanish articles when the concept is nominal: `el territorio` -> `territory`.
- Store adjective and state mappings with the support verb that expresses the intended meaning: `ser listo` -> `to be smart`, `estar listo` -> `to be ready`, and `tener hambre` -> `to be hungry`.
- Use stable bracket placeholders such as `[algo]`, `[alguien]`, `[hacer algo]`, `[something]`, `[somebody]`, and `[to do something]`.
- Preserve one target per concept. Split bundled alternatives when they have different meanings or teaching behavior.
- Store transformations as one normalized relationship on each side using ` ==> `, for example `el poder ==> ser poderoso/a` and `the power ==> to be powerful`.
- Keep English `be` forms independently searchable when their surface form matters, via `en:` and `grammar:` collections, without changing the Spanish-first record direction.

## Collections

Collections are reusable query labels stored as a flat `string[]` on each concept, but they follow a `facet:value` naming convention. The controlled vocabulary and the allowed facets live in `web/src/lib/curriculum/collections.ts`; the database regression test rejects any collection whose facet is unknown, and any bare (un-namespaced) name not in that file's shrinking `LEGACY_COLLECTIONS` set.

Facets:

- `es:` / `en:` — Spanish and English headword. Every sense and construction of one lemma under one tag, so the catalog is queryable as a bilingual dictionary: "English translations of ganar" is `es:ganar`; "Spanish translations of know" is `en:know`. The two directions are independent because the mapping is many-to-many at the word level.
- `pos:` — part of speech.
- `grammar:` — grammatical subcategory (`grammar:subject-pronoun`, `grammar:third-person`, `grammar:modal`, `grammar:phrasal-verb`). Nesting is expressed by co-tagging: a concept carries `pos:pronoun` and `grammar:subject-pronoun`.
- `construction:` — sentence pattern or verb-complement shape (`construction:followed-by-gerund`, `construction:there-be`).
- `form:` — verb form (`form:past`, `form:past-participle`, `form:third-person`).
- `morphology:` — affix and derivation (`morphology:suffix-ful`, `morphology:noun-to-adjective`).
- `cognate:` — cognate type and spelling-pattern family (`cognate:true`, `cognate:false-friend`, `cognate:spelling-pattern`).
- `sound:` / `rhyme:` / `homophone:` — pronunciation families; `rhyme:` and `homophone:` are keyed by IPA.
- `particle:` — phrasal-verb particle.
- `topic:` — semantic domain (`topic:time`, `topic:date`).
- `register:` / `dialect:` — formality and regional variety.

During curation, apply collection changes from a reviewed manifest via `curriculum:collections:apply` (DELETE / MERGE / RENAME ops), recorded under `docs/curation/`. Merge spelling variants and collections that encode the same idea; give a new tag a facet. Do not introduce a second tag system until demonstrated needs exceed collections.

## Curriculum roles

- `core`: language learners must explicitly master to make basic English function. Frequency alone is insufficient; every concept must earn this role.
- `supporting`: highly useful, broadly reusable language that directly strengthens Core instruction. This tier is also selective.
- `reference`: useful but secondary, situational, specialized, readily inferable, or retained for later retrieval.
- `trash`: a staging tier for deletion candidates only. Nothing teaching-facing reads it. Concepts sit here, filterable and recoverable, until the owner bulk-deletes the `/curriculum?role=trash` survivors.

Promotion and demotion are curation decisions. Retiring genuinely low-value material is expected now that lossless source provenance is secure — move it to `trash` rather than deleting it as a judgement call.

## Curation workflow

1. Select a bounded database slice by role, collection, source family, or suspicious pattern.
2. Inspect canonical concepts and likely duplicates together.
3. Move low-value or malformed concepts to `trash`, merge true duplicates, normalize retained records, and simplify their collections.
4. Check that examples remain generic, bilingual, and natural.
5. Apply the batch from a reviewed TSV manifest (`curriculum:roles:apply`, `curriculum:concepts:apply`), recorded under `docs/curation/`. Export updated immutable snapshots, then run database regression tests and snapshot parity verification.

Do not attempt to perfect all curriculum records before lesson building. Complete the broad correctness and priority pass, then let Module 1 expose the next high-value curation work.
