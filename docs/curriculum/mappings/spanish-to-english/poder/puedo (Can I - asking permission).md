---
id: es-poder-asking-permission--en-can-i-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: "¿puedo...?"
source_lemma: poder
target_language: en
target: Can I...?
target_lemma: can
sense: asking-permission
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
- id: es-puedo-asking-permission--en-can-i
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puedo...?"
  source_lemma: poder
  source_variant: asking-permission
  target_language: en
  target: Can I...?
  target_lemma: can
  sense: asking-permission
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
  - en-can-i-asking-permission--es-puedo
  status: draft
  examples:
  - source: "¿Puedo usar su teléfono?"
    target: Can I use your phone?
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **Can I...?** for this poder meaning in the context shown.
  concept_id: es-poder-asking-permission--en-can-i-concept
  form_surface: puedo
---
# **¿puedo...?** → **Can I...?**

Use **Can I...?** for an ordinary request for permission.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
