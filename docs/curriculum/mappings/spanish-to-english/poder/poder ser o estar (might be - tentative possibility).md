---
id: es-poder-tentative-possibility--en-might-be-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder ser o estar
source_lemma: poder
target_language: en
target: might be
target_lemma: be
sense: tentative-possibility
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
- id: es-podria-estar-tentative-state-location--en-might-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría estar
  source_lemma: poder
  source_variant: tentative-possibility-estar-reverse
  target_language: en
  target: might be
  target_lemma: be
  accepted_targets:
  - I might be
  - he might be
  - she might be
  - it might be
  sense: tentative-state-location
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
  - en-might-be-estar--es-podria-estar
  status: draft
  examples:
  - source: Ana podría estar ocupada esta tarde.
    target: Ana might be busy this afternoon.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **might be** for this poder expression in the context shown.
  concept_id: es-poder-tentative-possibility--en-might-be-concept
  form_surface: podría
  clause_type: declarative
  polarity: affirmative
- id: es-podria-ser-tentative-identity-characteristic--en-might-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría ser
  source_lemma: poder
  source_variant: tentative-possibility-ser-reverse
  target_language: en
  target: might be
  target_lemma: be
  accepted_targets:
  - I might be
  - he might be
  - she might be
  - it might be
  sense: tentative-identity-characteristic
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
  - en-might-be-ser--es-podria-ser
  status: draft
  examples:
  - source: Esa podría ser la mejor opción.
    target: That might be the best option.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **might be** for this poder expression in the context shown.
  concept_id: es-poder-tentative-possibility--en-might-be-concept
  form_surface: podría
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **poder ser o estar** → **might be**

Use **might be** for a more tentative identity, characteristic, state, or location.

Every entry in `mappings` is an independently trackable translation edge. They share the **conditional-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
