---
id: es-poder-speculative-past-event--en-could-have-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: podría haber
source_lemma: poder
target_language: en
target: could have
target_lemma: could
sense: speculative-past-event
clause_type: declarative
polarity: affirmative
family_id: es-poder-conditional-indicative-family
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: possibility-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-podria-haber-speculative-past-event--en-could-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría haber
  source_lemma: poder
  source_variant: speculative-past-event
  target_language: en
  target: could have
  target_lemma: could
  sense: speculative-past-event
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
    tense: present
    mood: indicative
    verb_form: finite
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-could-have-speculative-past-event--es-podria-haber
  status: draft
  examples:
  - source: El ruido podría haber sido el viento.
    target: The noise could have been the wind.
  concept_id: es-poder-speculative-past-event--en-could-have-concept
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  form_surface: podría
  teaching_note: Use **could have** when **podría haber** gives a possible past explanation
    rather than an unrealized ability.
---

# **podría haber** → **could have**

Use **could have** when **podría haber** gives a possible past explanation rather than an unrealized ability.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
