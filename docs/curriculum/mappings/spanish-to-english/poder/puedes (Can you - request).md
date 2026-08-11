---
id: es-poder-ordinary-request--en-can-you-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: "¿puedes...?"
source_lemma: poder
target_language: en
target: Can you...?
target_lemma: can
sense: ordinary-request
family_id: es-poder-present-indicative-family
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: request-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-puedes-ordinary-request--en-can-you
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puedes...?"
  source_lemma: poder
  source_variant: ordinary-request
  target_language: en
  target: Can you...?
  target_lemma: can
  sense: ordinary-request
  taxonomy:
    category: expression
    subcategory: request-expression
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
  - en-can-you-ordinary-request--es-puedes
  status: draft
  examples:
  - source: "¿Puedes cerrar la ventana?"
    target: Can you close the window?
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  teaching_note: Use **Can you...?** for this poder meaning in the context shown.
  concept_id: es-poder-ordinary-request--en-can-you-concept
  form_surface: puedes
  clause_type: interrogative
  polarity: affirmative
  question_type: yes-no
clause_type: interrogative
polarity: affirmative
question_type: yes-no
---
# **¿puedes...?** → **Can you...?**

Use **Can you...?** when **¿puedes...?** introduces an ordinary request.

Every entry in `mappings` is an independently trackable translation edge. They share the **present-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
