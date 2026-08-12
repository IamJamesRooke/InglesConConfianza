# Inglés Con Confianza: Product Brief

## Product idea

Inglés Con Confianza is a focused English-learning application for Spanish-speaking adults. Its distinctive value is not a large catalog of disconnected vocabulary. It is a carefully curated system for learning the translation choices and sentence patterns that repeatedly cause Spanish speakers to sound unnatural or become stuck.

The curriculum emphasizes three especially valuable kinds of knowledge:

- **mappings:** one frequent Spanish or English form can require several natural translations depending on context;
- **transformations:** familiar words become new words or grammatical forms through reusable sound and word-building patterns;
- **structure:** a limited vocabulary can be recombined into statements, questions, negations, descriptions, and connected ideas.

Cognates, past forms, and compact vocabulary references support those three systems.

## Problem

Many learners can recognize a substantial amount of English but cannot reliably produce simple, natural sentences. General-purpose apps often reward isolated word recognition while giving too little attention to high-value contrasts such as **ser / estar → be**, **poder → can / could / manage to**, or **lo → it / him / you / the ... thing**. Traditional grammar explanations can add terminology without creating fast, usable intuition.

The course needs to make these choices explicit, introduce them in small steps, and revisit them until production becomes automatic. It also needs to tell the author what has already been taught, what has not been taught, and which forms a learner repeatedly misses.

## Target student

The initial student is a Spanish-speaking adult, with Colombian and broader Latin American Spanish as the default language context. The student may have studied English before but lacks confidence, automaticity, or a clear mental model of how familiar Spanish ideas map into natural English.

The first product is intentionally narrow: Spanish-to-English practice for this audience. It is not a general multilingual platform.

## Core learning experience

The basic exercise presents a Spanish sentence in meaningful blocks. The learner types the corresponding English for each block:

| Spanish prompt | QUIERO | COMER | ALGO | PORQUE | TENGO HAMBRE |
|---|---|---|---|---|---|
| Expected English | I want | to eat | something | because | I'm hungry |

Each block is drawn from reusable curriculum objects rather than being treated as disposable text. A question can identify the main concept it tests and the earlier concepts it reinforces. Feedback can therefore be specific: the application can eventually know that a learner struggles with **might**, has seen the present family of **poder** twice, or has not yet practiced **they**.

## Data boundaries

The product should grow around three separate kinds of records:

1. **Curriculum objects** hold stable linguistic facts: source and target forms, meaning, examples, aliases, grammatical features, and relationships to other concepts.
2. **Lessons and questions** compose curriculum objects into an intentional sequence, define prompts and accepted answers, and distinguish the primary teaching target from reinforced material.
3. **Learner history** records attempts, errors, exposure, mastery evidence, and future review timing without modifying the curriculum source.

The current Markdown curriculum is an authoring reference and an intermediate source of truth. Stable IDs and YAML are introduced where they solve a demonstrated lesson or migration need; the entire curriculum does not need to be converted before product work begins.

## First vertical slice

The first implementation should use five representative lessons. Together they should exercise direct vocabulary, a one-to-many mapping in each useful authoring direction, a conjugated modal family with statement/question/negation contrasts, a structural or transformation rule, and spaced review of prior material.

This slice is successful when the owner can:

- author the five lessons without duplicating linguistic facts;
- query which concepts and form families have appeared;
- render Spanish blocks with accepted English answers;
- record attempts against stable curriculum references;
- distinguish two exposures to the present family of **poder** from one exposure each to **puedo** and **puede**;
- identify schema changes from real authoring friction rather than speculation.

## Non-goals for the first version

- Completing, sequencing, or YAMLizing the entire curriculum.
- Supporting languages other than Spanish and English.
- Speech recognition, rotating accents, payments, social features, or elaborate gamification.
- Claiming CEFR/IELTS outcomes before curriculum coverage and learner results support them.
- Building speculative infrastructure before the five-lesson learning loop works.

## Open product questions

- How strict should accepted answers be about contractions, punctuation, capitalization, and synonymous wording?
- When should one sentence be split into multiple answer blocks?
- Which errors should trigger an immediate explanation, another near-identical question, or later review?
- What evidence is sufficient to mark a lemma, form family, surface form, or mapping as learned?
- Which five lessons expose the most important data and teaching constraints with the least implementation work?
