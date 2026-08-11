---
id: es-poder-speculative-past-event--en-might-have-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: podría haber
source_lemma: poder
target_language: en
target: might have
target_lemma: might
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
- id: es-podria-haber-speculative-past-event--en-might-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría haber
  source_lemma: poder
  source_variant: speculative-past-event
  target_language: en
  target: might have
  target_lemma: might
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
  - en-might-have-speculative-past-event--es-podria-haber
  status: draft
  examples:
  - source: Ana podría haber tomado otro bus.
    target: Ana might have taken another bus.
  concept_id: es-poder-speculative-past-event--en-might-have-concept
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  form_surface: podría
  teaching_note: Use **might have** when **podría haber** speculates about a possible
    past event.
---

# **podría haber** → **might have**

Use **might have** when **podría haber** speculates about a possible past event.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
