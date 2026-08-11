---
id: es-poder-nonfinite-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: nonfinite
family_features: {}
status: draft
form_count: 3
mapping_count: 4
forms:
- id: es-poder-nonfinite-form-base-form
  surface: poder
  source_features:
    verb_form: infinitive
- id: es-poder-nonfinite-form-podido
  surface: podido
  source_features:
    verb_form: participle
- id: es-poder-nonfinite-form-pudiendo
  surface: pudiendo
  source_features:
    verb_form: gerund
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
  aliases: []
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
- id: es-poder-permission--en-be-allowed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: poder
  source_lemma: poder
  source_variant: permission-reverse
  target_language: en
  target: be allowed to
  target_lemma: be
  sense: permission
  taxonomy:
    category: expression
    subcategory: modal-expression
  source_features:
    verb_form: infinitive
  target_features:
    verb_form: base
  aliases: []
  index_under:
  - poder
  - base-form
  reverse_status: linked
  reverse_ids:
  - en-be-allowed-to--es-poder
  status: draft
  examples:
  - source: "¿Podemos parquear aquí?"
    target: Are we allowed to park here?
  family_id: es-poder-nonfinite-family
  form_id: es-poder-nonfinite-form-base-form
  teaching_note: Use **be allowed to** for this poder expression in the context shown.
- id: es-podido-perfect-ability--en-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podido
  source_lemma: poder
  source_variant: perfect-ability-reverse
  target_language: en
  target: been able to
  target_lemma: be
  sense: perfect-ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    verb_form: participle
  target_features:
    verb_form: participle
  aliases: []
  index_under:
  - poder
  - podido
  reverse_status: linked
  reverse_ids:
  - en-been-able-to--es-podido
  status: draft
  examples:
  - source: Todavía no he podido llamar a Ana.
    target: I haven't been able to call Ana yet.
  family_id: es-poder-nonfinite-family
  form_id: es-poder-nonfinite-form-podido
  teaching_note: Use **been able to** for this poder expression in the context shown.
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
  aliases: []
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
---

# Infinitive and Nonfinite Forms of **poder**

The infinitive, gerund, and participle forms of poder. This family retains 3 trackable surface forms and 4 atomic translation choices.
