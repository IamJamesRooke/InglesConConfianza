---
id: es-poder-polite-request--en-could-you-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: "¿podrías...?"
source_lemma: poder
target_language: en
target: Could you...?
target_lemma: could
sense: polite-request
family_id: es-poder-conditional-indicative-family
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
taxonomy:
  category: expression
  subcategory: request-expression
status: draft
form_count: 1
mapping_count: 1
mappings:
- id: es-podrias-polite-request--en-could-you
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿podrías...?"
  source_lemma: poder
  source_variant: polite-request
  target_language: en
  target: Could you...?
  target_lemma: could
  sense: polite-request
  taxonomy:
    category: expression
    subcategory: request-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  index_under:
  - poder
  - podrías
  reverse_status: linked
  reverse_ids:
  - en-could-you-polite-request--es-podrias
  status: draft
  examples:
  - source: "¿Podrías ayudarme, por favor?"
    target: Could you help me, please?
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrias
  teaching_note: Use **Could you...?** for this poder meaning in the context shown.
  concept_id: es-poder-polite-request--en-could-you-concept
  form_surface: podrías
---
# **¿podrías...?** → **Could you...?**

Use **Could you...?** for a polite request.

Every entry in `mappings` is an independently trackable translation edge. They share the **conditional-indicative** family so exposure can roll up from the individual form to **poder** without combining this meaning with a different one.
