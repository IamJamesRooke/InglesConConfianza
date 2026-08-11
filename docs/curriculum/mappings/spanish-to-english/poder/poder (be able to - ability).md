---
id: es-poder-ability--en-be-able-to-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: be able to
target_lemma: be
sense: ability
family_id: es-poder-nonfinite-family
form_family: nonfinite
family_features: {}
taxonomy:
  category: expression
  subcategory: ability-expression
status: draft
form_count: 2
mapping_count: 2
mappings:
- id: es-poder-ability--en-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: poder
  source_lemma: poder
  source_variant: ability-reverse
  target_language: en
  target: be able to
  target_lemma: be
  sense: ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    verb_form: infinitive
  target_features:
    verb_form: base
  index_under:
  - poder
  - base-form
  reverse_status: linked
  reverse_ids:
  - en-be-able-to--es-poder
  status: draft
  examples:
  - source: Quiero poder explicar la actividad en inglés.
    target: I want to be able to explain the activity in English.
  family_id: es-poder-nonfinite-family
  form_id: es-poder-nonfinite-form-base-form
  teaching_note: Use **be able to** for this poder expression in the context shown.
  concept_id: es-poder-ability--en-be-able-to-concept
  form_surface: poder
- id: es-pudiendo-ability--en-being-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudiendo
  source_lemma: poder
  source_variant: gerund-ability
  target_language: en
  target: being able to
  target_lemma: be
  sense: ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    verb_form: gerund
  target_features:
    verb_form: gerund
  index_under:
  - poder
  - pudiendo
  reverse_status: linked
  reverse_ids:
  - en-being-able-to-ability--es-pudiendo
  status: draft
  examples:
  - source: Sigue pudiendo trabajar desde casa.
    target: She keeps being able to work from home.
  family_id: es-poder-nonfinite-family
  form_id: es-poder-nonfinite-form-pudiendo
  teaching_note: Use **being able to** for this poder meaning in the context shown.
  concept_id: es-poder-ability--en-be-able-to-concept
  form_surface: pudiendo
---
# **poder** → **be able to**

Use **be able to** when **poder** expresses ability outside a simple modal form.

Every entry in `mappings` is an independently trackable translation edge. They share the **nonfinite** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
