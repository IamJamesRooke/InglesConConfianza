# Mapping data-readiness contract

This document extends the atomic mapping contract in `AGENTS.md` with optional metadata that will make the eventual Markdown-to-database migration predictable. It does not define database tables, lesson sequencing, exercises, or learner state.

## The object boundary

A mapping object records one reusable translation choice:

> one source word, form, or expression → one target meaning

The mapping owns stable linguistic facts: its source and target, its meaning, examples, grammatical features, reverse edges, and useful contrasts.

The mapping does **not** own facts that change by lesson or learner. Do not put lesson position, taught/not-taught state, exposure counts, answers, errors, mastery, due dates, or review intervals in mapping YAML. Those will eventually reference mapping IDs from separate course, exercise, and learner records.

The examples inside a mapping object are concise evidence and explanation for the translation choice. They are not yet an exercise bank and do not need exercise IDs.

## Optional data-readiness fields

The original required fields remain unchanged. Add these fields only when their values are known and useful; omission is better than invented precision.

```yaml
target_lemma: be
accepted_targets:
  - "I'm"
taxonomy:
  category: verb
  subcategory: copula
source_features:
  person: first
  number: singular
  tense: present
  mood: indicative
  verb_form: finite
target_features:
  person: first
  number: singular
  tense: present
  mood: indicative
  verb_form: finite
contrast_ids:
  - another-stable-mapping-id
```

- `target_lemma` is the canonical lookup form of the target. Use a dictionary headword for an inflected word, such as `be` for `am` or `ser` for `soy`. Use a stable uninflected pattern for an expression, such as `tener hambre` or `there be`.
- `accepted_targets` contains target-side forms that express the **same atomic choice** without creating a new teaching distinction. Natural contractions such as `I'm` for `I am` belong here. A genuinely different translation stays a separate mapping object.
- `taxonomy.category` and `taxonomy.subcategory` provide controlled retrieval fields. They answer questions such as “Which personal pronouns have not been taught?” without depending on filenames.
- `source_features` and `target_features` describe the forms on their respective sides. Keeping both prevents information loss when grammatical person, function, or form changes across languages.
- `contrast_ids` links concepts that learners need to distinguish. It is not a prerequisite or lesson-order list.

`aliases` remains source-side: spelling forms or source expressions that retrieve the same object. `accepted_targets` is target-side. Neither field should combine genuinely different meanings.

Do not infer prerequisites during ordinary metadata normalization. Concept dependencies need their own deliberate audit, and course order belongs to future lesson records.

## Controlled values introduced by the pilot

The controlled vocabulary grows only when a real normalization batch requires a new value. Use lowercase ASCII slugs.

### Taxonomy

- `category`: `pronoun`, `verb`, `expression`
- `subcategory`: `personal-pronoun`, `adjective-nominalization`, `degree-expression`, `relative-pronoun`, `copula`, `state-expression`, `ability-expression`, `existential`

### Grammatical features

- `person`: `first`, `second`, `third`, `impersonal`
- `number`: `singular`, `plural`, `invariant`
- `gender`: `masculine`, `feminine`, `neuter`, `common`
- `animacy`: `person`, `animate`, `inanimate`, `abstract`, `mixed`
- `function`: `subject`, `direct-object`, `indirect-object`, `predicate`
- `tense`: `present`, `past`, `future`, `conditional`
- `mood`: `indicative`, `subjunctive`, `imperative`
- `verb_form`: `base`, `finite`, `infinitive`, `gerund`, `participle`

Do not force every field onto every object. For example, person and number help with `soy`, but not with the abstract expression `lo bueno`.

Use the existing top-level `register` field when the mapping itself is formal, neutral, or informal. Grammatical features describe forms; they do not replace contextual constraints.

## Future exercise boundary

An eventual exercise block can reference one primary mapping and any concepts it reinforces. The shape below is illustrative only and must not be added as a curriculum object during mapping normalization:

```yaml
kind: exercise-block-example
source_text: "SOY PROFESOR DE INGLÉS"
accepted_target_texts:
  - "I am an English teacher"
  - "I'm an English teacher"
primary_mapping_ids:
  - es-soy-identity--en-i-am
reinforces_mapping_ids: []
```

The complete sentence, its position in a lesson, and a learner's history belong outside the mapping. The stable mapping ID is the bridge between those future records and the curriculum source of truth.

## Compatibility rule

The new fields are optional during normalization. Existing atomic objects remain valid without them. When a field is present, it must use this contract; later batches can add controlled values without changing the meaning of earlier objects.
