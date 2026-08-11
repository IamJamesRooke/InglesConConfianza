---
id: es-poder-ability-question--en-can-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: "¿poder...?"
source_lemma: poder
target_language: en
target: Can...?
target_lemma: can
sense: ability-question
clause_type: interrogative
polarity: affirmative
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
- id: es-puedo-ability-question--en-can-i
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puedo...?"
  source_lemma: poder
  source_variant: ability-question
  target_language: en
  target: Can I...?
  target_lemma: can
  sense: ability-question
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
    tense: present
    mood: indicative
    verb_form: finite
    grammatical_person: first
    referent_person: first
    number: singular
  clause_type: interrogative
  polarity: affirmative
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-can-i-ability-question--es-puedo
  status: draft
  examples:
  - source: "¿Puedo levantar esta caja solo?"
    target: Can I lift this box by myself?
  concept_id: es-poder-ability-question--en-can-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  form_surface: puedo
  teaching_note: Use inverted **Can + subject + verb...?** when the question tests
    ability rather than making a request.
  question_type: yes-no
- id: es-puedes-ability-question--en-can-you
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puedes...?"
  source_lemma: poder
  source_variant: ability-question
  target_language: en
  target: Can you...?
  target_lemma: can
  sense: ability-question
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
    tense: present
    mood: indicative
    verb_form: finite
    grammatical_person: second
    referent_person: second
    number: singular
  clause_type: interrogative
  polarity: affirmative
  index_under:
  - poder
  - puedes
  reverse_status: linked
  reverse_ids:
  - en-can-you-ability-question--es-puedes
  status: draft
  examples:
  - source: "¿Puedes hacerlo sin ayuda?"
    target: Can you do it without help?
  concept_id: es-poder-ability-question--en-can-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  form_surface: puedes
  teaching_note: Use inverted **Can + subject + verb...?** when the question tests
    ability rather than making a request.
  question_type: yes-no
- id: es-puede-ability-question--en-can-she
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puede...?"
  source_lemma: poder
  source_variant: ability-question
  target_language: en
  target: Can she...?
  target_lemma: can
  sense: ability-question
  accepted_targets:
  - Can he...?
  - Can you...?
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
    tense: present
    mood: indicative
    verb_form: finite
    grammatical_person: third
    referent_person: third
    number: singular
  clause_type: interrogative
  polarity: affirmative
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-can-she-ability-question--es-puede
  status: draft
  examples:
  - source: "¿Puede Ana conducir de noche?"
    target: Can Ana drive at night?
  concept_id: es-poder-ability-question--en-can-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  form_surface: puede
  teaching_note: Use inverted **Can + subject + verb...?** when the question tests
    ability rather than making a request.
  question_type: yes-no
- id: es-podemos-ability-question--en-can-we
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿podemos...?"
  source_lemma: poder
  source_variant: ability-question
  target_language: en
  target: Can we...?
  target_lemma: can
  sense: ability-question
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
    tense: present
    mood: indicative
    verb_form: finite
    grammatical_person: first
    referent_person: first
    number: plural
  clause_type: interrogative
  polarity: affirmative
  index_under:
  - poder
  - podemos
  reverse_status: linked
  reverse_ids:
  - en-can-we-ability-question--es-podemos
  status: draft
  examples:
  - source: "¿Tenemos suficiente tiempo? ¿Podemos terminar hoy?"
    target: Do we have enough time? Can we finish today?
  concept_id: es-poder-ability-question--en-can-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-podemos
  form_surface: podemos
  teaching_note: Use inverted **Can + subject + verb...?** when the question tests
    ability rather than making a request.
  question_type: yes-no
- id: es-pueden-ability-question--en-can-they
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿pueden...?"
  source_lemma: poder
  source_variant: ability-question
  target_language: en
  target: Can they...?
  target_lemma: can
  sense: ability-question
  accepted_targets:
  - Can you...?
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
    tense: present
    mood: indicative
    verb_form: finite
    grammatical_person: third
    referent_person: third
    number: plural
  clause_type: interrogative
  polarity: affirmative
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-can-they-ability-question--es-pueden
  status: draft
  examples:
  - source: "¿Pueden levantar la mesa entre los dos?"
    target: Can they lift the table together?
  concept_id: es-poder-ability-question--en-can-concept
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  form_surface: pueden
  teaching_note: Use inverted **Can + subject + verb...?** when the question tests
    ability rather than making a request.
  question_type: yes-no
question_type: yes-no
---

# **¿poder...?** → **Can...?**

Use inverted **Can + subject + verb...?** when the question tests ability rather than making a request.

Every entry in `mappings` is independently trackable. `clause_type`, `polarity`, `sense`, `family_id`, and `form_id` make the distinction queryable without interpreting this filename.
