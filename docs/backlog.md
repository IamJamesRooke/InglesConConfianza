# Backlog

> Last updated: 2026-08-23. This file contains current decisions and executable work only. Completed migration detail is preserved in the [curriculum migration log](history/curriculum-migration-log.md).
> Quick handoff: PostgreSQL is the canonical curriculum store; Lesson Builder remains JSON-backed. The former `docs/curriculum/mappings` tree is preserved losslessly in PostgreSQL and its immutable seed snapshot, so mapping normalization and curation now work from the database.

## Current objective

Migrate every useful curriculum concept from `docs/curriculum` into PostgreSQL without losing source material. Normalize the captured mappings archive into Spanish-first concepts from inside PostgreSQL, assigning provisional roles and queryable collections before later curation.

## Now

- [x] Establish the six curriculum pillars: mappings, cognates, past and past participle, transformations, structure, and vocabulary.
- [x] Promote cognates and past forms to curriculum-level pillars and flatten prefix/suffix families under transformations.
- [x] Flatten vocabulary into one root-level Markdown file per category, preserving every prior source in a [collation manifest](history/vocabulary-collation-manifest.md).
- [x] Professionalize curriculum navigation and separate active work from migration history.
- [x] Add Tailwind CSS and shadcn/ui for a simple visual foundation.
- [x] Create the frontend Lesson Builder foundation with reorderable and renumbered lessons, optional names, deletion, an expandable content-block picker, and Markdown-backed WYSIWYG explanation blocks.
- [x] Add the first Sentence block authoring slice with ordered Spanish prompts, accepted English answers, automatic first-card creation, and keyboard-first card entry.
- [x] Add practical Sentence block editing controls: multiple accepted answers, content and language-block reordering, collapsing and deletion, and optional per-block hint or context notes.
- [x] Add optional Sentence explainer text, direct Spanish-to-English Tab navigation, and persistent bilingual header summaries for faster authoring and review.
- [x] Add optional post-answer feedback to Sentence blocks and lesson-level collapsing for managing longer authoring sessions.
- [x] Add live, non-blocking Sentence validation for required prompts and answers, empty alternatives, duplicate answers, and empty sentences.
- [x] Add an interactive learner preview with authored Label, Prompt, and Helper text; automatic answer recognition and focus progression; temporary help; and post-completion feedback.
- [x] Add global settings with persistent theme selection and theme-aware surface layers for clearer Lesson Builder visual hierarchy.
- [x] Retire the initial SQLite/demo lesson prototype in favor of JSON-backed handcrafted lesson authoring while the curriculum database is redesigned from real lesson examples.
- [x] Add the first experimental curriculum graph draft with directional Spanish-to-English and English-to-Spanish mapping cards, lesson evidence, and speaking-priority metadata.
- [x] Begin keyboard-first Lesson Builder ergonomics with `Alt+N`, a keyboard shortcut reminder, and a small no-behavior-change refactor to keep authoring work maintainable.
- [x] Add the admin `Practice` page skeleton and improve Lesson Builder scanning with partial/header-only collapse modes plus single-lesson and all-lesson keyboard shortcuts.
- [x] Turn `Practice` into the first lesson-running flow with focused step navigation, reusable sentence practice, keyboard controls, rendered explanation Markdown, and authorable keyboard-shortcut callouts.
- [x] Refine the Practice response loop with reliable backward navigation, centered explanations, immediate per-answer success styling, learner-controlled sentence advancement, and prominent neutral post-answer feedback.
- [x] Make multi-block sentence practice automatically fit available card width and wrap responsively instead of using a fixed two-column layout.
- [x] Streamline Lesson Builder authoring with one expanded content block at a time, compact clickable summaries, handle-only block reordering, duplication with fresh nested IDs, creation autofocus, keyboard-assisted explanation closing, and lesson-deletion confirmation.
- [x] Refine Sentence authoring with inline block insertion, responsive compact word cards, one open word editor at a time, click-to-toggle cards, handle-based word reordering, sentence-level concepts, and consistently ordered label, prompt, language blocks, helper, feedback, and concept fields.
- [x] Make Lesson Builder persistence and previews lesson-scoped with one open lesson editor, lesson-specific saves, autosaved ordering, persisted deletion, visible dirty state, Save/Discard/Cancel leave protection, reusable Practice previews for lessons and individual blocks, dismissible insertion pickers, and block-creation hotkeys.
- [x] Intentionally clear the prototype lessons and experimental curriculum graph while preserving their versioned JSON schemas, establishing a clean starting point for new handcrafted lessons and later curriculum-database population.
- [x] Keep Practice and author previews on the same lesson runner, autofocus the first learner answer, support live and rendered `==highlight==` syntax, and keep invalid Sentence blocks open and unavailable for preview until their issues are resolved.
- [x] Add `Alt+Up` and `Alt+Down` navigation between lesson content blocks, a first-position insertion control, issue-only status badges, and prominent bottom-aligned context hints in authoring and learner views.
- [x] Polish the learner lesson runner with clearer lesson hierarchy, compact content-aware cards, one consistent footer navigation system, platform-style keycaps, unobtrusive corner hints, readable teaching notes, and distinct input, hint, context, and feedback states.
- [x] Add compact Markdown authoring for sentence labels, prompts, helper text, and answer feedback; place label and prompt controls before language cards; group empty optional fields behind concise add controls; render formatting consistently for learners; and turn each completed answer's hint control into a locked success check.
- [x] Add a vocabulary-table presentation for sentence data, with vertical learner rows, three-column Spanish/answer/context layout, comma-separated author summaries, and a dedicated block-picker option without creating a separate curriculum data type.
- [x] Make practice answer matching case-sensitive, support nested Markdown highlighting without visually splitting highlighted word endings, and remove automatic label copy from new practice blocks.
- [x] Establish the working teaching-methodology rules revealed by the first handcrafted lessons: first-attempt answerability, one focus at a time, example-first discovery, information/application micro-steps, limited incidental-vocabulary hints, short-lesson momentum, confidence-building endings, and learner-friendly North American pronunciation bridges without learner-facing IPA.
- [x] Editorially refine the initial lesson sequence by separating cognate patterns and spelling exceptions, splitting the long third lesson at a natural confidence milestone, correcting misleading phrase composition such as `important for me`, adding missing prerequisite retrieval, shortening cumulative challenges, and explicitly teaching non-obvious pronunciation needed by Spanish-speaking learners.
- [x] Establish the Spanish-first JSON curriculum discovery store with atomic mappings, bilingual examples, reusable collections, and an editable three-role `core`, `supporting`, and `reference` classification.
- [x] Give Curriculum its own `/curriculum` section with an approved database page plus visible Review inbox and Migration progress route shells for the next workflow slices.
- [x] Complete and migrate the first `querer` completeness-audit batch through the Review inbox and preserve owner notes; consumed curriculum sources now live only in Git history rather than a repository archive.
- [x] Move approved curriculum concepts and review history from runtime JSON files to PostgreSQL with Prisma, Docker-based local development, transactional authoring workflows, immutable seed snapshots, and exact import verification while leaving Lesson Builder persistence unchanged.
- [x] Finish the Spanish-to-English mapping-source consumption sweep by migrating remaining source-table material into PostgreSQL review/curriculum history, exporting updated immutable seed snapshots, verifying parity, and deleting the consumed `docs/curriculum/mappings/spanish-to-english` source tree.
- [x] Repair the attempted English-to-Spanish reverse import by removing malformed sentence-shaped additions, retaining only safe exact-match collection revisions, and restoring the `docs/curriculum/mappings/english-to-spanish` source tree for proper future canonicalization.
- [x] Add a project-local Pi todo extension so long migration sessions can show visible progress and keep agent work organized.
- [x] Establish the mappings-migration operating contract and safeguards.
    - [x] Record canonical concept, placeholder, role, and collection/tag rules, including the deliberate surface-form exception for English `be`.
    - [x] Inventory every English-to-Spanish hub and require file-level disposition before source consumption.
    - [x] Add database-backed review-batch preflight for exact duplicates, normalized probable duplicates, revision targets, source paths, and suspicious sentence-shaped concepts.
- [x] Capture and retire the entire `docs/curriculum/mappings` tree: preserve all 2,225 files and 1,524,163 source bytes verbatim in PostgreSQL with SHA-256 hashes, extract 4,322 queryable Markdown table rows, export immutable seed parity, and delete the verified source folder.
- [x] Capture and retire the entire `docs/curriculum/cognates` tree: preserve all 265 files and 240,286 source bytes verbatim, extract 1,250 source rows, create 751 POS/group/status/tag/priority-aware cognate records, verify immutable parity, and delete the source folder.
- [ ] Normalize the PostgreSQL mappings archive into canonical Spanish-first concepts in broad database-driven passes.
    - [ ] Compare extracted rows with existing concepts and review candidates; link or revise exact matches and flag probable duplicates.
    - [ ] Default uncertain but useful mappings to `reference`; reserve `supporting` and especially `core` for later deliberate promotion.
    - [ ] Normalize infinitives, placeholders, adjective support verbs, examples, phrasal roots and particles, morphemes, and pronunciation families without reopening filesystem sources.
    - [ ] Keep raw source documents immutable while recording extraction and curation progress separately.
- [ ] Prove the mappings pillar curated: every extracted source row is linked, normalized, deliberately retained as evidence, or explicitly dismissed, with all database tests passing.
- [ ] Plan the same inventory-to-PostgreSQL process for the remaining curriculum pillars.

## Paused product work

Resume these items after the curriculum migration objective or when the owner explicitly changes priority.

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
- [x] Resolve the Spanish-first curriculum-scope hypothesis for migration: PostgreSQL concepts are canonical Spanish-to-English mappings; English-to-Spanish files are evidence that must be generalized into that direction.
- [ ] Decide the smallest block metadata needed for context-specific meanings and form families.
- [ ] Add one authoring workflow for creating and inspecting blocks.
- [ ] YAMLize or normalize only the curriculum objects required by the five-lesson slice.
- [ ] Run a Markdown-to-data dry run for those objects and verify stable IDs, accepted answers, and references.
- [ ] Build the smallest complete application flow: choose a lesson, answer Spanish-to-English text boxes, receive feedback, and save progress.
- [ ] Use authoring friction and learner evidence to decide which mapping hub or curriculum branch to normalize next.
- [ ] Continue bounded mapping work from PostgreSQL-backed curriculum data; the old Spanish-to-English Markdown source tree has been consumed and deleted.
- [ ] Revisit mapping curation, promotion, demotion, and collection cleanup after the completeness-first mappings migration is finished.

## Database modeling considerations

- [ ] Define how lesson context maps to canonical curriculum data before replacing the JSON authoring model.
    - [ ] Keep the learner-facing language-block context hint (currently stored as `callout`) separate from the structured context or sense that qualifies a canonical mapping.
    - [ ] Decide whether canonical mapping context is represented by a stable `contextId`, `senseId`, structured constraints, or a dedicated graph node rather than another editable label.
    - [ ] Link lesson and language-block occurrences to canonical mappings as evidence without restoring per-word concept controls to the authoring UI.
    - [ ] Define which context is authored, which is derived, and which system owns each value so `callout`, `ConceptLink.contextLabel`, and curriculum-edge `context` cannot become competing sources of truth.
- [ ] Derive each lesson's newly introduced concepts and words from stable concept references and the current lesson order.
    - [ ] Treat the earliest ordered occurrence of a concept as its first course exposure; do not rely on the author remembering to move or remove an `introduced` tag.
    - [ ] Recompute first-exposure status whenever lessons or concept-bearing blocks are added, removed, moved, or reordered. For example, moving the first **to speak** block from Lesson 2 to Lesson 1 must make Lesson 1 its introduction automatically.
    - [ ] Decide whether `introduced` remains an authored pedagogical role, becomes a computed status, or is split into separate authored-intent and derived-first-exposure fields. Avoid storing two editable sources of truth for the same fact.
    - [ ] Use the derived result to show the new concepts and words introduced by each lesson in Practice and authoring views.

## Future onboarding

- [ ] Design a low-friction learner onboarding flow for the account-enabled product.
    - [ ] Let a new student begin lessons immediately without first providing an email address.
    - [ ] Decide when to ask the student to create or connect an account after they have completed a small number of lessons, and preserve their pre-account progress when they do.
    - [ ] Build small personalization commitments into the tutorial lesson, such as choosing a preferred theme and answering “What should we call you?”
    - [ ] Research evidence-based onboarding and learning-product UI/UX practices before finalizing the flow, with retention as an explicit product outcome.
    - [ ] Define the minimum temporary learner state needed before account creation and the privacy, expiry, and account-linking behavior for that state.

## Future AI-assisted lesson authoring

- [ ] Let an author request an AI-generated lesson draft from the Lesson Builder.
    - [ ] Connect generation to the canonical curriculum database so the system can inspect what has already been taught and what remains available.
    - [ ] Use prior lessons and learner-sequence history to decide what should be reviewed, introduced, or taught next.
    - [ ] Provide the teaching methodology as explicit generation context so lesson structure and explanations follow the course’s pedagogical approach.
    - [ ] Preserve continuity across lessons instead of generating each lesson as an isolated artifact.
    - [ ] Keep generated lessons editable and require author review before they become saved course content.

## Future alpha feedback

- [ ] After user accounts exist, let approved alpha learners report mistakes and provide feedback from inside a lesson.
    - [ ] Add a lightweight feedback action tied to the exact lesson, content block, sentence, and learner-visible state where the issue was noticed.
    - [ ] Offer useful report categories such as incorrect translation, unclear explanation, missing accepted answer, typo, and interface problem, plus an optional comment.
    - [ ] Preserve enough authored-content version information to understand a report even if the lesson is edited afterward.
    - [ ] Provide an author-facing queue for reviewing, resolving, and deduplicating reports without allowing feedback to directly modify lesson content.
- [ ] Evaluate a comment or discussion board attached to each sentence after the simpler reporting workflow proves useful.
    - [ ] Define moderation, visibility, notification, privacy, deletion, abuse-reporting, and account-blocking behavior before enabling learner-to-learner discussion.
    - [ ] Decide whether discussion should be public to alpha learners, private between a learner and the course owner, or replaced by curated frequently asked questions.

## Later

- [ ] Continue evidence-based cutting, collation, and sequencing across the curriculum.
- [ ] Design spaced repetition from real exposure and error data.
- [ ] Add mastery gates, per-question feedback, and progress visualization after the basic learning loop works.
- [ ] Show students an estimated completion time for each lesson, such as “3 minutos.”
    - [ ] Derive the estimate from lesson structure and expected learner interaction time rather than requiring authors to maintain it manually.
    - [ ] Define initial timing weights for explanation reading, sentence answering, hints, and expected retries, then calibrate the formula against real completion data when learner analytics exist.
    - [ ] Decide where estimates should appear on lesson cards and inside the active lesson without adding unnecessary pressure for the learner.
- [ ] Make displayed keyboard shortcuts adapt to the learner's operating system.
    - [ ] Detect macOS, Windows, and other platforms without storing unnecessary device information.
    - [ ] Display familiar platform-specific modifier names and symbols, such as `⌥` or `⌘` on macOS and `Alt` or `Ctrl` on Windows and Linux.
    - [ ] Keep shortcut reminders, tooltips, keycaps, and actual keyboard handling driven by one shared shortcut definition so displayed instructions cannot drift from behavior.
- [ ] Evaluate authentication, payments, deployment, security testing, and broader product infrastructure only when the MVP requires them.
- [ ] Document the teaching methodology and repository setup for maintainers and portfolio review.

## Security practice record

This section records controls and security work actually applied during development. Planned work remains unchecked; implementation alone is not evidence that a control is effective.

- [x] Audit the dependency tree when introducing the Markdown editor and pin the vulnerable transitive `js-yaml` dependency to patched version `4.3.1` through the package override.
- [x] Keep theme preference storage client-only and non-sensitive by persisting only a theme identifier in `localStorage`.
- [x] Keep JSON lesson persistence scoped to a fixed repository data file and validate saved lesson payload shape at the API boundary while the final database model is still being discovered.
- [x] Serialize JSON lesson mutations and replace the lesson file atomically so lesson saves, ordering, and deletion cannot interleave partial writes.
- [x] Protect curriculum writes with PostgreSQL transactions, relational uniqueness and foreign-key constraints, an empty-database seed guard, and exact post-import parity verification.
- [x] Preserve the one-look source-consumption rule during the Spanish-to-English migration by deleting the consumed Markdown source tree only after PostgreSQL migration, seed-snapshot export, `db:verify`, and `db:test` passed.
- [x] Pin the patched `deepmerge-ts` release after the Prisma CLI introduced a vulnerable transitive version; `npm audit` reports no remaining known vulnerabilities after the override.
- [ ] Create an initial threat model when the application gains persistent lesson authoring, authentication, or other meaningful trust boundaries.
- [ ] Add authorization tests alongside the first protected authoring or learner-data endpoints.
- [ ] Perform a controlled OWASP-based security assessment after the first complete application flow is deployable, preserve findings, and document the resulting hardening.

## Deliberate non-goals for the current phase

- Perfecting or YAMLizing the entire curriculum before building lessons.
- Encoding course order, exposure counts, or learner mastery inside mapping YAML.
- Expanding beyond Spanish-speaking adults learning English.
- Making CEFR, IELTS, or security claims before the product has evidence to support them.
