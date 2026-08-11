---
id: es-poder-imperfect-indicative-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: imperfect-indicative
family_features:
  tense: past
  mood: indicative
  verb_form: finite
status: draft
form_count: 4
mapping_count: 8
forms:
- id: es-poder-imperfect-indicative-form-podia
  surface: podía
  source_features:
    grammatical_person:
    - first
    - third
    mood: indicative
    number: singular
    referent_person:
    - first
    - second
    - third
    tense: past
    verb_form: finite
- id: es-poder-imperfect-indicative-form-podiamos
  surface: podíamos
  source_features:
    grammatical_person: first
    mood: indicative
    number: plural
    referent_person: first
    tense: past
    verb_form: finite
- id: es-poder-imperfect-indicative-form-podian
  surface: podían
  source_features:
    grammatical_person: third
    mood: indicative
    number: plural
    referent_person:
    - second
    - third
    tense: past
    verb_form: finite
- id: es-poder-imperfect-indicative-form-podias
  surface: podías
  source_features:
    grammatical_person: second
    mood: indicative
    number: singular
    referent_person: second
    tense: past
    verb_form: finite
mappings:
- id: es-podia-general-past-ability--en-i-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podía
  source_lemma: poder
  source_variant: general-past-ability
  target_language: en
  target: I could
  target_lemma: could
  accepted_targets:
  - he could
  - she could
  - you could
  sense: general-past-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
  aliases:
  - yo podía
  - él podía
  - ella podía
  - usted podía
  index_under:
  - poder
  - podía
  reverse_status: linked
  reverse_ids:
  - en-i-could-general-past-ability--es-podia
  status: draft
  examples:
  - source: Cuando era niña, podía nadar durante horas.
    target: When I was a child, I could swim for hours.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podia
  teaching_note: Use **I could** for this poder meaning in the context shown.
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
  aliases:
  - yo podía
  - él podía
  - ella podía
  - usted podía
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
- id: es-podiamos-general-past-ability--en-we-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podíamos
  source_lemma: poder
  source_variant: general-past-ability
  target_language: en
  target: we could
  target_lemma: could
  sense: general-past-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
  aliases:
  - nosotros podíamos
  - nosotras podíamos
  index_under:
  - poder
  - podíamos
  reverse_status: linked
  reverse_ids:
  - en-we-could-general-past-ability--es-podiamos
  status: draft
  examples:
  - source: Antes podíamos trabajar desde casa.
    target: We could work from home before.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podiamos
  teaching_note: Use **we could** for this poder meaning in the context shown.
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
  aliases:
  - nosotros podíamos
  - nosotras podíamos
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
- id: es-podian-general-past-ability--en-they-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podían
  source_lemma: poder
  source_variant: general-past-ability
  target_language: en
  target: they could
  target_lemma: could
  accepted_targets:
  - you could
  sense: general-past-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
  aliases:
  - ellos podían
  - ellas podían
  - ustedes podían
  index_under:
  - poder
  - podían
  reverse_status: linked
  reverse_ids:
  - en-they-could-general-past-ability--es-podian
  status: draft
  examples:
  - source: Ellos podían entrar sin cita.
    target: They could enter without an appointment.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podian
  teaching_note: Use **they could** for this poder meaning in the context shown.
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
  aliases:
  - ellos podían
  - ellas podían
  - ustedes podían
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
- id: es-podias-general-past-ability--en-you-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podías
  source_lemma: poder
  source_variant: general-past-ability
  target_language: en
  target: you could
  target_lemma: could
  sense: general-past-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
  aliases:
  - tú podías
  index_under:
  - poder
  - podías
  reverse_status: linked
  reverse_ids:
  - en-you-could-general-past-ability--es-podias
  status: draft
  examples:
  - source: De niño, podías jugar afuera hasta tarde.
    target: As a child, you could play outside until late.
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podias
  teaching_note: Use **you could** for this poder meaning in the context shown.
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
  aliases:
  - tú podías
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
---

# Imperfect Indicative of **poder**

General past ability and repeated past permission. This family retains 4 trackable surface forms and 8 atomic translation choices.
