---
id: es-poder-general-past-ability--en-could-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: could
target_lemma: could
sense: general-past-ability
family_id: es-poder-imperfect-indicative-family
form_family: imperfect-indicative
family_features:
  tense: past
  mood: indicative
  verb_form: finite
taxonomy:
  category: verb
  subcategory: ability-expression
status: draft
form_count: 4
mapping_count: 4
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
  concept_id: es-poder-general-past-ability--en-could-concept
  form_surface: podía
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
  concept_id: es-poder-general-past-ability--en-could-concept
  form_surface: podíamos
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
  concept_id: es-poder-general-past-ability--en-could-concept
  form_surface: podían
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
  concept_id: es-poder-general-past-ability--en-could-concept
  form_surface: podías
---
# **poder** → **could**

Use **could** for a general or repeated past ability.

Every entry in `mappings` is an independently trackable translation edge. They share the **imperfect-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
