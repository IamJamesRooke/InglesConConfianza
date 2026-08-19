# Backlog

> Last updated: 2026-08-19. This file contains current decisions and executable work only. Completed migration detail is preserved in the [curriculum migration log](history/curriculum-migration-log.md).

## Current objective

Build the smallest useful database-backed curriculum foundation. Start with reusable language blocks, let actual authoring reveal the data model, and postpone lessons and learner history until the foundation is useful.

## Now

- [x] Establish the six curriculum pillars: mappings, cognates, past and past participle, transformations, structure, and vocabulary.
- [x] Promote cognates and past forms to curriculum-level pillars and flatten prefix/suffix families under transformations.
- [x] Flatten vocabulary into one root-level Markdown file per category, preserving every prior source in a [collation manifest](history/vocabulary-collation-manifest.md).
- [x] Professionalize curriculum navigation and separate active work from migration history.
- [x] Create a minimal SQLite database with a `blocks` table.
- [x] Seed the first Spanish-to-English blocks for a representative sentence.
- [x] Create a minimal Next.js application that reads and displays the database blocks.
- [x] Add Tailwind CSS and shadcn/ui for a simple visual foundation.
- [x] Create the frontend Lesson Builder foundation with reorderable and renumbered lessons, optional names, deletion, an expandable content-block picker, and Markdown-backed WYSIWYG explanation blocks.
- [x] Add the first Sentence block authoring slice with ordered Spanish prompts, accepted English answers, automatic first-card creation, and keyboard-first card entry.
- [x] Add practical Sentence block editing controls: multiple accepted answers, content and language-block reordering, collapsing and deletion, and optional per-block hint or context notes.
- [x] Add optional Sentence explainer text, direct Spanish-to-English Tab navigation, and persistent bilingual header summaries for faster authoring and review.
- [x] Add optional post-answer feedback to Sentence blocks and lesson-level collapsing for managing longer authoring sessions.
- [x] Add live, non-blocking Sentence validation for required prompts and answers, empty alternatives, duplicate answers, and empty sentences.
- [ ] Build five representative lessons as the first vertical slice.
    - [ ] Include straightforward vocabulary retrieval.
    - [ ] Include a Spanish-to-English one-to-many mapping.
    - [ ] Include an English-to-Spanish mapping needed during authoring or explanation.
    - [ ] Include a conjugated form family with affirmative, negative, question, and negative-question uses.
    - [ ] Include a structural or word-transformation concept and deliberate review of earlier material.
- [ ] Derive the lesson and question contract from those five lessons.
    - [ ] Identify stable curriculum-object references.
    - [ ] Represent Spanish prompt blocks and accepted English answers.
    - [ ] Separate the primary concept being tested from concepts being reinforced.
    - [ ] Record exposure at lemma, form-family, surface-form, and atomic-mapping levels where useful.
- [ ] Define the minimum learner-history contract from actual question behavior.
    - [ ] Record attempts, correctness, error targets, and last exposure.
    - [ ] Support later spaced repetition without embedding learner state in curriculum files.

## Next

- [ ] Use the [teaching methodology reference](teaching-methodology.md) when designing lesson steps, feedback, and learner-facing UI.
- [ ] Decide the smallest block metadata needed for context-specific meanings and form families.
- [ ] Add one authoring workflow for creating and inspecting blocks.
- [ ] YAMLize or normalize only the curriculum objects required by the five-lesson slice.
- [ ] Run a Markdown-to-data dry run for those objects and verify stable IDs, accepted answers, and references.
- [ ] Build the smallest complete application flow: choose a lesson, answer Spanish-to-English text boxes, receive feedback, and save progress.
- [ ] Use authoring friction and learner evidence to decide which mapping hub or curriculum branch to normalize next.
- [ ] Continue bounded mapping work, beginning with the English **get** hub only when the lesson slice needs it.

## Later

- [ ] Continue evidence-based cutting, collation, and sequencing across the curriculum.
- [ ] Design spaced repetition from real exposure and error data.
- [ ] Add mastery gates, per-question feedback, and progress visualization after the basic learning loop works.
- [ ] Evaluate authentication, payments, deployment, security testing, and broader product infrastructure only when the MVP requires them.
- [ ] Document the teaching methodology and repository setup for maintainers and portfolio review.

## Security practice record

This section records controls and security work actually applied during development. Planned work remains unchecked; implementation alone is not evidence that a control is effective.

- [x] Audit the dependency tree when introducing the Markdown editor and pin the vulnerable transitive `js-yaml` dependency to patched version `4.3.1` through the package override.
- [ ] Create an initial threat model when the application gains persistent lesson authoring, authentication, or other meaningful trust boundaries.
- [ ] Add authorization tests alongside the first protected authoring or learner-data endpoints.
- [ ] Perform a controlled OWASP-based security assessment after the first complete application flow is deployable, preserve findings, and document the resulting hardening.

## Deliberate non-goals for the current phase

- Perfecting or YAMLizing the entire curriculum before building lessons.
- Encoding course order, exposure counts, or learner mastery inside mapping YAML.
- Expanding beyond Spanish-speaking adults learning English.
- Making CEFR, IELTS, or security claims before the product has evidence to support them.
