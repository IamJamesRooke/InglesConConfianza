---
id: es-poder-negative-present-perfect-ability--en-have-not-been-able-to-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: no poder
source_lemma: poder
target_language: en
target: have not been able to
target_lemma: be
sense: negative-present-perfect-ability
family_id: es-poder-perfect-constructions-family
form_family: perfect-constructions
family_features: {}
taxonomy:
  category: expression
  subcategory: ability-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-no-hemos-podido-negative-present-perfect-ability--en-we-haven-t-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no hemos podido
  source_lemma: poder
  source_variant: negative-present-perfect-ability
  target_language: en
  target: we haven't been able to
  target_lemma: be
  sense: negative-present-perfect-ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - hemos-podido
  reverse_status: linked
  reverse_ids:
  - en-we-haven-t-been-able-to-negative-present-perfect-ability--es-no-hemos-podido
  status: draft
  examples:
  - source: No hemos podido encontrar un apartamento económico.
    target: We haven't been able to find an affordable apartment.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-hemos-podido
  teaching_note: Use **we haven't been able to** for this poder meaning in the context
    shown.
  concept_id: es-poder-negative-present-perfect-ability--en-have-not-been-able-to-concept
  form_surface: hemos podido
  clause_type: declarative
  polarity: negative
clause_type: declarative
polarity: negative
---
# **no poder** → **have not been able to**

Use **haven't/hasn't been able to** when present-perfect **poder** is negative.

Every entry in `mappings` is an independently trackable translation edge. They share the **perfect-constructions** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
