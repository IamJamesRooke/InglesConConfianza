# Ingles Con Confianza: Project Timeline

This timeline tells the story of how Ingles Con Confianza developed from a teaching corpus into a working lesson-authoring application backed by a canonical PostgreSQL curriculum database. It records the important decisions, experiments, reversals, and completion milestones; Git preserves the finer-grained commit history.

## At a glance

| Period | Main outcome |
|---|---|
| July 27-28, 2026 | The owner's teaching material became a versioned curriculum corpus, beginning with foundations. |
| July 29-31 | Advanced contextual English and Spanish mappings were expanded, atomized, and merged into a unified hierarchy. |
| August 4-11 | The curriculum was reorganized around canonical bilingual mappings, transformations, cognates, vocabulary, and form families. |
| August 13 | The first database and interactive lesson prototypes tested how curriculum objects might support a real learner experience. |
| August 19-20 | Lesson Builder and Practice became usable product workflows, revealing the teaching-methodology and data requirements from real lessons. |
| August 21 | PostgreSQL became the canonical curriculum store, with review, role classification, editing, tests, and immutable snapshots. |
| August 23 | Every remaining curriculum source pillar was captured, normalized where practical, verified, and retired from the filesystem. |
| Next | Curate the database aggressively, then build and validate the first production course module. |

## July 27: Start with the teaching knowledge

The project began with the curriculum rather than with application infrastructure. The initial repository captured the owner's English-teaching knowledge under `docs/curriculum`, with the expectation that the material would eventually become structured data.

The first work established:

- a version-controlled home for the curriculum;
- verb and general cognate families;
- past and progressive cognate patterns; and
- foundational word-building transformations.

This established the project's central premise: the application should be built around a real teaching method, not around a generic language-learning schema invented in advance. The initial commit was `f1e554cb`; the curriculum corpus began in `d64a3b75`.

## July 28: Build the foundations body of knowledge

The foundations curriculum expanded quickly across the language a beginner needs to construct useful thoughts:

- high-utility verbs and their forms;
- past and past-participle material;
- verb-fluency drills;
- time, location, numbers, and calendar language;
- determiners and sentence-building words;
- adjectives, nouns, and common expressions; and
- cognate verb families.

The organizing idea was already larger than vocabulary memorization. Verbs were treated as the spine of language, while cognates and transformations gave Spanish-speaking learners fast, confidence-building access to English.

Commit `b3f4b539` marked the first foundations curriculum migration as complete. That completion was useful, but temporary: the corpus still needed better ownership, normalization, and a shape suitable for software.

## July 29-30: Expand contextual and advanced English

The next pass focused on words whose English meaning changes with context. Instead of storing one shallow translation, the curriculum mapped the situations that make small, common words difficult:

- `even`, `way`, `rather`, `as`, `ever`, `such`, `while`, and `well`;
- `to`, `too`, and `two`;
- quantity, comparison, choice, and connector language;
- large concept maps for `make`, `get`, `keep`, `use`, and related verbs;
- particles and directional words such as `on`, `off`, `in`, `out`, `up`, `down`, `over`, and `under`; and
- contextual uses of `be`, modal verbs, and Spanish reverse mappings.

Large lessons were atomized so each distinct meaning or construction could later become independently queryable. Word-building content was also consolidated into transformation families, while foundational verb forms and past-form sound families became more explicit.

This was the first major information-architecture lesson: organizing language by a familiar word is useful for human exploration, but software and lesson sequencing need smaller, stable teaching concepts.

## July 31: Unify the curriculum hierarchy

By the end of July, Spanish mappings, English mappings, structural material, vocabulary, and Spanish-English bridges had grown into overlapping branches. A broad consolidation pass merged them into one navigable curriculum hierarchy.

Important outcomes included:

- a checkpoint before destructive hierarchy changes (`389953a2`);
- unified structural and vocabulary branches;
- consolidated bilingual mappings;
- README indexes throughout the hierarchy; and
- a clearer distinction between curriculum content and temporary migration scaffolding.

Commit `9acb8f51` completed the unified hierarchy. The result made the corpus easier to inspect, but repeated reorganization showed that a filesystem hierarchy could not be the permanent multidimensional query model.

## August 4-7: Establish canonical ownership

The project shifted from broad collection toward canonicalization. English-to-Spanish and Spanish-to-English mappings were collated separately, then normalized around the source form that genuinely owned each concept.

This phase established several durable ideas:

- mappings should be atomic rather than bundled;
- a concept may need a phrase or construction, not only a word;
- adjective states, direct verbs, connectors, descriptions, questions, nouns, time, and location require different normalization behavior;
- transformations and past-form sound families are first-class teaching material; and
- unsorted or staging branches should be retired once their material has a canonical home.

A bilingual frequency audit then checked whether the remaining mapping hubs represented meaningful contextual choices rather than ordinary dictionary vocabulary.

## August 9-11: Discover the future database contract

Focused pilots turned the curriculum's implicit rules into an explicit data contract.

The `lo` and `to / too / two` work demonstrated atomic mapping ownership. The English `be` topology showed why some surface forms such as `am`, `is`, and `are` need to stay independently searchable even when the canonical target is normally `to be`. Reverse `ser`, `estar`, and `haber` work reinforced that the eventual database should remain Spanish-first.

The `tener` and `poder` audits tested increasingly structured representations:

- canonical lemmas;
- form families and surface forms;
- polarity and clause shape;
- one Spanish concept mapped to one English target;
- stable construction slots; and
- reusable metadata for later querying.

Commit `870cac50` established the atomic normalization contract. Subsequent passes curated source ownership, moved ordinary vocabulary out of mapping hubs, promoted cognates and past forms to curriculum pillars, flattened vocabulary references, and professionalized the documentation.

This period also exposed an important limit: perfecting the entire Markdown hierarchy before building lessons could consume unlimited time without proving what the product actually needed.

## August 13: Test the curriculum through a product

The first application experiments introduced a basic SQLite seed database and displayed curriculum blocks in Next.js. Phrase-level sentence exercises, accepted alternative answers, and an interactive demo lesson followed.

These prototypes were intentionally exploratory. Their purpose was to answer practical questions:

- What is the smallest curriculum object a lesson needs?
- When should an answer be a word, phrase, or complete construction?
- How should alternative natural English answers be represented?
- What does immediate learner feedback require from the authored data?

Commit `86757584` produced the interactive demo lesson. The prototype was useful precisely because it challenged assumptions made while looking only at curriculum files.

## August 19: Build Lesson Builder from real authoring needs

Lesson Builder became the center of product discovery. The authoring interface grew through direct use rather than through a speculative final schema.

The first complete authoring slice added:

- reorderable lessons and content blocks;
- Markdown explanation blocks;
- Spanish prompts with one or more accepted English answers;
- sentence-card editing, duplication, collapsing, and deletion;
- optional hints, helper text, context, and post-answer feedback;
- live validation for missing and duplicate answers;
- an interactive learner preview; and
- persistent theme settings.

The project briefly revisited SQLite and an experimental curriculum graph, then deliberately retired both as premature. Handcrafted lessons stayed in `web/data/lessons.json`, allowing the lesson shape to continue evolving without forcing Lesson Builder into the curriculum database.

This was a decisive product-development turn: derive the data model from real authoring and learning behavior, and keep exploratory persistence reversible.

## August 20: Complete the authoring and practice loop

Lesson Builder and Practice were refined into connected workflows.

The application gained:

- keyboard-first lesson and block navigation;
- compact collapsed summaries for long lessons;
- a shared learner runner for Practice and author previews;
- responsive sentence layouts;
- lesson-scoped saving, ordering, deletion, dirty-state protection, and discard behavior;
- creation autofocus and fast block insertion;
- Markdown formatting across prompts, hints, feedback, and explanations;
- context-aware help and locked success states; and
- a vocabulary-table presentation using the existing sentence data model.

More importantly, authoring real lesson sequences produced the working teaching methodology. The project documented first-attempt answerability, one teaching focus at a time, example-first discovery, immediate information-and-application micro-steps, short lessons, confidence-building endings, limited incidental-vocabulary hints, a non-punitive response to mistakes, and pronunciation bridges designed for Latin American Spanish speakers.

Commit `742e9bc3` recorded a major lesson-authoring and methodology refinement. The old curriculum graph and placeholder data were reset so the next database design would be grounded in these lessons rather than inherited prototypes.

## August 21: Make PostgreSQL canonical

The curriculum page was reset and rebuilt around an editable Spanish-first mapping catalog. Curriculum concepts received:

- one Spanish source and one English target;
- a generic bilingual example;
- reusable collections;
- bilingual search; and
- exactly one curriculum role: `core`, `supporting`, or `reference`.

The Review inbox and migration workflow were introduced so proposed concepts could be inspected, corrected, approved, deleted, and migrated transactionally. Early verb-family batches such as `querer`, `necesitar`, `comer`, `tomar`, and `beber` helped refine duplicate detection, placeholders, phrasal-particle tagging, examples, and role selection.

PostgreSQL then replaced the exploratory curriculum JSON runtime store. Prisma modeled the canonical database, immutable JSON snapshots provided reproducible bootstrap and parity checks, and database tests protected import exactness, normalized duplicate detection, source provenance, and constraints. The Lesson Builder remained deliberately JSON-backed.

Commit `21e4853a` completed the PostgreSQL curriculum handoff. Commit `83a76357` migrated the Spanish-to-English mapping material into PostgreSQL.

## August 23: Choose completeness before curation

The remaining migration was still taking too long because every source item was being curated before capture. The project adopted a clearer rule: preserve everything useful and queryable first, then curate inside PostgreSQL where bulk inspection, comparison, tagging, promotion, demotion, and deletion are easier.

The mappings source tree was captured losslessly as:

- 2,225 immutable source documents;
- 1,524,163 exact UTF-8 source bytes; and
- 4,322 extracted Markdown table rows.

After field-for-field verification and snapshot export, the source tree was retired. Eleven grouped mapping sweeps and several focused English hubs had already added normalized concepts and collection metadata.

The same completion-first method then retired every remaining pillar:

- Cognates: 265 source documents and 1,250 extracted rows; 751 catalog items were normalized before the temporary cognate table was folded into `curriculum_concepts`.
- Vocabulary: 17 documents and 972 rows; 592 normalized mappings, including 556 additions and 36 merges.
- Transformations: 178 documents and 594 rows; 267 transformation relationships and 45 recognition mappings.
- Verb forms: 51 documents and 268 rows; 199 normalized six-form, selector, usage, and relationship concepts.
- Remaining structure: 73 archived documents across live and historical material, 332 rows, and 209 normalized connector, comparison, article, quantity, conditional, tense, and placement concepts.
- Past and past participle: 134 documents and 1,077 rows; 478 atomic past and participle transformations across 190 verb bases.

The cognate catalog was unified with the one canonical concept table, noun articles and adjective support verbs were repaired, malformed bundles were atomized, and the Curriculum page gained server-side filtering and pagination at 50 concepts per page.

At the end of the migration, PostgreSQL held 4,487 canonical curriculum concepts, 2,943 archived source documents, and 8,815 extracted source rows. The database and immutable snapshots matched exactly, and all six former source pillars were gone from the working tree.

## August 23: Close the migration chapter

With source capture complete, the repository retired one-use capture scripts, stale audits, temporary todo tooling, and migration-oriented handoff instructions. The documentation was reduced to the active backlog, curriculum database contract, teaching methodology, and this project history.

The final architectural boundaries are now explicit:

- PostgreSQL is the canonical curriculum store.
- `curriculum_concepts` is the one teachable-content catalog.
- Collections provide flat, reusable query labels instead of parallel tag or pillar tables.
- Raw source documents remain immutable provenance, not a second curriculum.
- Lesson Builder remains JSON-backed until real module authoring proves a need to change it.
- New curriculum work consists of deliberate inserts, edits, merges, demotions, promotions, and deletions rather than filesystem imports.

Commits `3ae77c67` and `2332eb40` reset the handoff for curation and removed the retired source-era project directories.

## August 23: Reach the pre-curation milestone

A final repository audit removed the completed Migration Progress route, the abandoned curriculum-graph dashboard, unused demo and default public assets, empty prototype routes, and stale full-database loaders. Product metadata and documentation were rewritten around the real PostgreSQL architecture and Module 1 objective.

The Curriculum database changed from cumulative priority filtering to exact `core`, `supporting`, or `reference` filtering so each tier can be audited directly. Review inbox now queries only open batches and uses apply-oriented language while preserving the guarded candidate workflow and historical schema fields. The `shadcn` generator moved from runtime to development dependencies without changing its version.

This completed the transition from migration tooling to curation tooling. Lint, TypeScript, the production build, database regression tests, dependency audit, and immutable snapshot parity all passed before the milestone was recorded.

## September 2: Curate the tiers and retire the review inbox

A full promote/demote pass sorted every concept into a defensible role tier, the corrupted sentence-shaped records were normalized into the constructions they illustrated, and a `trash` role was adopted as a staging tier so deletion candidates can be parked, filtered, and bulk-removed without losing anything.

With direct manifest-driven curation working well, the `ReviewCandidate` pipeline was removed entirely: the `review_batches`, `review_candidates`, and `review_candidate_collections` tables and their enums, the `/curriculum/review` inbox and its API route, the import, preflight, approve, and migrate scripts, and the `curriculum-review.json` snapshot. Curation now edits `curriculum_concepts` directly from reviewed TSV manifests recorded under `docs/curation/`, and `trash` is the safety net that the review queue used to provide.

## The next chapter

The project now moves through two connected phases.

First, curate the database: remove garbage and low-value concepts, merge true duplicates, normalize records, consolidate collections, and make `core` and `supporting` genuinely selective.

Second, build Module 1: choose a concrete learner promise, select the smallest trustworthy concept set, sequence short first-attempt-answerable lessons, author them in Lesson Builder, and test the entire module through Practice.

The database does not need to be perfect before Module 1 begins. It needs to be structurally trustworthy enough that real lesson building can reveal the next valuable curation decisions.

## What the build demonstrates

The history of Ingles Con Confianza shows several kinds of product and engineering work operating together:

- domain modeling derived from an original teaching methodology;
- information architecture across thousands of bilingual concepts;
- willingness to retire prototypes and reverse incorrect assumptions;
- frontend authoring and learner workflows built from actual use;
- PostgreSQL and Prisma data modeling with transactional workflows;
- lossless migrations with hashes, immutable snapshots, parity verification, and regression tests;
- explicit separation between curriculum, lesson content, and future learner state; and
- MVP discipline: build enough structure to learn, then let evidence determine the next abstraction.

The individual Git commits remain the evidence behind each step; this timeline provides the coherent story they form together.
