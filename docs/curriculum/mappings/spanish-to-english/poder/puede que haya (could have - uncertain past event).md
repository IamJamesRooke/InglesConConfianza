---
id: es-poder-uncertain-past-event--en-could-have-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: puede que haya
source_lemma: poder
target_language: en
target: could have
target_lemma: could
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
- id: es-puede-que-haya-uncertain-past-event--en-could-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede que haya
  source_lemma: poder
  source_variant: uncertain-past-event
  target_language: en
  target: could have
  target_lemma: could
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
  - en-could-have-uncertain-past-event--es-puede-que-haya
  status: draft
  examples:
  - source: Puede que Ana haya tomado otro bus.
    target: Ana could have taken another bus.
  concept_id: es-poder-uncertain-past-event--en-could-have-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  form_surface: puede
  teaching_note: Use **could have** when **puede que haya** gives a possible explanation
    for what happened.
---

# **puede que haya** → **could have**

Use **could have** when **puede que haya** gives a possible explanation for what happened.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
