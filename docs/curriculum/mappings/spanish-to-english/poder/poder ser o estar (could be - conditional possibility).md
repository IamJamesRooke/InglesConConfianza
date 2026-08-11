---
id: es-poder-conditional-possibility--en-could-be-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder ser o estar
source_lemma: poder
target_language: en
target: could be
target_lemma: be
sense: conditional-possibility
family_id: es-poder-conditional-indicative-family
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: possibility-expression
status: draft
form_count: 1
mapping_count: 2
mappings:
- id: es-podria-estar-possible-state-location--en-could-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría estar
  source_lemma: poder
  source_variant: possibility-estar-reverse
  target_language: en
  target: could be
  target_lemma: be
  accepted_targets:
  - I could be
  - he could be
  - she could be
  - it could be
  sense: possible-state-location
  taxonomy:
    category: expression
    subcategory: modal-expression
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
    verb_form: finite
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-could-be-estar--es-podria-estar
  status: draft
  examples:
  - source: Ana podría estar cansada después del viaje.
    target: Ana could be tired after the trip.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **could be** for this poder expression in the context shown.
  concept_id: es-poder-conditional-possibility--en-could-be-concept
  form_surface: podría
- id: es-podria-ser-possible-identity-characteristic--en-could-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría ser
  source_lemma: poder
  source_variant: possibility-ser-reverse
  target_language: en
  target: could be
  target_lemma: be
  accepted_targets:
  - I could be
  - he could be
  - she could be
  - it could be
  sense: possible-identity-characteristic
  taxonomy:
    category: expression
    subcategory: modal-expression
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
    verb_form: finite
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-could-be-ser--es-podria-ser
  status: draft
  examples:
  - source: El ruido podría ser un problema.
    target: The noise could be a problem.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **could be** for this poder expression in the context shown.
  concept_id: es-poder-conditional-possibility--en-could-be-concept
  form_surface: podría
---
# **poder ser o estar** → **could be**

Use **could be** for a possible identity, characteristic, state, or location; Spanish still chooses **ser** or **estar**.

Every entry in `mappings` is an independently trackable translation edge. They share the **conditional-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
