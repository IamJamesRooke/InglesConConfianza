# Ingles Con Confianza: Product Brief

## Product idea

Ingles Con Confianza is a focused English-learning application for Spanish-speaking adults. Its distinctive value is a carefully curated system for understanding and producing the translation choices, sentence patterns, word families, and pronunciation contrasts that repeatedly cause Spanish speakers to become stuck or sound unnatural.

The course is built from the owner's teaching methodology. It favors visible patterns, short explanations, immediate retrieval, useful sentence building, and frequent evidence that the learner can already say something meaningful.

## Problem

Many learners can recognize substantial English vocabulary but cannot reliably produce simple, natural sentences. General-purpose applications often reward isolated word recognition while giving too little attention to high-value contrasts such as:

- `ser` and `estar` mapping to different uses of `be`;
- `poder` mapping to `can`, `could`, `may`, `might`, or `manage to`;
- English verbs selecting a full infinitive, bare infinitive, gerund, or participle; and
- familiar-looking words changing meaning, form, or pronunciation in ways a Spanish speaker cannot safely guess.

Traditional grammar explanations can add terminology without creating usable intuition. The course must make the relevant distinction visible, teach one small idea at a time, and revisit it until production becomes confident and automatic.

## Target student

The initial learner is a Spanish-speaking adult, with Colombian and broader Latin American Spanish as the default context. The learner may have studied English before but lacks confidence, automaticity, or a clear mental model of how familiar Spanish ideas become natural English.

The first product is intentionally narrow: Spanish-to-English learning for this audience. It is not a general multilingual platform.

## Core learning experience

Lessons alternate short explanations with immediate action. A learner sees a Spanish prompt, retrieves the corresponding English, receives fast non-punitive feedback, and then combines known pieces into a more useful phrase or sentence.

For example:

| Spanish prompt | QUIERO | COMER | ALGO | PORQUE | TENGO HAMBRE |
|---|---|---|---|---|---|
| Expected English | I want | to eat | something | because | I'm hungry |

Difficulty should come from retrieving and recombining taught language, never from guessing an untaught word, spelling change, or construction. Every lesson ends with a confidence-building result the learner can imagine using outside the application.

## Curriculum strategy

The curriculum combines several kinds of reusable knowledge:

- mappings between Spanish concepts and natural English targets;
- sentence-building structure and verb-form selection;
- cognate, spelling, and false-cognate families;
- word and grammatical transformations;
- pronunciation and sound families; and
- supporting vocabulary grouped for practical retrieval.

PostgreSQL is the canonical curriculum source of truth. Every teachable concept is Spanish-first and has one English target, one generic bilingual example, reusable collections, and one role: `core`, `supporting`, or `reference`.

The current curation phase deliberately removes low-value material. `core` is reserved for language a learner must explicitly control to make English function. `supporting` is selective and broadly reusable. `reference` retains useful secondary material without forcing it into the teaching sequence.

## Data boundaries

The product maintains three separate kinds of records:

1. Curriculum concepts hold stable linguistic facts and reusable query collections in PostgreSQL.
2. Lessons compose curriculum knowledge into an intentional sequence and remain handcrafted in `web/data/lessons.json` while the lesson contract is still being proven.
3. Future learner history will record attempts, help use, exposure, and review timing without modifying curriculum or lesson content.

Raw migrated source documents remain immutable PostgreSQL provenance. They protect against information loss but do not require the course to retain every imported concept.

## Current product surfaces

- Curriculum provides bilingual search, exact role and collection filters, pagination, inline editing, role changes, collection editing, and deletion.
- Review inbox provides a guarded workflow for inspecting proposed additions and revisions before applying them to the canonical curriculum.
- Lesson Builder supports handcrafted explanations and sentence practice with accepted alternatives, hints, feedback, validation, reordering, duplication, previews, and JSON persistence.
- Practice runs the authored lesson model with immediate answer recognition, help, feedback, and lesson navigation.

## Next product milestone: Module 1

The first production module should make one concrete promise to the learner and fulfill it through a sequence of short lessons. Its curriculum concepts must be curated before use, but the entire database does not need to be perfect.

Module 1 succeeds when:

- every assessed answer is teachable on the first attempt;
- each lesson has one primary focus and a useful confidence-building ending;
- earlier language is deliberately retrieved and recombined;
- pronunciation bridges appear wherever English spelling would mislead the target learner;
- the module can be authored cleanly in Lesson Builder and completed in Practice; and
- authoring exposes actionable curriculum corrections rather than requiring speculative schema design.

## Non-goals for the current phase

- Perfecting all 4,487 curriculum concepts before beginning Module 1.
- Supporting languages other than Spanish and English.
- Moving Lesson Builder or learner data into PostgreSQL before real product needs justify it.
- Adding authentication, payments, social features, speech recognition, or elaborate gamification before the core learning loop is proven.
- Claiming CEFR, IELTS, security, or learning outcomes without evidence.

## Open product questions

- What exact learner promise should Module 1 fulfill?
- Which smallest Core and Supporting concept set unlocks that promise?
- How strict should accepted answers be about contractions, punctuation, capitalization, and natural alternatives?
- Which unsuccessful attempts need immediate clarification, a smaller bridge, or later retrieval?
- What stable concept references does lesson authoring actually need?
- What evidence should future learner history use to schedule review without turning mistakes into punishment?
