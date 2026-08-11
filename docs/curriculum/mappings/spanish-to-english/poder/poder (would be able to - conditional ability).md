---
id: es-poder-conditional-ability--en-would-be-able-to-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: would be able to
target_lemma: be
sense: conditional-ability
family_id: es-poder-conditional-indicative-family
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: ability-expression
status: draft
form_count: 4
mapping_count: 4
mappings:
- id: es-podria-conditional-ability--en-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría
  source_lemma: poder
  source_variant: conditional-ability-reverse
  target_language: en
  target: would be able to
  target_lemma: be
  accepted_targets:
  - I would be able to
  - I'd be able to
  - he would be able to
  - he'd be able to
  - she would be able to
  - she'd be able to
  - it would be able to
  - it'd be able to
  sense: conditional-ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-would-be-able-to--es-podria
  status: draft
  examples:
  - source: Ana podría ayudar si tuviera más tiempo.
    target: Ana would be able to help with more time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **would be able to** for this poder expression in the context
    shown.
  concept_id: es-poder-conditional-ability--en-would-be-able-to-concept
  form_surface: podría
  clause_type: declarative
  polarity: affirmative
- id: es-podriamos-conditional-explicit-ability--en-we-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podríamos
  source_lemma: poder
  source_variant: conditional-explicit-ability
  target_language: en
  target: we would be able to
  target_lemma: be
  sense: conditional-explicit-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podríamos
  reverse_status: linked
  reverse_ids:
  - en-we-would-be-able-to-conditional-explicit-ability--es-podriamos
  status: draft
  examples:
  - source: Podríamos terminar hoy.
    target: We would be able to finish today.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podriamos
  teaching_note: Use **we would be able to** for this poder meaning in the context
    shown.
  concept_id: es-poder-conditional-ability--en-would-be-able-to-concept
  form_surface: podríamos
  clause_type: declarative
  polarity: affirmative
- id: es-podrian-conditional-explicit-ability--en-they-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrían
  source_lemma: poder
  source_variant: conditional-explicit-ability
  target_language: en
  target: they would be able to
  target_lemma: be
  sense: conditional-explicit-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podrían
  reverse_status: linked
  reverse_ids:
  - en-they-would-be-able-to-conditional-explicit-ability--es-podrian
  status: draft
  examples:
  - source: Ellos podrían llegar tarde.
    target: They would be able to arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrian
  teaching_note: Use **they would be able to** for this poder meaning in the context
    shown.
  concept_id: es-poder-conditional-ability--en-would-be-able-to-concept
  form_surface: podrían
  clause_type: declarative
  polarity: affirmative
- id: es-podrias-conditional-explicit-ability--en-you-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrías
  source_lemma: poder
  source_variant: conditional-explicit-ability
  target_language: en
  target: you would be able to
  target_lemma: be
  sense: conditional-explicit-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podrías
  reverse_status: linked
  reverse_ids:
  - en-you-would-be-able-to-conditional-explicit-ability--es-podrias
  status: draft
  examples:
  - source: Podrías ayudar si tuvieras tiempo.
    target: You would be able to help if you had time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrias
  teaching_note: Use **you would be able to** for this poder meaning in the context
    shown.
  concept_id: es-poder-conditional-ability--en-would-be-able-to-concept
  form_surface: podrías
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **poder** → **would be able to**

Use **would be able to** when the conditional ability needs an explicit form of **be able to**.

Every entry in `mappings` is an independently trackable translation edge. They share the **conditional-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
