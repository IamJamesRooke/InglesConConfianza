---
id: es-poder-formal-asking-permission--en-may-i-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: "¿puedo...?"
source_lemma: poder
target_language: en
target: May I...?
target_lemma: may
sense: formal-asking-permission
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
- id: es-puedo-formal-asking-permission--en-may-i
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puedo...?"
  source_lemma: poder
  source_variant: formal-asking-permission
  target_language: en
  target: May I...?
  target_lemma: may
  sense: formal-asking-permission
  taxonomy:
    category: expression
    subcategory: permission-expression
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
  - en-may-i-formal-asking-permission--es-puedo
  status: draft
  examples:
  - source: "¿Puedo pasar?"
    target: May I come in?
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **May I...?** for this poder meaning in the context shown.
  concept_id: es-poder-formal-asking-permission--en-may-i-concept
  form_surface: puedo
---
# **¿puedo...?** → **May I...?**

Use **May I...?** for a more formal request for permission.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
