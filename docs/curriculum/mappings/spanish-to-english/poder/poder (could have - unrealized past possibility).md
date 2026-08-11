---
id: es-poder-unrealized-past-possibility--en-could-have-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: could have
target_lemma: could
sense: unrealized-past-possibility
family_id: es-poder-perfect-constructions-family
form_family: perfect-constructions
family_features: {}
taxonomy:
  category: expression
  subcategory: possibility-expression
status: draft
form_count: 2
mapping_count: 2
mappings:
- id: es-habria-podido-unrealized-past-possibility--en-i-could-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: habría podido
  source_lemma: poder
  source_variant: unrealized-past-possibility
  target_language: en
  target: I could have
  target_lemma: could
  sense: unrealized-past-possibility
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - second
    - third
    number: singular
    tense: conditional
    mood: indicative
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
  - habría-podido
  reverse_status: linked
  reverse_ids:
  - en-i-could-have-unrealized-past-possibility--es-habria-podido
  status: draft
  examples:
  - source: Habría podido ayudar si me hubiera llamado.
    target: I could have helped if you had called me.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-habria-podido
  teaching_note: Use **I could have** for this poder meaning in the context shown.
  concept_id: es-poder-unrealized-past-possibility--en-could-have-concept
  form_surface: habría podido
  clause_type: declarative
  polarity: affirmative
- id: es-habriamos-podido-unrealized-past-possibility--en-we-could-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: habríamos podido
  source_lemma: poder
  source_variant: unrealized-past-possibility
  target_language: en
  target: we could have
  target_lemma: could
  sense: unrealized-past-possibility
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - habríamos-podido
  reverse_status: linked
  reverse_ids:
  - en-we-could-have-unrealized-past-possibility--es-habriamos-podido
  status: draft
  examples:
  - source: Habríamos podido terminar ayer.
    target: We could have finished yesterday.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-habriamos-podido
  teaching_note: Use **we could have** for this poder meaning in the context shown.
  concept_id: es-poder-unrealized-past-possibility--en-could-have-concept
  form_surface: habríamos podido
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **poder** → **could have**

Use **could have** for a past possibility or ability that was not realized.

Every entry in `mappings` is an independently trackable translation edge. They share the **perfect-constructions** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
