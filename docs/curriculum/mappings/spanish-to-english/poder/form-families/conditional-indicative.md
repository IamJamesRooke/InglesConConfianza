---
id: es-poder-conditional-indicative-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: conditional-indicative
family_features:
  tense: conditional
  mood: indicative
  verb_form: finite
status: draft
form_count: 4
mapping_count: 18
forms:
- id: es-poder-conditional-indicative-form-podria
  surface: podría
  source_features:
    grammatical_person:
    - first
    - third
    mood: indicative
    number: singular
    referent_person:
    - first
    - second
    - third
    tense: conditional
    verb_form: finite
- id: es-poder-conditional-indicative-form-podriamos
  surface: podríamos
  source_features:
    grammatical_person: first
    mood: indicative
    number: plural
    referent_person: first
    tense: conditional
    verb_form: finite
- id: es-poder-conditional-indicative-form-podrian
  surface: podrían
  source_features:
    grammatical_person: third
    mood: indicative
    number: plural
    referent_person:
    - second
    - third
    tense: conditional
    verb_form: finite
- id: es-poder-conditional-indicative-form-podrias
  surface: podrías
  source_features:
    grammatical_person: second
    mood: indicative
    number: singular
    referent_person: second
    tense: conditional
    verb_form: finite
mappings:
- id: es-podria-conditional-ability--en-i-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: I could
  target_lemma: could
  accepted_targets:
  - he could
  - she could
  - you could
  sense: conditional-ability
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
    tense: conditional
    mood: indicative
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
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases:
  - yo podría
  - él podría
  - ella podría
  - usted podría
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-i-could-conditional-ability--es-podria
  status: draft
  examples:
  - source: Yo podría ayudar si tuviera tiempo.
    target: I could help if I had time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **I could** for this poder meaning in the context shown.
- id: es-podria-conditional-ability--en-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría
  source_lemma: poder
  source_variant: conditional-ability-reverse
  target_language: en
  target: would be able to
  target_lemma: be
  accepted_targets:
  - I would be able to
  - I'd be able to
  - he would be able to
  - he'd be able to
  - she would be able to
  - she'd be able to
  - it would be able to
  - it'd be able to
  sense: conditional-ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-would-be-able-to--es-podria
  status: draft
  examples:
  - source: Ana podría ayudar si tuviera más tiempo.
    target: Ana would be able to help with more time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **would be able to** for this poder expression in the context
    shown.
- id: es-podria-uncertain-possibility--en-i-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: I might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
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
  aliases:
  - yo podría
  - él podría
  - ella podría
  - usted podría
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-i-might-uncertain-possibility--es-podria
  status: draft
  examples:
  - source: Yo podría llegar tarde.
    target: I might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **I might** for this poder meaning in the context shown.
- id: es-podria-estar-possible-state-location--en-could-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría estar
  source_lemma: poder
  source_variant: possibility-estar-reverse
  target_language: en
  target: could be
  target_lemma: be
  accepted_targets:
  - I could be
  - he could be
  - she could be
  - it could be
  sense: possible-state-location
  taxonomy:
    category: expression
    subcategory: modal-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-could-be-estar--es-podria-estar
  status: draft
  examples:
  - source: Ana podría estar cansada después del viaje.
    target: Ana could be tired after the trip.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **could be** for this poder expression in the context shown.
- id: es-podria-estar-tentative-state-location--en-might-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría estar
  source_lemma: poder
  source_variant: tentative-possibility-estar-reverse
  target_language: en
  target: might be
  target_lemma: be
  accepted_targets:
  - I might be
  - he might be
  - she might be
  - it might be
  sense: tentative-state-location
  taxonomy:
    category: expression
    subcategory: modal-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-might-be-estar--es-podria-estar
  status: draft
  examples:
  - source: Ana podría estar ocupada esta tarde.
    target: Ana might be busy this afternoon.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **might be** for this poder expression in the context shown.
- id: es-podria-ser-possible-identity-characteristic--en-could-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría ser
  source_lemma: poder
  source_variant: possibility-ser-reverse
  target_language: en
  target: could be
  target_lemma: be
  accepted_targets:
  - I could be
  - he could be
  - she could be
  - it could be
  sense: possible-identity-characteristic
  taxonomy:
    category: expression
    subcategory: modal-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-could-be-ser--es-podria-ser
  status: draft
  examples:
  - source: El ruido podría ser un problema.
    target: The noise could be a problem.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **could be** for this poder expression in the context shown.
- id: es-podria-ser-tentative-identity-characteristic--en-might-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podría ser
  source_lemma: poder
  source_variant: tentative-possibility-ser-reverse
  target_language: en
  target: might be
  target_lemma: be
  accepted_targets:
  - I might be
  - he might be
  - she might be
  - it might be
  sense: tentative-identity-characteristic
  taxonomy:
    category: expression
    subcategory: modal-expression
  source_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person:
    - first
    - third
    referent_person:
    - first
    - third
    number: singular
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - podría
  reverse_status: linked
  reverse_ids:
  - en-might-be-ser--es-podria-ser
  status: draft
  examples:
  - source: Esa podría ser la mejor opción.
    target: That might be the best option.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podria
  teaching_note: Use **might be** for this poder expression in the context shown.
- id: es-podriamos-conditional-ability--en-we-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podríamos
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: we could
  target_lemma: could
  sense: conditional-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros podríamos
  - nosotras podríamos
  index_under:
  - poder
  - podríamos
  reverse_status: linked
  reverse_ids:
  - en-we-could-conditional-ability--es-podriamos
  status: draft
  examples:
  - source: Podríamos terminar hoy.
    target: We could finish today.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podriamos
  teaching_note: Use **we could** for this poder meaning in the context shown.
- id: es-podriamos-conditional-explicit-ability--en-we-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podríamos
  source_lemma: poder
  source_variant: conditional-explicit-ability
  target_language: en
  target: we would be able to
  target_lemma: be
  sense: conditional-explicit-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros podríamos
  - nosotras podríamos
  index_under:
  - poder
  - podríamos
  reverse_status: linked
  reverse_ids:
  - en-we-would-be-able-to-conditional-explicit-ability--es-podriamos
  status: draft
  examples:
  - source: Podríamos terminar hoy.
    target: We would be able to finish today.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podriamos
  teaching_note: Use **we would be able to** for this poder meaning in the context
    shown.
- id: es-podriamos-uncertain-possibility--en-we-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podríamos
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: we might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
    subcategory: possibility-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros podríamos
  - nosotras podríamos
  index_under:
  - poder
  - podríamos
  reverse_status: linked
  reverse_ids:
  - en-we-might-uncertain-possibility--es-podriamos
  status: draft
  examples:
  - source: Podríamos llegar tarde.
    target: We might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podriamos
  teaching_note: Use **we might** for this poder meaning in the context shown.
- id: es-podrian-conditional-ability--en-they-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrían
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: they could
  target_lemma: could
  accepted_targets:
  - you could
  sense: conditional-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases:
  - ellos podrían
  - ellas podrían
  - ustedes podrían
  index_under:
  - poder
  - podrían
  reverse_status: linked
  reverse_ids:
  - en-they-could-conditional-ability--es-podrian
  status: draft
  examples:
  - source: Ellos podrían llegar tarde.
    target: They could arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrian
  teaching_note: Use **they could** for this poder meaning in the context shown.
- id: es-podrian-conditional-explicit-ability--en-they-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrían
  source_lemma: poder
  source_variant: conditional-explicit-ability
  target_language: en
  target: they would be able to
  target_lemma: be
  sense: conditional-explicit-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases:
  - ellos podrían
  - ellas podrían
  - ustedes podrían
  index_under:
  - poder
  - podrían
  reverse_status: linked
  reverse_ids:
  - en-they-would-be-able-to-conditional-explicit-ability--es-podrian
  status: draft
  examples:
  - source: Ellos podrían llegar tarde.
    target: They would be able to arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrian
  teaching_note: Use **they would be able to** for this poder meaning in the context
    shown.
- id: es-podrian-uncertain-possibility--en-they-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrían
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: they might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases:
  - ellos podrían
  - ellas podrían
  - ustedes podrían
  index_under:
  - poder
  - podrían
  reverse_status: linked
  reverse_ids:
  - en-they-might-uncertain-possibility--es-podrian
  status: draft
  examples:
  - source: Ellos podrían llegar tarde.
    target: They might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrian
  teaching_note: Use **they might** for this poder meaning in the context shown.
- id: es-podrias-conditional-ability--en-you-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrías
  source_lemma: poder
  source_variant: conditional-ability
  target_language: en
  target: you could
  target_lemma: could
  sense: conditional-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
  aliases:
  - tú podrías
  index_under:
  - poder
  - podrías
  reverse_status: linked
  reverse_ids:
  - en-you-could-conditional-ability--es-podrias
  status: draft
  examples:
  - source: Podrías ayudar si tuvieras tiempo.
    target: You could help if you had time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrias
  teaching_note: Use **you could** for this poder meaning in the context shown.
- id: es-podrias-conditional-explicit-ability--en-you-would-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrías
  source_lemma: poder
  source_variant: conditional-explicit-ability
  target_language: en
  target: you would be able to
  target_lemma: be
  sense: conditional-explicit-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
  aliases:
  - tú podrías
  index_under:
  - poder
  - podrías
  reverse_status: linked
  reverse_ids:
  - en-you-would-be-able-to-conditional-explicit-ability--es-podrias
  status: draft
  examples:
  - source: Podrías ayudar si tuvieras tiempo.
    target: You would be able to help if you had time.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrias
  teaching_note: Use **you would be able to** for this poder meaning in the context
    shown.
- id: es-podrias-uncertain-possibility--en-you-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrías
  source_lemma: poder
  source_variant: uncertain-possibility
  target_language: en
  target: you might
  target_lemma: might
  sense: uncertain-possibility
  taxonomy:
    category: verb
    subcategory: possibility-expression
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
  aliases:
  - tú podrías
  index_under:
  - poder
  - podrías
  reverse_status: linked
  reverse_ids:
  - en-you-might-uncertain-possibility--es-podrias
  status: draft
  examples:
  - source: Tú podrías llegar tarde.
    target: You might arrive late.
  family_id: es-poder-conditional-indicative-family
  form_id: es-poder-conditional-indicative-form-podrias
  teaching_note: Use **you might** for this poder meaning in the context shown.
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
  aliases: []
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
  aliases: []
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
---

# Conditional Indicative of **poder**

Conditional ability, uncertain possibility, and polite requests. This family retains 4 trackable surface forms and 18 atomic translation choices.
