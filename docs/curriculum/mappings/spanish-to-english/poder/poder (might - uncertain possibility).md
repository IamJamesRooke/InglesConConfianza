---
id: es-poder-uncertain-possibility--en-might-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: might
target_lemma: might
sense: uncertain-possibility
family_id: es-poder-conditional-indicative-family
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
taxonomy:
  category: verb
  subcategory: possibility-expression
status: draft
form_count: 4
mapping_count: 4
mappings:
- id: es-podria-uncertain-possibility--en-i-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: I might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
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
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-i-might-uncertain-possibility--es-podria
  status: draft
  examples:
  - source: Yo podría llegar tarde.
    target: I might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **I might** for this poder meaning in the context shown.
  concept_id: es-poder-uncertain-possibility--en-might-concept
  form_surface: podría
  clause_type: declarative
  polarity: affirmative
- id: es-podriamos-uncertain-possibility--en-we-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podríamos
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: we might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
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
  - podríamos
  reverse_status: linked
  reverse_ids:
  - en-we-might-uncertain-possibility--es-podriamos
  status: draft
  examples:
  - source: Podríamos llegar tarde.
    target: We might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podriamos
  teaching_note: Use **we might** for this poder meaning in the context shown.
  concept_id: es-poder-uncertain-possibility--en-might-concept
  form_surface: podríamos
  clause_type: declarative
  polarity: affirmative
- id: es-podrian-uncertain-possibility--en-they-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrían
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: they might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podrían
  reverse_status: linked
  reverse_ids:
  - en-they-might-uncertain-possibility--es-podrian
  status: draft
  examples:
  - source: Ellos podrían llegar tarde.
    target: They might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrian
  teaching_note: Use **they might** for this poder meaning in the context shown.
  concept_id: es-poder-uncertain-possibility--en-might-concept
  form_surface: podrían
  clause_type: declarative
  polarity: affirmative
- id: es-podrias-uncertain-possibility--en-you-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrías
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: you might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
    subcategory: possibility-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podrías
  reverse_status: linked
  reverse_ids:
  - en-you-might-uncertain-possibility--es-podrias
  status: draft
  examples:
  - source: Tú podrías llegar tarde.
    target: You might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrias
  teaching_note: Use **you might** for this poder meaning in the context shown.
  concept_id: es-poder-uncertain-possibility--en-might-concept
  form_surface: podrías
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **poder** → **might**

Use **might** when conditional **poder** expresses uncertainty rather than ability.

Every entry in `mappings` is an independently trackable translation edge. They share the **conditional-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
