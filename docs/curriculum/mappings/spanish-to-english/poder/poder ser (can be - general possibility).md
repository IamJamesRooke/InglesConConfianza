---
id: es-poder-general-possibility--en-can-be-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder ser
source_lemma: poder
target_language: en
target: can be
target_lemma: can
sense: general-possibility
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
  subcategory: possibility-expression
status: draft
form_count: 2
mapping_count: 2
mappings:
- id: es-puede-ser-general-possibility--en-can-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede ser
  source_lemma: poder
  source_variant: general-possibility
  target_language: en
  target: can be
  target_lemma: can
  sense: general-possibility
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    tense: present
    mood: indicative
    verb_form: finite
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-can-be-general-possibility--es-puede-ser
  status: draft
  examples:
  - source: El tráfico en Bogotá puede ser pesado los viernes.
    target: Traffic in Bogotá can be heavy on Fridays.
  concept_id: es-poder-general-possibility--en-can-be-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  form_surface: puede
  teaching_note: Use **can be** for something that sometimes happens or is generally
    possible, not one uncertain event.
- id: es-pueden-ser-general-possibility--en-can-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pueden ser
  source_lemma: poder
  source_variant: general-possibility
  target_language: en
  target: can be
  target_lemma: can
  sense: general-possibility
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    tense: present
    mood: indicative
    verb_form: finite
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-can-be-general-possibility-plural--es-pueden-ser
  status: draft
  examples:
  - source: Los inviernos pueden ser fríos en esta región.
    target: Winters can be cold in this region.
  concept_id: es-poder-general-possibility--en-can-be-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  form_surface: pueden
  teaching_note: Use **can be** for something that sometimes happens or is generally
    possible, not one uncertain event.
---

# **poder ser** → **can be**

Use **can be** for something that sometimes happens or is generally possible, not one uncertain event.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
