---
id: es-poder-preterite-indicative-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: preterite-indicative
family_features:
  tense: past
  mood: indicative
  verb_form: finite
status: draft
form_count: 5
mapping_count: 25
forms:
- id: es-poder-preterite-indicative-form-pude
  surface: pude
  source_features:
    grammatical_person: first
    mood: indicative
    number: singular
    referent_person: first
    tense: past
    verb_form: finite
- id: es-poder-preterite-indicative-form-pudieron
  surface: pudieron
  source_features:
    grammatical_person: third
    mood: indicative
    number: plural
    referent_person:
    - second
    - third
    tense: past
    verb_form: finite
- id: es-poder-preterite-indicative-form-pudimos
  surface: pudimos
  source_features:
    grammatical_person: first
    mood: indicative
    number: plural
    referent_person: first
    tense: past
    verb_form: finite
- id: es-poder-preterite-indicative-form-pudiste
  surface: pudiste
  source_features:
    grammatical_person: second
    mood: indicative
    number: singular
    referent_person: second
    tense: past
    verb_form: finite
- id: es-poder-preterite-indicative-form-pudo
  surface: pudo
  source_features:
    grammatical_person: third
    mood: indicative
    number: singular
    referent_person:
    - second
    - third
    tense: past
    verb_form: finite
mappings:
- id: es-no-pude-failed-past-attempt--en-i-couldn-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pude
  source_lemma: poder
  source_variant: failed-past-attempt
  target_language: en
  target: I couldn't
  target_lemma: could
  sense: failed-past-attempt
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - yo no pude
  index_under:
  - poder
  - pude
  reverse_status: linked
  reverse_ids:
  - en-i-couldn-t-failed-past-attempt--es-no-pude
  status: draft
  examples:
  - source: Ayer no pude abrir la puerta.
    target: I couldn't open the door yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pude
  teaching_note: Use **I couldn't** for this poder meaning in the context shown.
- id: es-no-pude-missed-past-opportunity--en-i-didn-t-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pude
  source_lemma: poder
  source_variant: missed-past-opportunity
  target_language: en
  target: I didn't get to
  target_lemma: get
  sense: missed-past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - yo no pude
  index_under:
  - poder
  - pude
  reverse_status: linked
  reverse_ids:
  - en-i-didn-t-get-to-missed-past-opportunity--es-no-pude
  status: draft
  examples:
  - source: Ayer no pude abrir la puerta.
    target: I didn't get to open the door yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pude
  teaching_note: Use **I didn't get to** for this poder meaning in the context shown.
- id: es-no-pudieron-failed-past-attempt--en-they-couldn-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudieron
  source_lemma: poder
  source_variant: failed-past-attempt
  target_language: en
  target: they couldn't
  target_lemma: could
  sense: failed-past-attempt
  taxonomy:
    category: verb
    subcategory: ability-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - ellos no pudieron
  - ellas no pudieron
  - ustedes no pudieron
  index_under:
  - poder
  - pudieron
  reverse_status: linked
  reverse_ids:
  - en-they-couldn-t-failed-past-attempt--es-no-pudieron
  status: draft
  examples:
  - source: Ellos no pudieron terminar a tiempo.
    target: They couldn't finish on time.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudieron
  teaching_note: Use **they couldn't** for this poder meaning in the context shown.
- id: es-no-pudieron-missed-past-opportunity--en-they-didn-t-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudieron
  source_lemma: poder
  source_variant: missed-past-opportunity
  target_language: en
  target: they didn't get to
  target_lemma: get
  sense: missed-past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - ellos no pudieron
  - ellas no pudieron
  - ustedes no pudieron
  index_under:
  - poder
  - pudieron
  reverse_status: linked
  reverse_ids:
  - en-they-didn-t-get-to-missed-past-opportunity--es-no-pudieron
  status: draft
  examples:
  - source: Ellos no pudieron terminar a tiempo.
    target: They didn't get to finish on time.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudieron
  teaching_note: Use **they didn't get to** for this poder meaning in the context
    shown.
- id: es-no-pudimos-failed-past-attempt--en-we-couldn-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudimos
  source_lemma: poder
  source_variant: failed-past-attempt
  target_language: en
  target: we couldn't
  target_lemma: could
  sense: failed-past-attempt
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros no pudimos
  - nosotras no pudimos
  index_under:
  - poder
  - pudimos
  reverse_status: linked
  reverse_ids:
  - en-we-couldn-t-failed-past-attempt--es-no-pudimos
  status: draft
  examples:
  - source: No no pudimos llegar a tiempo.
    target: We couldn't arrive on time.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudimos
  teaching_note: Use **we couldn't** for this poder meaning in the context shown.
- id: es-no-pudimos-missed-past-opportunity--en-we-didn-t-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudimos
  source_lemma: poder
  source_variant: missed-past-opportunity
  target_language: en
  target: we didn't get to
  target_lemma: get
  sense: missed-past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros no pudimos
  - nosotras no pudimos
  index_under:
  - poder
  - pudimos
  reverse_status: linked
  reverse_ids:
  - en-we-didn-t-get-to-missed-past-opportunity--es-no-pudimos
  status: draft
  examples:
  - source: No no pudimos llegar a tiempo.
    target: We didn't get to arrive on time.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudimos
  teaching_note: Use **we didn't get to** for this poder meaning in the context shown.
- id: es-no-pudiste-failed-past-attempt--en-you-couldn-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudiste
  source_lemma: poder
  source_variant: failed-past-attempt
  target_language: en
  target: you couldn't
  target_lemma: could
  sense: failed-past-attempt
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - tú no pudiste
  index_under:
  - poder
  - pudiste
  reverse_status: linked
  reverse_ids:
  - en-you-couldn-t-failed-past-attempt--es-no-pudiste
  status: draft
  examples:
  - source: Ayer no pudiste terminar el informe.
    target: You couldn't finish the report yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudiste
  teaching_note: Use **you couldn't** for this poder meaning in the context shown.
- id: es-no-pudiste-missed-past-opportunity--en-you-didn-t-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudiste
  source_lemma: poder
  source_variant: missed-past-opportunity
  target_language: en
  target: you didn't get to
  target_lemma: get
  sense: missed-past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - tú no pudiste
  index_under:
  - poder
  - pudiste
  reverse_status: linked
  reverse_ids:
  - en-you-didn-t-get-to-missed-past-opportunity--es-no-pudiste
  status: draft
  examples:
  - source: Ayer no pudiste terminar el informe.
    target: You didn't get to finish the report yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudiste
  teaching_note: Use **you didn't get to** for this poder meaning in the context shown.
- id: es-no-pudo-failed-past-attempt--en-she-couldn-t
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudo
  source_lemma: poder
  source_variant: failed-past-attempt
  target_language: en
  target: she couldn't
  target_lemma: could
  sense: failed-past-attempt
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - él no pudo
  - ella no pudo
  - usted no pudo
  index_under:
  - poder
  - pudo
  reverse_status: linked
  reverse_ids:
  - en-she-couldn-t-failed-past-attempt--es-no-pudo
  status: draft
  examples:
  - source: Ana no pudo resolver el problema.
    target: Ana couldn't solve the problem.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudo
  teaching_note: Use **she couldn't** for this poder meaning in the context shown.
- id: es-no-pudo-missed-past-opportunity--en-she-didn-t-get-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no pudo
  source_lemma: poder
  source_variant: missed-past-opportunity
  target_language: en
  target: she didn't get to
  target_lemma: get
  sense: missed-past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - él no pudo
  - ella no pudo
  - usted no pudo
  index_under:
  - poder
  - pudo
  reverse_status: linked
  reverse_ids:
  - en-she-didn-t-get-to-missed-past-opportunity--es-no-pudo
  status: draft
  examples:
  - source: Ana no pudo resolver el problema.
    target: Ana didn't get to solve the problem.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudo
  teaching_note: Use **she didn't get to** for this poder meaning in the context shown.
- id: es-pude-past-opportunity--en-i-got-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pude
  source_lemma: poder
  source_variant: past-opportunity
  target_language: en
  target: I got to
  target_lemma: get
  sense: past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - yo pude
  index_under:
  - poder
  - pude
  reverse_status: linked
  reverse_ids:
  - en-i-got-to-past-opportunity--es-pude
  status: draft
  examples:
  - source: Ayer pude visitar Cartagena.
    target: I got to visit Cartagena yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pude
  teaching_note: Use **I got to** for this poder meaning in the context shown.
- id: es-pude-specific-past-success--en-i-was-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pude
  source_lemma: poder
  source_variant: specific-past-success
  target_language: en
  target: I was able to
  target_lemma: be
  sense: specific-past-success
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - yo pude
  index_under:
  - poder
  - pude
  reverse_status: linked
  reverse_ids:
  - en-i-was-able-to-specific-past-success--es-pude
  status: draft
  examples:
  - source: Ayer pude abrir la puerta.
    target: I was able to open the door yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pude
  teaching_note: Use **I was able to** for this poder meaning in the context shown.
- id: es-pude-successful-effort--en-i-managed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pude
  source_lemma: poder
  source_variant: successful-effort
  target_language: en
  target: I managed to
  target_lemma: manage
  sense: successful-effort
  taxonomy:
    category: verb
    subcategory: success-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - yo pude
  index_under:
  - poder
  - pude
  reverse_status: linked
  reverse_ids:
  - en-i-managed-to-successful-effort--es-pude
  status: draft
  examples:
  - source: Ayer pude abrir la puerta.
    target: I managed to open the door yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pude
  teaching_note: Use **I managed to** for this poder meaning in the context shown.
- id: es-pudieron-past-opportunity--en-they-got-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudieron
  source_lemma: poder
  source_variant: past-opportunity
  target_language: en
  target: they got to
  target_lemma: get
  sense: past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - ellos pudieron
  - ellas pudieron
  - ustedes pudieron
  index_under:
  - poder
  - pudieron
  reverse_status: linked
  reverse_ids:
  - en-they-got-to-past-opportunity--es-pudieron
  status: draft
  examples:
  - source: Ellos pudieron visitar Cartagena.
    target: They got to visit Cartagena.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudieron
  teaching_note: Use **they got to** for this poder meaning in the context shown.
- id: es-pudieron-past-plural-ability-or-success--en-were-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudieron
  source_lemma: poder
  source_variant: past-plural-ability-reverse
  target_language: en
  target: were able to
  target_lemma: be
  accepted_targets:
  - they were able to
  sense: past-plural-ability-or-success
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person: third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person: third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - pudieron
  reverse_status: linked
  reverse_ids:
  - en-were-able-to--es-pudieron
  status: draft
  examples:
  - source: Pudieron terminar el informe.
    target: They were able to finish the report.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudieron
  teaching_note: Use **were able to** for this poder expression in the context shown.
- id: es-pudieron-successful-effort--en-they-managed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudieron
  source_lemma: poder
  source_variant: successful-effort
  target_language: en
  target: they managed to
  target_lemma: manage
  sense: successful-effort
  taxonomy:
    category: verb
    subcategory: success-expression
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
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - ellos pudieron
  - ellas pudieron
  - ustedes pudieron
  index_under:
  - poder
  - pudieron
  reverse_status: linked
  reverse_ids:
  - en-they-managed-to-successful-effort--es-pudieron
  status: draft
  examples:
  - source: Ellos pudieron terminar a tiempo.
    target: They managed to finish on time.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudieron
  teaching_note: Use **they managed to** for this poder meaning in the context shown.
- id: es-pudimos-past-opportunity--en-we-got-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudimos
  source_lemma: poder
  source_variant: past-opportunity
  target_language: en
  target: we got to
  target_lemma: get
  sense: past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros pudimos
  - nosotras pudimos
  index_under:
  - poder
  - pudimos
  reverse_status: linked
  reverse_ids:
  - en-we-got-to-past-opportunity--es-pudimos
  status: draft
  examples:
  - source: Pudimos visitar Cartagena.
    target: We got to visit Cartagena.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudimos
  teaching_note: Use **we got to** for this poder meaning in the context shown.
- id: es-pudimos-specific-past-success--en-we-were-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudimos
  source_lemma: poder
  source_variant: specific-past-success
  target_language: en
  target: we were able to
  target_lemma: be
  sense: specific-past-success
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros pudimos
  - nosotras pudimos
  index_under:
  - poder
  - pudimos
  reverse_status: linked
  reverse_ids:
  - en-we-were-able-to-specific-past-success--es-pudimos
  status: draft
  examples:
  - source: Pudimos llegar a tiempo.
    target: We were able to arrive on time.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudimos
  teaching_note: Use **we were able to** for this poder meaning in the context shown.
- id: es-pudimos-successful-effort--en-we-managed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudimos
  source_lemma: poder
  source_variant: successful-effort
  target_language: en
  target: we managed to
  target_lemma: manage
  sense: successful-effort
  taxonomy:
    category: verb
    subcategory: success-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros pudimos
  - nosotras pudimos
  index_under:
  - poder
  - pudimos
  reverse_status: linked
  reverse_ids:
  - en-we-managed-to-successful-effort--es-pudimos
  status: draft
  examples:
  - source: Pudimos llegar a tiempo.
    target: We managed to arrive on time.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudimos
  teaching_note: Use **we managed to** for this poder meaning in the context shown.
- id: es-pudiste-past-opportunity--en-you-got-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudiste
  source_lemma: poder
  source_variant: past-opportunity
  target_language: en
  target: you got to
  target_lemma: get
  sense: past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - tú pudiste
  index_under:
  - poder
  - pudiste
  reverse_status: linked
  reverse_ids:
  - en-you-got-to-past-opportunity--es-pudiste
  status: draft
  examples:
  - source: Ayer pudiste visitar Cartagena.
    target: You got to visit Cartagena yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudiste
  teaching_note: Use **you got to** for this poder meaning in the context shown.
- id: es-pudiste-specific-past-success--en-you-were-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudiste
  source_lemma: poder
  source_variant: specific-past-success
  target_language: en
  target: you were able to
  target_lemma: be
  sense: specific-past-success
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - tú pudiste
  index_under:
  - poder
  - pudiste
  reverse_status: linked
  reverse_ids:
  - en-you-were-able-to-specific-past-success--es-pudiste
  status: draft
  examples:
  - source: Ayer pudiste terminar el informe.
    target: You were able to finish the report yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudiste
  teaching_note: Use **you were able to** for this poder meaning in the context shown.
- id: es-pudiste-successful-effort--en-you-managed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudiste
  source_lemma: poder
  source_variant: successful-effort
  target_language: en
  target: you managed to
  target_lemma: manage
  sense: successful-effort
  taxonomy:
    category: verb
    subcategory: success-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - tú pudiste
  index_under:
  - poder
  - pudiste
  reverse_status: linked
  reverse_ids:
  - en-you-managed-to-successful-effort--es-pudiste
  status: draft
  examples:
  - source: Ayer pudiste terminar el informe.
    target: You managed to finish the report yesterday.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudiste
  teaching_note: Use **you managed to** for this poder meaning in the context shown.
- id: es-pudo-past-ability-or-success--en-was-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudo
  source_lemma: poder
  source_variant: past-third-singular-ability-reverse
  target_language: en
  target: was able to
  target_lemma: be
  accepted_targets:
  - he was able to
  - she was able to
  - it was able to
  sense: past-ability-or-success
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - pudo
  reverse_status: linked
  reverse_ids:
  - en-was-able-to--es-pudo
  status: draft
  examples:
  - source: Ana pudo terminar el informe.
    target: Ana was able to finish the report.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudo
  teaching_note: Use **was able to** for this poder expression in the context shown.
- id: es-pudo-past-opportunity--en-she-got-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudo
  source_lemma: poder
  source_variant: past-opportunity
  target_language: en
  target: she got to
  target_lemma: get
  sense: past-opportunity
  taxonomy:
    category: verb
    subcategory: opportunity-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - él pudo
  - ella pudo
  - usted pudo
  index_under:
  - poder
  - pudo
  reverse_status: linked
  reverse_ids:
  - en-she-got-to-past-opportunity--es-pudo
  status: draft
  examples:
  - source: Ana pudo visitar Cartagena.
    target: Ana got to visit Cartagena.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudo
  teaching_note: Use **she got to** for this poder meaning in the context shown.
- id: es-pudo-successful-effort--en-she-managed-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: pudo
  source_lemma: poder
  source_variant: successful-effort
  target_language: en
  target: she managed to
  target_lemma: manage
  sense: successful-effort
  taxonomy:
    category: verb
    subcategory: success-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: singular
    tense: past
    mood: indicative
    verb_form: finite
  aliases:
  - él pudo
  - ella pudo
  - usted pudo
  index_under:
  - poder
  - pudo
  reverse_status: linked
  reverse_ids:
  - en-she-managed-to-successful-effort--es-pudo
  status: draft
  examples:
  - source: Ana pudo resolver el problema.
    target: Ana managed to solve the problem.
  family_id: es-poder-preterite-indicative-family
  form_id: es-poder-preterite-indicative-form-pudo
  teaching_note: Use **she managed to** for this poder meaning in the context shown.
---

# Preterite Indicative of **poder**

Completed past success, effort, opportunity, and failed attempts. This family retains 5 trackable surface forms and 25 atomic translation choices.
