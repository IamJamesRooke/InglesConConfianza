# Reference Slice Inventory

This is a bounded inventory for testing the curriculum database against existing material. It is not a course sequence, a complete import plan, or a replacement for the canonical Markdown files.

## Scope

The inventory covers these existing files:

- [Querer README](mappings/spanish-to-english/querer/README.md)
- [Querer algo](mappings/spanish-to-english/querer/querer%20algo%20(want%20something).md)
- [Querer hacer algo](mappings/spanish-to-english/querer/querer%20hacer%20algo%20(want%20to%20do%20something).md)
- [Querer que alguien haga algo](mappings/spanish-to-english/querer/querer%20que%20alguien%20haga%20algo%20(want%20somebody%20to%20do%20something).md)
- [A → destination](mappings/spanish-to-english/a/02-destination.md)
- [Para + infinitive](mappings/spanish-to-english/para/02-purpose-with-infinitive.md)
- [Purpose with para](structure/verb-forms/full-infinitive/purpose-with-para.md)

The last two files overlap intentionally. They help us distinguish a translation mapping from a broader structural explanation without duplicating the underlying learner-facing pattern.

## Construction inventory

### 1. Querer algo → Want something

Source: [querer algo](mappings/spanish-to-english/querer/querer%20algo%20(want%20something).md)

| Field | Inventory value |
|---|---|
| Spanish pattern | `[forma de querer] + [algo]` |
| English pattern | `[form of want] + [something]` |
| Teaching decision | Use **want + noun** when the thing wanted is a person, object, idea, or experience. |
| Variable slots | `querer_form`; `thing` |

Examples:

| Spanish | English |
|---|---|
| Quiero un café. | I want a coffee. |

Schema pressure:

- `thing` is a noun phrase, not necessarily the literal block `algo`.
- `quiero`, `quieres`, and `queremos` are different surface forms that belong to the same wanting family.

### 2. Querer hacer algo → Want to do something

Source: [querer hacer algo](mappings/spanish-to-english/querer/querer%20hacer%20algo%20(want%20to%20do%20something).md)

| Field | Inventory value |
|---|---|
| Spanish pattern | `[forma de querer] + [hacer algo]` |
| English pattern | `[form of want] + to + [do something]` |
| Teaching decision | Use **want + to + base verb** when the person who wants something also performs the action. |
| Variable slots | `querer_form`; `verb_phrase` |

Examples:

| Spanish | English |
|---|---|
| Quiero preparar el café. | I want to make the coffee. |

Schema pressure:

- `verb_phrase` must accept any suitable infinitive phrase, not only `hacer`.
- The target is not a direct word-for-word translation of the Spanish infinitive form.

### 3. Querer que alguien haga algo → Want somebody to do something

Source: [querer que alguien haga algo](mappings/spanish-to-english/querer/querer%20que%20alguien%20haga%20algo%20(want%20somebody%20to%20do%20something).md)

| Field | Inventory value |
|---|---|
| Spanish pattern | `[forma de querer] + que + [alguien] + [verbo en subjuntivo]` |
| English pattern | `[form of want] + [somebody] + to + [verb]` |
| Teaching decision | Spanish uses **que + subjunctive** when another person performs the action. English normally puts that person directly after **want** and uses **to + base verb**. |
| Variable slots | `querer_form`; `embedded_subject`; `embedded_verb_phrase` |

Examples:

| Spanish | English |
|---|---|
| Quiero que Laura haga la reserva. | I want Laura to make the reservation. |

Schema pressure:

- The main subject and embedded subject are separate values.
- The embedded subject may be explicit, as in **Laura**, or encoded by the Spanish verb form.
- The embedded verb needs grammatical features such as subjunctive mood, person, and number.
- The English target needs the embedded subject as an object form: **Laura**, **him**, **us**, and so on.

### 4. A + un lugar → To + a place

Source: [A → destination](mappings/spanish-to-english/a/02-destination.md)

| Field | Inventory value |
|---|---|
| Spanish pattern | `a + [un lugar]` |
| English pattern | `to + [a place]` |
| Teaching decision | Spanish **a** marks a destination. **Hacia** is a related but separate direction choice that can become **toward**. |
| Variable slots | `place` |

Examples:

| Spanish | English |
|---|---|
| Voy a la oficina. | I am going to the office. |
| Lleva el documento a la tienda. | Take the document to the store. |

Schema pressure:

- The surface block `a` cannot have one permanent English translation.
- The destination phrase is variable and can be a noun phrase or a named place.
- `a` with a recipient, personal object, or clock time must be represented as a different construction or meaning.

### 5. Para + hacer algo → To + do something

Sources: [Para + infinitive](mappings/spanish-to-english/para/02-purpose-with-infinitive.md) and [Purpose with para](structure/verb-forms/full-infinitive/purpose-with-para.md)

| Field | Inventory value |
|---|---|
| Spanish pattern | `para + [hacer algo]` |
| English pattern | `to + [do something]` |
| Teaching decision | For ordinary purpose, English normally uses **to + base verb**, not **for + base verb**. **In order to** can add emphasis. |
| Variable slots | `verb_phrase` |

Examples:

| Spanish | English |
|---|---|
| Necesito tiempo para terminar el informe. | I need time to finish the report. |
| para hacerlo | to do it |
| para confirmar la reunión | to confirm the meeting |
| para hablar con Laura | to speak with Laura |
| Voy a la oficina para hablar con Laura. | I am going to the office to speak with Laura. |

Schema pressure:

- The slot accepts different verbs and can contain a larger verb phrase.
- The mapping file and structure file should not create duplicate constructions. They have different explanatory roles but share the same core pattern.
- **Para que + different subject** is an explicit boundary case and normally maps to **so that**, not this construction.

## What this slice reveals

The current construction model is directionally correct, but it is missing one important capability if we want the database to understand examples rather than merely display them:

```text
construction_example_slots
- example_id
- slot_name
- source_value
- target_value
```

For example, an example of **querer que alguien haga algo** should be able to identify:

```text
embedded_subject:
  source: Laura
  target: Laura

embedded_verb_phrase:
  source: haga la reserva
  target: make the reservation
```

The pattern belongs in the construction. The concrete values belong in the example. The example should not become a new construction merely because its slot values change.

## Deliberate exclusions

This inventory does not yet include:

- all forms of **querer**;
- **querer a alguien** → **love somebody**;
- **querer decir** → **mean**;
- recipient, personal-object, or time uses of **a**;
- **para que** constructions;
- automatic verb conjugation;
- lessons, exercises, or learner history.

Those are useful future tests, but adding them now would mix new teaching coverage with schema discovery.
