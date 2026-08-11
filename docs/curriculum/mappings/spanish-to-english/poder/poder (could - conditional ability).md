---
id: es-poder-conditional-ability--en-could-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: could
target_lemma: could
sense: conditional-ability
family_id: es-poder-conditional-indicative-family
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
taxonomy:
  category: verb
  subcategory: ability-expression
status: draft
form_count: 4
mapping_count: 4
mappings:
- id: es-podria-conditional-ability--en-i-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: I could
  target_lemma: could
  accepted_targets:
  - he could
  - she could
  - you could
  sense: conditional-ability
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
    tense: conditional
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
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-i-could-conditional-ability--es-podria
  status: draft
  examples:
  - source: Yo podría ayudar si tuviera tiempo.
    target: I could help if I had time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **I could** for this poder meaning in the context shown.
  concept_id: es-poder-conditional-ability--en-could-concept
  form_surface: podría
- id: es-podriamos-conditional-ability--en-we-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podríamos
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: we could
  target_lemma: could
  sense: conditional-ability
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
  - en-we-could-conditional-ability--es-podriamos
  status: draft
  examples:
  - source: Podríamos terminar hoy.
    target: We could finish today.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podriamos
  teaching_note: Use **we could** for this poder meaning in the context shown.
  concept_id: es-poder-conditional-ability--en-could-concept
  form_surface: podríamos
- id: es-podrian-conditional-ability--en-they-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrían
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: they could
  target_lemma: could
  accepted_targets:
  - you could
  sense: conditional-ability
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
  - en-they-could-conditional-ability--es-podrian
  status: draft
  examples:
  - source: Ellos podrían llegar tarde.
    target: They could arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrian
  teaching_note: Use **they could** for this poder meaning in the context shown.
  concept_id: es-poder-conditional-ability--en-could-concept
  form_surface: podrían
- id: es-podrias-conditional-ability--en-you-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrías
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: you could
  target_lemma: could
  sense: conditional-ability
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
  - en-you-could-conditional-ability--es-podrias
  status: draft
  examples:
  - source: Podrías ayudar si tuvieras tiempo.
    target: You could help if you had time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrias
  teaching_note: Use **you could** for this poder meaning in the context shown.
  concept_id: es-poder-conditional-ability--en-could-concept
  form_surface: podrías
---
# **poder** → **could**

Use **could** for conditional or hypothetical ability.

Every entry in `mappings` is an independently trackable translation edge. They share the **conditional-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
