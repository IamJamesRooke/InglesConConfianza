---
id: es-poder-repeated-past-permission--en-could-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: could
target_lemma: could
sense: repeated-past-permission
clause_type: declarative
polarity: affirmative
family_id: es-poder-imperfect-indicative-family
form_family: imperfect-indicative
family_features:
  tense: past
  mood: indicative
  verb_form: finite
taxonomy:
  category: verb
  subcategory: permission-expression
status: draft
form_count: 4
mapping_count: 4
mappings:
- id: es-podia-repeated-past-permission--en-i-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podía
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: I could
  target_lemma: could
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
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
    tense: past
    mood: indicative
    verb_form: finite
    grammatical_person: first
    referent_person: first
    number: singular
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - podía
  reverse_status: linked
  reverse_ids:
  - en-i-could-repeated-past-permission--es-podia
  status: draft
  examples:
  - source: De niño, podía jugar afuera hasta tarde los sábados.
    target: As a child, I could play outside late on Saturdays.
  concept_id: es-poder-repeated-past-permission--en-could-concept
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podia
  form_surface: podía
  teaching_note: Use **could** for permission that existed generally or repeatedly
    in the past.
- id: es-podias-repeated-past-permission--en-you-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podías
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: you could
  target_lemma: could
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    tense: past
    mood: indicative
    verb_form: finite
    grammatical_person: second
    referent_person: second
    number: singular
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - podías
  reverse_status: linked
  reverse_ids:
  - en-you-could-repeated-past-permission--es-podias
  status: draft
  examples:
  - source: De niña, podías quedarte despierta hasta tarde los sábados.
    target: As a child, you could stay up late on Saturdays.
  concept_id: es-poder-repeated-past-permission--en-could-concept
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podias
  form_surface: podías
  teaching_note: Use **could** for permission that existed generally or repeatedly
    in the past.
- id: es-podiamos-repeated-past-permission--en-we-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podíamos
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: we could
  target_lemma: could
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    tense: past
    mood: indicative
    verb_form: finite
    grammatical_person: first
    referent_person: first
    number: plural
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - podíamos
  reverse_status: linked
  reverse_ids:
  - en-we-could-repeated-past-permission--es-podiamos
  status: draft
  examples:
  - source: Durante las vacaciones, podíamos levantarnos tarde.
    target: During vacation, we could get up late.
  concept_id: es-poder-repeated-past-permission--en-could-concept
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podiamos
  form_surface: podíamos
  teaching_note: Use **could** for permission that existed generally or repeatedly
    in the past.
- id: es-podian-repeated-past-permission--en-they-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podían
  source_lemma: poder
  source_variant: repeated-past-permission
  target_language: en
  target: they could
  target_lemma: could
  sense: repeated-past-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    tense: past
    mood: indicative
    verb_form: finite
    grammatical_person: third
    referent_person: third
    number: plural
  clause_type: declarative
  polarity: affirmative
  index_under:
  - poder
  - podían
  reverse_status: linked
  reverse_ids:
  - en-they-could-repeated-past-permission--es-podian
  status: draft
  examples:
  - source: Antes, podían usar la sala después de las seis.
    target: Before, they could use the room after six.
  concept_id: es-poder-repeated-past-permission--en-could-concept
  family_id: es-poder-imperfect-indicative-family
  form_id: es-poder-imperfect-indicative-form-podian
  form_surface: podían
  teaching_note: Use **could** for permission that existed generally or repeatedly
    in the past.
---

# **poder** → **could**

Use **could** for permission that existed generally or repeatedly in the past.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
