---
id: es-poder-perfect-constructions-family
kind: mapping-family
direction: spanish-to-english
source_language: es
source_lemma: poder
target_language: en
form_family: perfect-constructions
family_features: {}
status: draft
form_count: 6
mapping_count: 8
forms:
- id: es-poder-perfect-constructions-form-ha-podido
  surface: ha podido
  source_features:
    grammatical_person: third
    mood: indicative
    number: singular
    referent_person: third
    tense: present
    verb_form: finite
- id: es-poder-perfect-constructions-form-habria-podido
  surface: habría podido
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
- id: es-poder-perfect-constructions-form-habriamos-podido
  surface: habríamos podido
  source_features:
    grammatical_person: first
    mood: indicative
    number: plural
    referent_person: first
    tense: conditional
    verb_form: finite
- id: es-poder-perfect-constructions-form-habia-podido
  surface: había podido
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
    tense: past
    verb_form: finite
- id: es-poder-perfect-constructions-form-he-podido
  surface: he podido
  source_features:
    grammatical_person: first
    mood: indicative
    number: singular
    referent_person: first
    tense: present
    verb_form: finite
- id: es-poder-perfect-constructions-form-hemos-podido
  surface: hemos podido
  source_features:
    grammatical_person: first
    mood: indicative
    number: plural
    referent_person: first
    tense: present
    verb_form: finite
mappings:
- id: es-ha-podido-third-singular-perfect-ability--en-has-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: ha podido
  source_lemma: poder
  source_variant: perfect-third-singular-ability-reverse
  target_language: en
  target: has been able to
  target_lemma: be
  accepted_targets:
  - he has been able to
  - she has been able to
  - it has been able to
  sense: third-singular-perfect-ability
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
  - ha-podido
  reverse_status: linked
  reverse_ids:
  - en-has-been-able-to--es-ha-podido
  status: draft
  examples:
  - source: Ana ha podido practicar todos los días.
    target: Ana has been able to practice every day.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-ha-podido
  teaching_note: Use **has been able to** for this poder expression in the context
    shown.
- id: es-habria-podido-unrealized-past-possibility--en-i-could-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: habría podido
  source_lemma: poder
  source_variant: unrealized-past-possibility
  target_language: en
  target: I could have
  target_lemma: could
  sense: unrealized-past-possibility
  taxonomy:
    category: expression
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
    grammatical_person: first
    referent_person: first
    number: singular
    tense: conditional
    mood: indicative
    verb_form: finite
  aliases: []
  index_under:
  - poder
  - habría-podido
  reverse_status: linked
  reverse_ids:
  - en-i-could-have-unrealized-past-possibility--es-habria-podido
  status: draft
  examples:
  - source: Habría podido ayudar si me hubiera llamado.
    target: I could have helped if you had called me.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-habria-podido
  teaching_note: Use **I could have** for this poder meaning in the context shown.
- id: es-habriamos-podido-unrealized-past-possibility--en-we-could-have
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: habríamos podido
  source_lemma: poder
  source_variant: unrealized-past-possibility
  target_language: en
  target: we could have
  target_lemma: could
  sense: unrealized-past-possibility
  taxonomy:
    category: expression
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
  aliases: []
  index_under:
  - poder
  - habríamos-podido
  reverse_status: linked
  reverse_ids:
  - en-we-could-have-unrealized-past-possibility--es-habriamos-podido
  status: draft
  examples:
  - source: Habríamos podido terminar ayer.
    target: We could have finished yesterday.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-habriamos-podido
  teaching_note: Use **we could have** for this poder meaning in the context shown.
- id: es-habia-podido-past-perfect-ability--en-i-had-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: había podido
  source_lemma: poder
  source_variant: past-perfect-ability
  target_language: en
  target: I had been able to
  target_lemma: be
  sense: past-perfect-ability
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
  aliases: []
  index_under:
  - poder
  - había-podido
  reverse_status: linked
  reverse_ids:
  - en-i-had-been-able-to-past-perfect-ability--es-habia-podido
  status: draft
  examples:
  - source: Hasta entonces, había podido trabajar desde casa.
    target: Until then, I had been able to work from home.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-habia-podido
  teaching_note: Use **I had been able to** for this poder meaning in the context
    shown.
- id: es-he-podido-first-singular-perfect-ability--en-have-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: he podido
  source_lemma: poder
  source_variant: perfect-first-singular-ability-reverse
  target_language: en
  target: have been able to
  target_lemma: be
  accepted_targets:
  - I have been able to
  - I've been able to
  sense: first-singular-perfect-ability
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
  - he-podido
  reverse_status: linked
  reverse_ids:
  - en-have-been-able-to-i--es-he-podido
  status: draft
  examples:
  - source: He podido practicar todos los días.
    target: I have been able to practice every day.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-he-podido
  teaching_note: Use **have been able to** for this poder expression in the context
    shown.
- id: es-he-podido-present-perfect-ability--en-i-have-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: he podido
  source_lemma: poder
  source_variant: present-perfect-ability
  target_language: en
  target: I have been able to
  target_lemma: be
  sense: present-perfect-ability
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
  - he-podido
  reverse_status: linked
  reverse_ids:
  - en-i-have-been-able-to-present-perfect-ability--es-he-podido
  status: draft
  examples:
  - source: He podido hablar con Ana.
    target: I have been able to speak with Ana.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-he-podido
  teaching_note: Use **I have been able to** for this poder meaning in the context
    shown.
- id: es-hemos-podido-present-perfect-ability--en-we-have-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: hemos podido
  source_lemma: poder
  source_variant: present-perfect-ability
  target_language: en
  target: we have been able to
  target_lemma: be
  sense: present-perfect-ability
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
  - hemos-podido
  reverse_status: linked
  reverse_ids:
  - en-we-have-been-able-to-present-perfect-ability--es-hemos-podido
  status: draft
  examples:
  - source: Hemos podido terminar a tiempo.
    target: We have been able to finish on time.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-hemos-podido
  teaching_note: Use **we have been able to** for this poder meaning in the context
    shown.
- id: es-no-hemos-podido-negative-present-perfect-ability--en-we-haven-t-been-able-to
  kind: mapping
  direction: spanish-to-english
  source_language: es
  source: no hemos podido
  source_lemma: poder
  source_variant: negative-present-perfect-ability
  target_language: en
  target: we haven't been able to
  target_lemma: be
  sense: negative-present-perfect-ability
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
  - hemos-podido
  reverse_status: linked
  reverse_ids:
  - en-we-haven-t-been-able-to-negative-present-perfect-ability--es-no-hemos-podido
  status: draft
  examples:
  - source: No hemos podido encontrar un apartamento económico.
    target: We haven't been able to find an affordable apartment.
  family_id: es-poder-perfect-constructions-family
  form_id: es-poder-perfect-constructions-form-hemos-podido
  teaching_note: Use **we haven't been able to** for this poder meaning in the context
    shown.
---

# Perfect Constructions of **poder**

Present, past, and conditional perfect constructions built with podido. This family retains 6 trackable surface forms and 8 atomic translation choices.
