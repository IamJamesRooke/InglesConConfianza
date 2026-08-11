---
id: es-poder-future-indicative-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: future-indicative
family_features:
  tense: future
  mood: indicative
  verb_form: finite
status: draft
form_count: 5
mapping_count: 5
forms:
- id: es-poder-future-indicative-form-podremos
  surface: podremos
  source_features:
    grammatical_person: first
    mood: indicative
    number: plural
    referent_person: first
    tense: future
    verb_form: finite
- id: es-poder-future-indicative-form-podra
  surface: podrá
  source_features:
    grammatical_person: third
    mood: indicative
    number: singular
    referent_person: third
    tense: future
    verb_form: finite
- id: es-poder-future-indicative-form-podran
  surface: podrán
  source_features:
    grammatical_person: third
    mood: indicative
    number: plural
    referent_person:
    - second
    - third
    tense: future
    verb_form: finite
- id: es-poder-future-indicative-form-podras
  surface: podrás
  source_features:
    grammatical_person: second
    mood: indicative
    number: singular
    referent_person: second
    tense: future
    verb_form: finite
- id: es-poder-future-indicative-form-podre
  surface: podré
  source_features:
    grammatical_person: first
    mood: indicative
    number: singular
    referent_person: first
    tense: future
    verb_form: finite
mappings:
- id: es-podremos-future-ability--en-we-will-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podremos
  source_lemma: poder
  source_variant: future-ability
  target_language: en
  target: we will be able to
  target_lemma: be
  accepted_targets:
  - we'll be able to
  sense: future-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: future
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: plural
    tense: future
    mood: indicative
    verb_form: finite
  aliases:
  - nosotros podremos
  - nosotras podremos
  index_under:
  - poder
  - podremos
  reverse_status: linked
  reverse_ids:
  - en-we-will-be-able-to-future-ability--es-podremos
  status: draft
  examples:
  - source: Podremos terminar mañana.
    target: We will be able to finish tomorrow.
  family_id: es-poder-future-indicative-family
  form_id: es-poder-future-indicative-form-podremos
  teaching_note: Use **we will be able to** for this poder meaning in the context
    shown.
- id: es-podra-future-ability--en-will-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrá
  source_lemma: poder
  source_variant: future-ability-reverse
  target_language: en
  target: will be able to
  target_lemma: be
  accepted_targets:
  - he will be able to
  - he'll be able to
  - she will be able to
  - she'll be able to
  - it will be able to
  - it'll be able to
  sense: future-ability
  taxonomy:
    category: expression
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: future
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person: third
    number: singular
    tense: future
    mood: indicative
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - podrá
  reverse_status: linked
  reverse_ids:
  - en-will-be-able-to--es-podra
  status: draft
  examples:
  - source: Ana podrá ayudar mañana.
    target: Ana will be able to help tomorrow.
  family_id: es-poder-future-indicative-family
  form_id: es-poder-future-indicative-form-podra
  teaching_note: Use **will be able to** for this poder expression in the context
    shown.
- id: es-podran-future-ability--en-they-will-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrán
  source_lemma: poder
  source_variant: future-ability
  target_language: en
  target: they will be able to
  target_lemma: be
  accepted_targets:
  - you will be able to
  - they'll be able to
  sense: future-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: future
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: third
    referent_person:
    - second
    - third
    number: plural
    tense: future
    mood: indicative
    verb_form: finite
  aliases:
  - ellos podrán
  - ellas podrán
  - ustedes podrán
  index_under:
  - poder
  - podrán
  reverse_status: linked
  reverse_ids:
  - en-they-will-be-able-to-future-ability--es-podran
  status: draft
  examples:
  - source: Ellos podrán participar mañana.
    target: They will be able to participate tomorrow.
  family_id: es-poder-future-indicative-family
  form_id: es-poder-future-indicative-form-podran
  teaching_note: Use **they will be able to** for this poder meaning in the context
    shown.
- id: es-podras-future-ability--en-you-will-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podrás
  source_lemma: poder
  source_variant: future-ability
  target_language: en
  target: you will be able to
  target_lemma: be
  accepted_targets:
  - you'll be able to
  sense: future-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: future
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: second
    referent_person: second
    number: singular
    tense: future
    mood: indicative
    verb_form: finite
  aliases:
  - tú podrás
  index_under:
  - poder
  - podrás
  reverse_status: linked
  reverse_ids:
  - en-you-will-be-able-to-future-ability--es-podras
  status: draft
  examples:
  - source: Podrás entrar mañana.
    target: You will be able to come in tomorrow.
  family_id: es-poder-future-indicative-family
  form_id: es-poder-future-indicative-form-podras
  teaching_note: Use **you will be able to** for this poder meaning in the context
    shown.
- id: es-podre-future-ability--en-i-will-be-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: podré
  source_lemma: poder
  source_variant: future-ability
  target_language: en
  target: I will be able to
  target_lemma: be
  accepted_targets:
  - I'll be able to
  sense: future-ability
  taxonomy:
    category: verb
    subcategory: ability-expression
  source_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: future
    mood: indicative
    verb_form: finite
  target_features:
    grammatical_person: first
    referent_person: first
    number: singular
    tense: future
    mood: indicative
    verb_form: finite
  aliases:
  - yo podré
  index_under:
  - poder
  - podré
  reverse_status: linked
  reverse_ids:
  - en-i-will-be-able-to-future-ability--es-podre
  status: draft
  examples:
  - source: Podré llamarla mañana.
    target: I will be able to call her tomorrow.
  family_id: es-poder-future-indicative-family
  form_id: es-poder-future-indicative-form-podre
  teaching_note: Use **I will be able to** for this poder meaning in the context shown.
---

# Future Indicative of **poder**

Future ability expressed with forms such as podré and podrán. This family retains 5 trackable surface forms and 5 atomic translation choices.
