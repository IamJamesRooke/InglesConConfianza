---
id: es-poder-past-perfect-ability--en-had-been-able-to-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: had been able to
target_lemma: be
sense: past-perfect-ability
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
- id: es-habia-podido-past-perfect-ability--en-i-had-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: había podido
  source_lemma: poder
  source_variant: past-perfect-ability
  target_language: en
  target: I had been able to
  target_lemma: be
  sense: past-perfect-ability
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
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - había-podido
  reverse_status: linked
  reverse_ids:
  - en-i-had-been-able-to-past-perfect-ability--es-habia-podido
  status: draft
  examples:
  - source: Hasta entonces, había podido trabajar desde casa.
    target: Until then, I had been able to work from home.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-habia-podido
  teaching_note: Use **I had been able to** for this poder meaning in the context
    shown.
  concept_id: es-poder-past-perfect-ability--en-had-been-able-to-concept
  form_surface: había podido
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **poder** → **had been able to**

Use **had been able to** for ability completed before another past point.

Every entry in `mappings` is an independently trackable translation edge. They share the **perfect-constructions** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
