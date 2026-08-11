# Mapping data-readiness contract

This document extends the atomic mapping contract in `AGENTS.md` with optional metadata that will make the eventual Markdown-to-database migration predictable. It does not define database tables, lesson sequencing, exercises, or learner state.

## The object boundary

A mapping object records one reusable translation choice:

> one source word, form, or expression → one target meaning

A mapping concept groups atomic surface variants that express the same directional translation choice. It does not replace the atomic choices. For example, **poder → can** for present ability is one concept, **puedo** and **puede** are independently trackable forms, and **puedo → I can** remains an atomic mapping. The present indicative is shared metadata across concepts, not the physical file boundary.

The mapping owns stable linguistic facts: its source and target, its meaning, examples, grammatical features, reverse edges, and useful contrasts.

The mapping does **not** own facts that change by lesson or learner. Do not put lesson position, taught/not-taught state, exposure counts, answers, errors, mastery, due dates, or review intervals in mapping YAML. Those will eventually reference mapping IDs from separate course, exercise, and learner records.

The examples inside a mapping object are concise evidence and explanation for the translation choice. They are not yet an exercise bank and do not need exercise IDs.

This creates four reusable curriculum levels without storing learner history in Markdown:

1. lemma: `poder`
2. form family: `present-indicative`
3. surface form: `puedo`
4. atomic translation choice: `puedo → I can`

An eventual exercise occurrence can reference all four. Two questions using **puedo** and **puede** therefore produce two exposures to the **present indicative of poder**, while preserving one exposure for each surface form and the particular meaning exercised by each sentence.

## Complete normalized metadata

Every normalized `kind: mapping` object requires `target_lemma` and `taxonomy`. Add `source_features` or `target_features` whenever that side encodes an inflected verb, a nonfinite verb form, grammatical person or number, or a pronominal function. A lexicalized nonverbal expression may omit grammatical features; omission is better than invented precision.

```yaml
target_lemma: be
accepted_targets:
  - "I'm"
taxonomy:
  category: verb
  subcategory: copula
source_features:
  grammatical_person: first
  referent_person: first
  number: singular
  tense: present
  mood: indicative
  verb_form: finite
target_features:
  grammatical_person: first
  referent_person: first
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
- `source_features` and `target_features` describe the forms on their respective sides. `grammatical_person` records the agreement pattern, while `referent_person` records who the form refers to. This distinction matters for mappings such as formal Spanish **lo** or an **usted** verb form, which use third-person grammar for a second-person referent.
- `contrast_ids` links concepts that learners need to distinguish. It is not a prerequisite or lesson-order list.

`aliases` remains source-side: spelling forms or source expressions that retrieve the same object. `accepted_targets` is target-side. Neither field should combine genuinely different meanings. When one Spanish form legitimately serves more than one subject, use one natural canonical target and enumerate the other real surface forms in `accepted_targets`; never use slash notation such as `they/you are` as a machine target.

Do not infer prerequisites during ordinary metadata normalization. Concept dependencies need their own deliberate audit, and course order belongs to future lesson records.

## Conjugated mapping concepts

Use `kind: mapping-concept` when a conjugated hub would otherwise create repetitive person- or number-specific files. The file represents one translation concept and its `mappings` list contains the complete atomic surface variants.

- `concept_id` identifies the particular translation concept exercised.
- `family_id` and `form_family` let an atomic mapping roll up to a tense-and-mood family.
- `form_id` and `form_surface` identify the particular bare conjugated form used by an exercise.
- `clause_type`, `polarity`, and conditional `question_type` let the application retrieve affirmative statements, negative statements, affirmative questions, and negative questions without interpreting prose or filenames.
- `source_lemma` supplies the lemma-level roll-up.
- `family_features` records only features genuinely shared by the family.
- `form_count` and `mapping_count` are validated summaries, not learner statistics.
- Nested mapping IDs and reverse IDs remain unchanged when files are collated.

Do not treat person-changing conjugations as aliases. **Puedo** and **puede** are sibling forms because they provide different morphology and subject evidence. Explicit-subject phrases such as **yo puedo** and **él puede** are example contexts, not aliases. Use aliases only for genuinely interchangeable source surfaces; otherwise preserve both forms and connect them through `family_id`.

## Controlled values introduced by the pilot

The controlled vocabulary grows only when a real normalization batch requires a new value. Use lowercase ASCII slugs.

### Taxonomy

- `category`: `pronoun`, `verb`, `expression`, `noun`
- `subcategory`: `personal-pronoun`, `adjective-nominalization`, `degree-expression`, `relative-pronoun`, `noun-expression`, `copula`, `existential`, `auxiliary`, `lexical-verb`, `state-expression`, `possession-expression`, `ability-expression`, `permission-expression`, `possibility-expression`, `opportunity-expression`, `request-expression`, `desire-expression`, `success-expression`, `obligation-expression`, `future-expression`, `passive-expression`, `modal-expression`, `fixed-expression`, `causative-expression`, `weather-expression`, `time-expression`

### Grammatical features

- `grammatical_person`: `first`, `second`, `third`, `impersonal`
- `referent_person`: `first`, `second`, `third`, `impersonal`
- `number`: `singular`, `plural`, `invariant`
- `gender`: `masculine`, `feminine`, `neuter`, `common`
- `animacy`: `person`, `animate`, `inanimate`, `abstract`, `mixed`
- `function`: `subject`, `direct-object`, `indirect-object`, `predicate`
- `tense`: `present`, `past`, `future`, `conditional`
- `mood`: `indicative`, `subjunctive`, `imperative`
- `verb_form`: `base`, `finite`, `infinitive`, `gerund`, `participle`

### Controlled form-family values

- `form_family`: `nonfinite`, `present-indicative`, `imperfect-indicative`, `preterite-indicative`, `future-indicative`, `conditional-indicative`, `present-subjunctive`, `imperfect-subjunctive`, `perfect-constructions`, `noun`

### Clause shape

- `clause_type`: `declarative`, `interrogative`
- `polarity`: `affirmative`, `negative`
- `question_type`: `yes-no`

Use these fields for a reusable clause frame, not an isolated dictionary word. Meaning remains in `sense`: two concepts may share the same clause shape while teaching different jobs such as ability, permission, or a polite request.

Do not force every field onto every object. For example, person and number help with `soy`, but not with the abstract expression `lo bueno`.

A feature may be a list when the same surface form is genuinely ambiguous. For example, `sería` can be first- or third-person singular. Do not use a list merely to combine mappings that should be separate.

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
primary_family_ids:
  - es-ser-present-indicative-family
primary_form_ids:
  - es-ser-present-indicative-form-soy
reinforces_mapping_ids: []
```

The complete sentence, its position in a lesson, and a learner's history belong outside the mapping. Stable family, form, and mapping IDs are the bridge between those future records and the curriculum source of truth. The example shape remains illustrative; no exercise record is created during mapping normalization.

## Completeness rule

The original mapping fields remain required for both top-level and nested atomic mappings. In addition, every normalized atomic object must contain a nonempty canonical `target_lemma` and a controlled `taxonomy`. Grammatical features are conditionally required as described above; `aliases`, `accepted_targets`, and `contrast_ids` remain conditional because empty or invented alternatives add no value. A mapping concept must contain accurate counts and complete nested mappings whose `concept_id`, `family_id`, `form_id`, and `form_surface` agree with the container and with every reuse of the same form reference. Later batches can add controlled values without changing the meaning of earlier objects.
