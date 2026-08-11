---
id: es-poder-present-indicative-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
status: draft
form_count: 5
mapping_count: 34
forms:
- id: es-poder-present-indicative-form-podemos
  surface: podemos
  source_features:
    grammatical_person: first
    mood: indicative
    number: plural
    referent_person: first
    tense: present
    verb_form: finite
- id: es-poder-present-indicative-form-puede
  surface: puede
  source_features:
    grammatical_person: third
    mood: indicative
    number: singular
    referent_person:
    - second
    - third
    - impersonal
    tense: present
    verb_form: finite
- id: es-poder-present-indicative-form-pueden
  surface: pueden
  source_features:
    grammatical_person: third
    mood: indicative
    number: plural
    referent_person:
    - second
    - third
    tense: present
    verb_form: finite
- id: es-poder-present-indicative-form-puedes
  surface: puedes
  source_features:
    grammatical_person: second
    mood: indicative
    number: singular
    referent_person: second
    tense: present
    verb_form: finite
- id: es-poder-present-indicative-form-puedo
  surface: puedo
  source_features:
    grammatical_person: first
    mood: indicative
    number: singular
    referent_person: first
    tense: present
    verb_form: finite
mappings:
- id: es-no-podemos-present-inability--en-we-can-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no podemos
  source_lemma: poder
  source_variant: present-inability
  target_language: en
  target: we can't
  target_lemma: can
  accepted_targets:
  - we cannot
  sense: present-inability
  taxonomy:
    category: verb
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
  aliases:
  - nosotros no podemos
  - nosotras no podemos
  index_under:
  - poder
  - podemos
  reverse_status: linked
  reverse_ids:
  - en-we-can-t-present-inability--es-no-podemos
  status: draft
  examples:
  - source: No podemos terminar hoy.
    target: We can't finish today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-podemos
  teaching_note: Use **we can't** for this poder meaning in the context shown.
- id: es-no-puede-formal-denied-permission--en-you-may-not
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no puede
  source_lemma: poder
  source_variant: formal-denied-permission
  target_language: en
  target: you may not
  target_lemma: may
  sense: formal-denied-permission
  taxonomy:
    category: expression
    subcategory: permission-expression
  source_features:
    grammatical_person: third
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
  register: formal
  aliases:
  - usted no puede
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-you-may-not-formal-denied-permission--es-no-puede
  status: draft
  examples:
  - source: No puede entrar sin autorización.
    target: You may not enter without authorization.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **you may not** for this poder meaning in the context shown.
- id: es-no-puede-present-inability--en-she-can-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no puede
  source_lemma: poder
  source_variant: present-inability
  target_language: en
  target: she can't
  target_lemma: can
  accepted_targets:
  - she cannot
  sense: present-inability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - él no puede
  - ella no puede
  - usted no puede
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-she-can-t-present-inability--es-no-puede
  status: draft
  examples:
  - source: Ana no puede conducir hoy.
    target: Ana can't drive today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **she can't** for this poder meaning in the context shown.
- id: es-no-pueden-present-inability--en-they-can-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pueden
  source_lemma: poder
  source_variant: present-inability
  target_language: en
  target: they can't
  target_lemma: can
  accepted_targets:
  - they cannot
  sense: present-inability
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
    mood: indicative
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
  - ellos no pueden
  - ellas no pueden
  - ustedes no pueden
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-they-can-t-present-inability--es-no-pueden
  status: draft
  examples:
  - source: Ellos no pueden entrar todavía.
    target: They can't come in yet.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  teaching_note: Use **they can't** for this poder meaning in the context shown.
- id: es-no-puedes-present-inability--en-you-can-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no puedes
  source_lemma: poder
  source_variant: present-inability
  target_language: en
  target: you can't
  target_lemma: can
  accepted_targets:
  - you cannot
  sense: present-inability
  taxonomy:
    category: verb
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
  aliases:
  - tú no puedes
  index_under:
  - poder
  - puedes
  reverse_status: linked
  reverse_ids:
  - en-you-can-t-present-inability--es-no-puedes
  status: draft
  examples:
  - source: No puedes abrir este archivo.
    target: You can't open this file.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  teaching_note: Use **you can't** for this poder meaning in the context shown.
- id: es-no-puedo-present-inability--en-i-can-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no puedo
  source_lemma: poder
  source_variant: present-inability
  target_language: en
  target: I can't
  target_lemma: can
  accepted_targets:
  - I cannot
  sense: present-inability
  taxonomy:
    category: verb
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
  aliases:
  - yo no puedo
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-i-can-t-present-inability--es-no-puedo
  status: draft
  examples:
  - source: No puedo asistir a la reunión.
    target: I can't attend the meeting.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **I can't** for this poder meaning in the context shown.
- id: es-podemos-present-ability--en-we-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podemos
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: we can
  target_lemma: can
  sense: present-ability
  taxonomy:
    category: verb
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
  aliases:
  - nosotros podemos
  - nosotras podemos
  index_under:
  - poder
  - podemos
  reverse_status: linked
  reverse_ids:
  - en-we-can-present-ability--es-podemos
  status: draft
  examples:
  - source: Podemos hablar después de la reunión.
    target: We can talk after the meeting.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-podemos
  teaching_note: Use **we can** for this poder meaning in the context shown.
- id: es-podemos-present-opportunity--en-we-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podemos
  source_lemma: poder
  source_variant: present-opportunity
  target_language: en
  target: we get to
  target_lemma: get
  sense: present-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
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
  aliases:
  - nosotros podemos
  - nosotras podemos
  index_under:
  - poder
  - podemos
  reverse_status: linked
  reverse_ids:
  - en-we-get-to-present-opportunity--es-podemos
  status: draft
  examples:
  - source: Podemos trabajar con clientes internacionales.
    target: We get to work with international clients.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-podemos
  teaching_note: Use **we get to** for this poder meaning in the context shown.
- id: es-podemos-present-permission--en-we-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podemos
  source_lemma: poder
  source_variant: present-permission
  target_language: en
  target: we can
  target_lemma: can
  sense: present-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
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
  aliases:
  - nosotros podemos
  - nosotras podemos
  index_under:
  - poder
  - podemos
  reverse_status: linked
  reverse_ids:
  - en-we-can-present-permission--es-podemos
  status: draft
  examples:
  - source: Podemos usar esta sala.
    target: We can use this room.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-podemos
  teaching_note: Use **we can** for this poder meaning in the context shown.
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
  aliases: []
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
  aliases: []
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
- id: es-puede-present-ability--en-she-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: she can
  target_lemma: can
  accepted_targets:
  - he can
  - it can
  - you can
  sense: present-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - él puede
  - ella puede
  - usted puede
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-she-can-present-ability--es-puede
  status: draft
  examples:
  - source: Ana puede conducir.
    target: Ana can drive.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **she can** for this poder meaning in the context shown.
- id: es-puede-present-opportunity--en-she-gets-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede
  source_lemma: poder
  source_variant: present-opportunity
  target_language: en
  target: she gets to
  target_lemma: get
  sense: present-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - él puede
  - ella puede
  - usted puede
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-she-gets-to-present-opportunity--es-puede
  status: draft
  examples:
  - source: Ana puede trabajar con clientes internacionales.
    target: Ana gets to work with international clients.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **she gets to** for this poder meaning in the context shown.
- id: es-puede-present-permission--en-she-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede
  source_lemma: poder
  source_variant: present-permission
  target_language: en
  target: she can
  target_lemma: can
  accepted_targets:
  - he can
  - it can
  - you can
  sense: present-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - él puede
  - ella puede
  - usted puede
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-she-can-present-permission--es-puede
  status: draft
  examples:
  - source: Ana puede usar esta sala.
    target: Ana can use this room.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **she can** for this poder meaning in the context shown.
- id: es-puede-estar-possible-state-location--en-may-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede estar
  source_lemma: poder
  source_variant: possibility-estar-reverse
  target_language: en
  target: may be
  target_lemma: be
  accepted_targets:
  - he may be
  - she may be
  - it may be
  sense: possible-state-location
  taxonomy:
    category: expression
    subcategory: modal-expression
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
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-may-be-estar--es-puede-estar
  status: draft
  examples:
  - source: Ana puede estar en su oficina.
    target: Ana may be in her office.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **may be** for this poder expression in the context shown.
- id: es-puede-que-uncertain-event--en-could
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede que
  source_lemma: poder
  source_variant: uncertain-event
  target_language: en
  target: could
  target_lemma: could
  sense: uncertain-event
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person: impersonal
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
  aliases: []
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-could-uncertain-event--es-puede-que
  status: draft
  examples:
  - source: Puede que el paquete llegue hoy.
    target: The package could arrive today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **could** for this poder meaning in the context shown.
- id: es-puede-que-uncertain-event--en-may
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede que
  source_lemma: poder
  source_variant: uncertain-event
  target_language: en
  target: may
  target_lemma: may
  sense: uncertain-event
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person: impersonal
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
  aliases: []
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-may-uncertain-event--es-puede-que
  status: draft
  examples:
  - source: Puede que Ana llegue tarde.
    target: Ana may arrive late.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **may** for this poder meaning in the context shown.
- id: es-puede-que-uncertain-event--en-might
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede que
  source_lemma: poder
  source_variant: uncertain-event
  target_language: en
  target: might
  target_lemma: might
  sense: uncertain-event
  taxonomy:
    category: expression
    subcategory: possibility-expression
  source_features:
    grammatical_person: third
    referent_person: impersonal
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
  aliases: []
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-might-uncertain-event--es-puede-que
  status: draft
  examples:
  - source: Puede que llueva esta noche.
    target: It might rain tonight.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **might** for this poder meaning in the context shown.
- id: es-puede-ser-possible-identity-characteristic--en-may-be
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puede ser
  source_lemma: poder
  source_variant: possibility-ser-reverse
  target_language: en
  target: may be
  target_lemma: be
  accepted_targets:
  - he may be
  - she may be
  - it may be
  sense: possible-identity-characteristic
  taxonomy:
    category: expression
    subcategory: modal-expression
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
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - puede
  reverse_status: linked
  reverse_ids:
  - en-may-be-ser--es-puede-ser
  status: draft
  examples:
  - source: La demora puede ser un problema.
    target: The delay may be a problem.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puede
  teaching_note: Use **may be** for this poder expression in the context shown.
- id: es-pueden-present-ability--en-they-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pueden
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: they can
  target_lemma: can
  accepted_targets:
  - you can
  sense: present-ability
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
    mood: indicative
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
  - ellos pueden
  - ellas pueden
  - ustedes pueden
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-they-can-present-ability--es-pueden
  status: draft
  examples:
  - source: Ellos pueden trabajar desde casa.
    target: They can work from home.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  teaching_note: Use **they can** for this poder meaning in the context shown.
- id: es-pueden-present-opportunity--en-they-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pueden
  source_lemma: poder
  source_variant: present-opportunity
  target_language: en
  target: they get to
  target_lemma: get
  sense: present-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - ellos pueden
  - ellas pueden
  - ustedes pueden
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-they-get-to-present-opportunity--es-pueden
  status: draft
  examples:
  - source: Ellos pueden trabajar con clientes internacionales.
    target: They get to work with international clients.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  teaching_note: Use **they get to** for this poder meaning in the context shown.
- id: es-pueden-present-permission--en-they-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pueden
  source_lemma: poder
  source_variant: present-permission
  target_language: en
  target: they can
  target_lemma: can
  accepted_targets:
  - you can
  sense: present-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: present
    mood: indicative
    verb_form: finite
  aliases:
  - ellos pueden
  - ellas pueden
  - ustedes pueden
  index_under:
  - poder
  - pueden
  reverse_status: linked
  reverse_ids:
  - en-they-can-present-permission--es-pueden
  status: draft
  examples:
  - source: Ellos pueden usar esta sala.
    target: They can use this room.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-pueden
  teaching_note: Use **they can** for this poder meaning in the context shown.
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
  aliases: []
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
- id: es-puedes-present-ability--en-you-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedes
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: you can
  target_lemma: can
  sense: present-ability
  taxonomy:
    category: verb
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
  aliases:
  - tú puedes
  index_under:
  - poder
  - puedes
  reverse_status: linked
  reverse_ids:
  - en-you-can-present-ability--es-puedes
  status: draft
  examples:
  - source: Puedes terminar el informe hoy.
    target: You can finish the report today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  teaching_note: Use **you can** for this poder meaning in the context shown.
- id: es-puedes-present-opportunity--en-you-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedes
  source_lemma: poder
  source_variant: present-opportunity
  target_language: en
  target: you get to
  target_lemma: get
  sense: present-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
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
  aliases:
  - tú puedes
  index_under:
  - poder
  - puedes
  reverse_status: linked
  reverse_ids:
  - en-you-get-to-present-opportunity--es-puedes
  status: draft
  examples:
  - source: Puedes trabajar con clientes internacionales.
    target: You get to work with international clients.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  teaching_note: Use **you get to** for this poder meaning in the context shown.
- id: es-puedes-present-permission--en-you-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedes
  source_lemma: poder
  source_variant: present-permission
  target_language: en
  target: you can
  target_lemma: can
  sense: present-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
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
  aliases:
  - tú puedes
  index_under:
  - poder
  - puedes
  reverse_status: linked
  reverse_ids:
  - en-you-can-present-permission--es-puedes
  status: draft
  examples:
  - source: Puedes usar esta sala.
    target: You can use this room.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedes
  teaching_note: Use **you can** for this poder meaning in the context shown.
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
  aliases: []
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
  aliases: []
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
- id: es-puedo-present-ability--en-i-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedo
  source_lemma: poder
  source_variant: present-ability
  target_language: en
  target: I can
  target_lemma: can
  sense: present-ability
  taxonomy:
    category: verb
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
  aliases:
  - yo puedo
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-i-can-present-ability--es-puedo
  status: draft
  examples:
  - source: Puedo ayudarla hoy.
    target: I can help her today.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **I can** for this poder meaning in the context shown.
- id: es-puedo-present-opportunity--en-i-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedo
  source_lemma: poder
  source_variant: present-opportunity
  target_language: en
  target: I get to
  target_lemma: get
  sense: present-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
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
  aliases:
  - yo puedo
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-i-get-to-present-opportunity--es-puedo
  status: draft
  examples:
  - source: Puedo trabajar con clientes internacionales.
    target: I get to work with international clients.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **I get to** for this poder meaning in the context shown.
- id: es-puedo-present-permission--en-i-can
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: puedo
  source_lemma: poder
  source_variant: present-permission
  target_language: en
  target: I can
  target_lemma: can
  sense: present-permission
  taxonomy:
    category: verb
    subcategory: permission-expression
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
  aliases:
  - yo puedo
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-i-can-present-permission--es-puedo
  status: draft
  examples:
  - source: Puedo usar esta sala.
    target: I can use this room.
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **I can** for this poder meaning in the context shown.
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
  aliases: []
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
- id: es-puedo-asking-permission--en-can-i
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puedo...?"
  source_lemma: poder
  source_variant: asking-permission
  target_language: en
  target: Can I...?
  target_lemma: can
  sense: asking-permission
  taxonomy:
    category: expression
    subcategory: permission-expression
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
  aliases: []
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-can-i-asking-permission--es-puedo
  status: draft
  examples:
  - source: "¿Puedo usar su teléfono?"
    target: Can I use your phone?
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **Can I...?** for this poder meaning in the context shown.
- id: es-puedo-formal-asking-permission--en-may-i
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: "¿puedo...?"
  source_lemma: poder
  source_variant: formal-asking-permission
  target_language: en
  target: May I...?
  target_lemma: may
  sense: formal-asking-permission
  taxonomy:
    category: expression
    subcategory: permission-expression
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
  aliases: []
  index_under:
  - poder
  - puedo
  reverse_status: linked
  reverse_ids:
  - en-may-i-formal-asking-permission--es-puedo
  status: draft
  examples:
  - source: "¿Puedo pasar?"
    target: May I come in?
  family_id: es-poder-present-indicative-family
  form_id: es-poder-present-indicative-form-puedo
  teaching_note: Use **May I...?** for this poder meaning in the context shown.
---

# Present Indicative of **poder**

Present ability, permission, opportunity, requests, and possibility. This family retains 5 trackable surface forms and 34 atomic translation choices.
