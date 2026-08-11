---
id: es-poder-uncertain-event--en-might-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: puede que
source_lemma: poder
target_language: en
target: might
target_lemma: might
sense: uncertain-event
family_id: es-poder-present-indicative-family
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
taxonomy:
  category: verb
  subcategory: possibility-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-puede-que-uncertain-event--en-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede que
  source_lemma: poder
  source_variant: uncertain-event
  target_language: en
  target: might
  target_lemma: might
  sense: uncertain-event
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person: impersonal
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-might-uncertain-event--es-puede-que
  status: draft
  examples:
  - source: Puede que llueva esta noche.
    target: It might rain tonight.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **might** for this poder meaning in the context shown.
  concept_id: es-poder-uncertain-event--en-might-concept
  form_surface: puede
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **puede que** → **might**

Use **might** when **puede que** introduces an uncertain event.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
