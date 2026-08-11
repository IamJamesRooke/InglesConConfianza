---
id: es-poder-uncertain-past-event--en-might-have-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: puede que haya
source_lemma: poder
target_language: en
target: might have
target_lemma: might
sense: uncertain-past-event
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
form_count: 1
mapping_count: 1
mappings:
- id: es-puede-que-haya-uncertain-past-event--en-might-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede que haya
  source_lemma: poder
  source_variant: uncertain-past-event
  target_language: en
  target: might have
  target_lemma: might
  sense: uncertain-past-event
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
  - en-might-have-uncertain-past-event--es-puede-que-haya
  status: draft
  examples:
  - source: Puede que Ana haya tomado otro bus.
    target: Ana might have taken another bus.
  concept_id: es-poder-uncertain-past-event--en-might-have-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  form_surface: puede
  teaching_note: Use **might have** to present a tentative explanation for a past
    event.
---

# **puede que haya** → **might have**

Use **might have** to present a tentative explanation for a past event.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
