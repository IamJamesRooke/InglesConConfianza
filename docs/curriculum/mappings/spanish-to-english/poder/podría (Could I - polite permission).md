---
id: es-poder-polite-permission--en-could-i-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: "¿podría...?"
source_lemma: poder
target_language: en
target: Could I...?
target_lemma: could
sense: polite-permission
family_id: es-poder-conditional-indicative-family
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: permission-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-podria-polite-permission--en-could-i
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿podría...?"
  source_lemma: poder
  source_variant: polite-permission
  target_language: en
  target: Could I...?
  target_lemma: could
  sense: polite-permission
  taxonomy:
    category: expression
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
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-could-i-polite-permission--es-podria
  status: draft
  examples:
  - source: "¿Podría usar su teléfono?"
    target: Could I use your phone?
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **Could I...?** for this poder meaning in the context shown.
  concept_id: es-poder-polite-permission--en-could-i-concept
  form_surface: podría
  clause_type: interrogative
  polarity: affirmative
  question_type: yes-no
clause_type: interrogative
polarity: affirmative
question_type: yes-no
---
# **¿podría...?** → **Could I...?**

Use **Could I...?** for a polite request for permission.

Every entry in `mappings` is an independently trackable translation edge. They share the **conditional-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
