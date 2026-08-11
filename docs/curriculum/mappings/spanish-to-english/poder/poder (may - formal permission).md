---
id: es-poder-formal-permission--en-may-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: may
target_lemma: may
sense: formal-permission
clause_type: declarative
polarity: affirmative
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
- id: es-puede-formal-permission--en-you-may
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede
  source_lemma: poder
  source_variant: formal-permission
  target_language: en
  target: you may
  target_lemma: may
  sense: formal-permission
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
    tense: present
    mood: indicative
    verb_form: finite
    grammatical_person: second
    referent_person: second
    number: singular
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-may-formal-permission--es-puede
  status: draft
  examples:
  - source: Puede comenzar cuando esté listo.
    target: You may begin when you're ready.
  concept_id: es-poder-formal-permission--en-may-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  form_surface: puede
  teaching_note: Use **may** when present-tense **poder** gives permission in a formal
    or careful register.
---

# **poder** → **may**

Use **may** when present-tense **poder** gives permission in a formal or careful register.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
