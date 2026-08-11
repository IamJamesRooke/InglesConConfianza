---
id: es-poder-formal-denied-permission--en-may-not-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: no puede
source_lemma: poder
target_language: en
target: may not
target_lemma: may
sense: formal-denied-permission
family_id: es-poder-present-indicative-family
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: permission-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-no-puede-formal-denied-permission--en-you-may-not
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no puede
  source_lemma: poder
  source_variant: formal-denied-permission
  target_language: en
  target: you may not
  target_lemma: may
  sense: formal-denied-permission
  taxonomy:
    category: expression
    subcategory: permission-expression
  source_features:
    grammatical_person: third
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
  register: formal
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-you-may-not-formal-denied-permission--es-no-puede
  status: draft
  examples:
  - source: No puede entrar sin autorización.
    target: You may not enter without authorization.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **you may not** for this poder meaning in the context shown.
  concept_id: es-poder-formal-denied-permission--en-may-not-concept
  form_surface: puede
  clause_type: declarative
  polarity: negative
clause_type: declarative
polarity: negative
---
# **no puede** → **may not**

Use **may not** when formal **no puede** denies permission.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
