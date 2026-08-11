---
id: es-poder-repeated-past-permission--en-was-allowed-to-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: was allowed to
target_lemma: be
sense: repeated-past-permission
family_id: es-poder-imperfect-indicative-family
form_family: imperfect-indicative
family_features:
  tense: past
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: permission-expression
status: draft
form_count: 4
mapping_count: 4
mappings:
- id: es-podia-repeated-past-permission--en-i-was-allowed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podía
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: I was allowed to
  target_lemma: be
  accepted_targets:
  - he was allowed to
  - she was allowed to
  - you were allowed to
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podía
  reverse_status: linked
  reverse_ids:
  - en-i-was-allowed-to-repeated-past-permission--es-podia
  status: draft
  examples:
  - source: Cuando era niña, podía nadar durante horas.
    target: When I was a child, I was allowed to swim for hours.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podia
  teaching_note: Use **I was allowed to** for this poder meaning in the context shown.
  concept_id: es-poder-repeated-past-permission--en-was-allowed-to-concept
  form_surface: podía
  clause_type: declarative
  polarity: affirmative
- id: es-podiamos-repeated-past-permission--en-we-were-allowed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podíamos
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: we were allowed to
  target_lemma: be
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podíamos
  reverse_status: linked
  reverse_ids:
  - en-we-were-allowed-to-repeated-past-permission--es-podiamos
  status: draft
  examples:
  - source: Antes podíamos trabajar desde casa.
    target: We were allowed to work from home before.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podiamos
  teaching_note: Use **we were allowed to** for this poder meaning in the context
    shown.
  concept_id: es-poder-repeated-past-permission--en-was-allowed-to-concept
  form_surface: podíamos
  clause_type: declarative
  polarity: affirmative
- id: es-podian-repeated-past-permission--en-they-were-allowed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podían
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: they were allowed to
  target_lemma: be
  accepted_targets:
  - you were allowed to
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podían
  reverse_status: linked
  reverse_ids:
  - en-they-were-allowed-to-repeated-past-permission--es-podian
  status: draft
  examples:
  - source: Ellos podían entrar sin cita.
    target: They were allowed to enter without an appointment.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podian
  teaching_note: Use **they were allowed to** for this poder meaning in the context
    shown.
  concept_id: es-poder-repeated-past-permission--en-was-allowed-to-concept
  form_surface: podían
  clause_type: declarative
  polarity: affirmative
- id: es-podias-repeated-past-permission--en-you-were-allowed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podías
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: you were allowed to
  target_lemma: be
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podías
  reverse_status: linked
  reverse_ids:
  - en-you-were-allowed-to-repeated-past-permission--es-podias
  status: draft
  examples:
  - source: De niño, podías jugar afuera hasta tarde.
    target: As a child, you were allowed to play outside until late.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podias
  teaching_note: Use **you were allowed to** for this poder meaning in the context
    shown.
  concept_id: es-poder-repeated-past-permission--en-was-allowed-to-concept
  form_surface: podías
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **poder** → **was allowed to**

Use **was/were allowed to** for repeated or background past permission.

Every entry in `mappings` is an independently trackable translation edge. They share the **imperfect-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
