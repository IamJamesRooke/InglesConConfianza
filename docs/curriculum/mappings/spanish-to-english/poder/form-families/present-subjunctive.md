---
id: es-poder-present-subjunctive-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: present-subjunctive
family_features:
  tense: present
  mood: subjunctive
  verb_form: finite
status: draft
form_count: 4
mapping_count: 5
forms:
- id: es-poder-present-subjunctive-form-podamos
  surface: podamos
  source_features:
    grammatical_person: first
    mood: subjunctive
    number: plural
    referent_person: first
    tense: present
    verb_form: finite
- id: es-poder-present-subjunctive-form-pueda
  surface: pueda
  source_features:
    grammatical_person:
    - first
    - third
    mood: subjunctive
    number: singular
    referent_person:
    - first
    - second
    - third
    tense: present
    verb_form: finite
- id: es-poder-present-subjunctive-form-puedan
  surface: puedan
  source_features:
    grammatical_person: third
    mood: subjunctive
    number: plural
    referent_person:
    - second
    - third
    tense: present
    verb_form: finite
- id: es-poder-present-subjunctive-form-puedas
  surface: puedas
  source_features:
    grammatical_person: second
    mood: subjunctive
    number: singular
    referent_person: second
    tense: present
    verb_form: finite
mappings:
- id: es-podamos-present-subordinate-ability--en-we-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podamos
  source_lemma: poder
  source_variant: present-subordinate-ability
  target_language: en
  target: we can
  target_lemma: can
  sense: present-subordinate-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: present
    mood: subjunctive
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros podamos
  - nosotras podamos
  index_under:
  - poder
  - podamos
  reverse_status: linked
  reverse_ids:
  - en-we-can-present-subordinate-ability--es-podamos
  status: draft
  examples:
  - source: Espero que podamos terminar hoy.
    target: I hope we can finish today.
  family_id: es-poder-present-subjunctive-family
  form_id: es-poder-present-subjunctive-form-podamos
  teaching_note: Use **we can** for this poder meaning in the context shown.
- id: es-pueda-present-subordinate-ability--en-i-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pueda
  source_lemma: poder
  source_variant: present-subordinate-ability
  target_language: en
  target: I can
  target_lemma: can
  accepted_targets:
  - he can
  - she can
  - you can
  sense: present-subordinate-ability
  taxonomy:
    category: verb
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
    tense: present
    mood: subjunctive
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
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - yo pueda
  - él pueda
  - ella pueda
  - usted pueda
  index_under:
  - poder
  - pueda
  reverse_status: linked
  reverse_ids:
  - en-i-can-present-subordinate-ability--es-pueda
  status: draft
  examples:
  - source: Ana espera que yo pueda ayudar mañana.
    target: Ana hopes I can help tomorrow.
  family_id: es-poder-present-subjunctive-family
  form_id: es-poder-present-subjunctive-form-pueda
  teaching_note: Use **I can** for this poder meaning in the context shown.
- id: es-puedan-present-subordinate-ability--en-they-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedan
  source_lemma: poder
  source_variant: present-subordinate-ability
  target_language: en
  target: they can
  target_lemma: can
  accepted_targets:
  - you can
  sense: present-subordinate-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: subjunctive
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - ellos puedan
  - ellas puedan
  - ustedes puedan
  index_under:
  - poder
  - puedan
  reverse_status: linked
  reverse_ids:
  - en-they-can-present-subordinate-ability--es-puedan
  status: draft
  examples:
  - source: Espero que ellos puedan participar.
    target: I hope they can participate.
  family_id: es-poder-present-subjunctive-family
  form_id: es-poder-present-subjunctive-form-puedan
  teaching_note: Use **they can** for this poder meaning in the context shown.
- id: es-puedas-present-subordinate-ability--en-you-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedas
  source_lemma: poder
  source_variant: present-subordinate-ability
  target_language: en
  target: you can
  target_lemma: can
  sense: present-subordinate-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: present
    mood: subjunctive
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - tú puedas
  index_under:
  - poder
  - puedas
  reverse_status: linked
  reverse_ids:
  - en-you-can-present-subordinate-ability--es-puedas
  status: draft
  examples:
  - source: Espero que puedas venir mañana.
    target: I hope you can come tomorrow.
  family_id: es-poder-present-subjunctive-family
  form_id: es-poder-present-subjunctive-form-puedas
  teaching_note: Use **you can** for this poder meaning in the context shown.
- id: es-quiza-pueda-possible-ability--en-might-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: quizá pueda
  source_lemma: poder
  source_variant: possible-ability
  target_language: en
  target: might be able to
  target_lemma: be
  sense: possible-ability
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
    tense: present
    mood: subjunctive
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - pueda
  reverse_status: linked
  reverse_ids:
  - en-might-be-able-to-possible-ability--es-quiza-pueda
  status: draft
  examples:
  - source: Quizá pueda ayudarla mañana.
    target: I might be able to help her tomorrow.
  family_id: es-poder-present-subjunctive-family
  form_id: es-poder-present-subjunctive-form-pueda
  teaching_note: Use **might be able to** for this poder meaning in the context shown.
---

# Present Subjunctive of **poder**

Subordinate and uncertain present ability. This family retains 4 trackable surface forms and 5 atomic translation choices.
