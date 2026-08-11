---
id: es-poder-present-ability--en-can-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: can
target_lemma: can
sense: present-ability
family_id: es-poder-present-indicative-family
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
taxonomy:
  category: verb
  subcategory: ability-expression
status: draft
form_count: 5
mapping_count: 5
mappings:
- id: es-podemos-present-ability--en-we-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podemos
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: we can
  target_lemma: can
  sense: present-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podemos
  reverse_status: linked
  reverse_ids:
  - en-we-can-present-ability--es-podemos
  status: draft
  examples:
  - source: Podemos hablar después de la reunión.
    target: We can talk after the meeting.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-podemos
  teaching_note: Use **we can** for this poder meaning in the context shown.
  concept_id: es-poder-present-ability--en-can-concept
  form_surface: podemos
- id: es-puede-present-ability--en-she-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: she can
  target_lemma: can
  accepted_targets:
  - he can
  - it can
  - you can
  sense: present-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-she-can-present-ability--es-puede
  status: draft
  examples:
  - source: Ana puede conducir.
    target: Ana can drive.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **she can** for this poder meaning in the context shown.
  concept_id: es-poder-present-ability--en-can-concept
  form_surface: puede
- id: es-pueden-present-ability--en-they-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pueden
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: they can
  target_lemma: can
  accepted_targets:
  - you can
  sense: present-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-they-can-present-ability--es-pueden
  status: draft
  examples:
  - source: Ellos pueden trabajar desde casa.
    target: They can work from home.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  teaching_note: Use **they can** for this poder meaning in the context shown.
  concept_id: es-poder-present-ability--en-can-concept
  form_surface: pueden
- id: es-puedes-present-ability--en-you-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedes
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: you can
  target_lemma: can
  sense: present-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - puedes
  reverse_status: linked
  reverse_ids:
  - en-you-can-present-ability--es-puedes
  status: draft
  examples:
  - source: Puedes terminar el informe hoy.
    target: You can finish the report today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  teaching_note: Use **you can** for this poder meaning in the context shown.
  concept_id: es-poder-present-ability--en-can-concept
  form_surface: puedes
- id: es-puedo-present-ability--en-i-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedo
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: I can
  target_lemma: can
  sense: present-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-i-can-present-ability--es-puedo
  status: draft
  examples:
  - source: Puedo ayudarla hoy.
    target: I can help her today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **I can** for this poder meaning in the context shown.
  concept_id: es-poder-present-ability--en-can-concept
  form_surface: puedo
---
# **poder** → **can**

Use **can** when present-tense **poder** expresses ability.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
