---
id: es-poder-present-possibility--en-may-be-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder ser o estar
source_lemma: poder
target_language: en
target: may be
target_lemma: be
sense: present-possibility
family_id: es-poder-present-indicative-family
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: possibility-expression
status: draft
form_count: 1
mapping_count: 2
mappings:
- id: es-puede-estar-possible-state-location--en-may-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede estar
  source_lemma: poder
  source_variant: possibility-estar-reverse
  target_language: en
  target: may be
  target_lemma: be
  accepted_targets:
  - he may be
  - she may be
  - it may be
  sense: possible-state-location
  taxonomy:
    category: expression
    subcategory: modal-expression
  source_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person: third
    number: singular
    verb_form: finite
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-may-be-estar--es-puede-estar
  status: draft
  examples:
  - source: Ana puede estar en su oficina.
    target: Ana may be in her office.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **may be** for this poder expression in the context shown.
  concept_id: es-poder-present-possibility--en-may-be-concept
  form_surface: puede
- id: es-puede-ser-possible-identity-characteristic--en-may-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede ser
  source_lemma: poder
  source_variant: possibility-ser-reverse
  target_language: en
  target: may be
  target_lemma: be
  accepted_targets:
  - he may be
  - she may be
  - it may be
  sense: possible-identity-characteristic
  taxonomy:
    category: expression
    subcategory: modal-expression
  source_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person: third
    number: singular
    verb_form: finite
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-may-be-ser--es-puede-ser
  status: draft
  examples:
  - source: La demora puede ser un problema.
    target: The delay may be a problem.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **may be** for this poder expression in the context shown.
  concept_id: es-poder-present-possibility--en-may-be-concept
  form_surface: puede
---
# **poder ser o estar** → **may be**

Use **may be** for a possible identity, characteristic, state, or location; Spanish still chooses **ser** or **estar**.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
