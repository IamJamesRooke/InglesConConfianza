---
id: es-poder-present-explicit-ability--en-be-able-to-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: be able to
target_lemma: be
sense: present-explicit-ability
family_id: es-poder-present-indicative-family
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: ability-expression
status: draft
form_count: 5
mapping_count: 5
mappings:
- id: es-podemos-we-ability--en-are-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podemos
  source_lemma: poder
  source_variant: present-we-ability-reverse
  target_language: en
  target: are able to
  target_lemma: be
  accepted_targets:
  - we are able to
  - we're able to
  sense: we-ability
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
  - podemos
  reverse_status: linked
  reverse_ids:
  - en-are-able-to-we--es-podemos
  status: draft
  examples:
  - source: Podemos terminar hoy.
    target: We are able to finish today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-podemos
  teaching_note: Use **are able to** for this poder expression in the context shown.
  concept_id: es-poder-present-explicit-ability--en-be-able-to-concept
  form_surface: podemos
  clause_type: declarative
  polarity: affirmative
- id: es-puede-ability--en-is-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede
  source_lemma: poder
  source_variant: present-third-singular-ability-reverse
  target_language: en
  target: is able to
  target_lemma: be
  accepted_targets:
  - he is able to
  - he's able to
  - she is able to
  - she's able to
  - it is able to
  - it's able to
  sense: ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-is-able-to--es-puede
  status: draft
  examples:
  - source: Ana puede explicar la actividad.
    target: Ana is able to explain the activity.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **is able to** for this poder expression in the context shown.
  concept_id: es-poder-present-explicit-ability--en-be-able-to-concept
  form_surface: puede
  clause_type: declarative
  polarity: affirmative
- id: es-pueden-they-or-you-plural-ability--en-are-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pueden
  source_lemma: poder
  source_variant: present-they-you-plural-ability-reverse
  target_language: en
  target: are able to
  target_lemma: be
  accepted_targets:
  - you are able to
  - you're able to
  - they are able to
  - they're able to
  sense: they-or-you-plural-ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - second
    - third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-are-able-to-they-you-plural--es-pueden
  status: draft
  examples:
  - source: Ellos pueden ayudar y ustedes pueden esperar.
    target: They are able to help, and you are able to wait.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  teaching_note: Use **are able to** for this poder expression in the context shown.
  concept_id: es-poder-present-explicit-ability--en-be-able-to-concept
  form_surface: pueden
  clause_type: declarative
  polarity: affirmative
- id: es-puedes-you-singular-ability--en-are-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedes
  source_lemma: poder
  source_variant: present-you-singular-ability-reverse
  target_language: en
  target: are able to
  target_lemma: be
  accepted_targets:
  - you are able to
  - you're able to
  sense: you-singular-ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - puedes
  reverse_status: linked
  reverse_ids:
  - en-are-able-to-you--es-puedes
  status: draft
  examples:
  - source: Puedes hacerlo solo.
    target: You are able to do it alone.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  teaching_note: Use **are able to** for this poder expression in the context shown.
  concept_id: es-poder-present-explicit-ability--en-be-able-to-concept
  form_surface: puedes
  clause_type: declarative
  polarity: affirmative
- id: es-puedo-ability--en-am-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedo
  source_lemma: poder
  source_variant: present-first-singular-ability-reverse
  target_language: en
  target: am able to
  target_lemma: be
  accepted_targets:
  - I am able to
  - I'm able to
  sense: ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-am-able-to--es-puedo
  status: draft
  examples:
  - source: Puedo explicar la actividad en inglés.
    target: I am able to explain the activity in English.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **am able to** for this poder expression in the context shown.
  concept_id: es-poder-present-explicit-ability--en-be-able-to-concept
  form_surface: puedo
  clause_type: declarative
  polarity: affirmative
clause_type: declarative
polarity: affirmative
---
# **poder** → **be able to**

Use the appropriate present form of **be able to** when the explicit ability expression is useful.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
