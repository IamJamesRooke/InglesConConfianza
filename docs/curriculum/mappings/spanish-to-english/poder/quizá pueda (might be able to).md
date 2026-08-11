---
id: es-poder-possible-ability--en-might-be-able-to-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: quizá pueda
source_lemma: poder
target_language: en
target: might be able to
target_lemma: be
sense: possible-ability
family_id: es-poder-present-subjunctive-family
form_family: present-subjunctive
family_features:
  tense: present
  mood: subjunctive
  verb_form: finite
taxonomy:
  category: expression
  subcategory: possibility-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-quiza-pueda-possible-ability--en-might-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: quizá pueda
  source_lemma: poder
  source_variant: possible-ability
  target_language: en
  target: might be able to
  target_lemma: be
  sense: possible-ability
  taxonomy:
    category: expression
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
    tense: present
    mood: subjunctive
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - pueda
  reverse_status: linked
  reverse_ids:
  - en-might-be-able-to-possible-ability--es-quiza-pueda
  status: draft
  examples:
  - source: Quizá pueda ayudarla mañana.
    target: I might be able to help her tomorrow.
  family_id: es-poder-present-subjunctive-family
  form_id: es-poder-present-subjunctive-form-pueda
  teaching_note: Use **might be able to** for this poder meaning in the context shown.
  concept_id: es-poder-possible-ability--en-might-be-able-to-concept
  form_surface: pueda
---
# **quizá pueda** → **might be able to**

Use **might be able to** when **quizá pueda** expresses uncertain ability.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-subjunctive** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
