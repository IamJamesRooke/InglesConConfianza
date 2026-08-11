# Backlog

> Current priorities and future work come first. Completed work is recorded below as a reverse-chronological timeline, with the exhaustive migration checklist preserved in the dated archive.

## Current focus

- [ ] Normalize `/curriculum/mappings` into an atomic, bidirectional, machine-readable source of truth
    - [x] Phase 1: define the canonical ownership, filename, YAML, reverse-link, validation, and phase-gate contract
    - [x] Phase 2: pilot the contract on Spanish **lo** and split the former **to / too / two** bundle by canonical ownership
    - [x] Phase 3: normalize English **be** forms and high-value expressions
    - [x] Phase 4: normalize the reverse **ser / estar / haber / tener / poder** hub
        - [x] Phase 4A: normalize **ser, estar**, and **haber**, including their source-form topologies and reciprocal **be** edges
        - [x] Mappings-only data-readiness checkpoint: pilot optional query metadata and define the boundary between mapping concepts and future app records
        - [x] Audit all 629 normalized mapping objects for complete canonical lemmas, taxonomy, grammatical features, aliases, accepted targets, and machine-safe target values
        - [x] Phase 4B: normalize **tener** and especially **poder**, then cross-audit **have, can, could, manage**, and remaining **be** expressions
        - [x] Phase 4C: compress **poder** into trackable lemma, form-family, surface-form, and atomic-mapping levels before normalizing more hubs
        - [x] Phase 4D: replace the compression pilot with the canonical human-readable mapping-concept template
        - [x] Phase 4E: retire the temporary **poder** teaching scaffold and make clause shape, polarity, questions, and neighboring lexical mappings database-ready
    - [x] Phase 5: rehome top-level multiword expressions under canonical headwords
        - [x] Phase 5A: audit and normalize English top-level source ownership
        - [x] Phase 5B: audit and normalize Spanish top-level source ownership
        - [x] Phase 5C Pass 1: curate weak Spanish top-level sources into lexical families, structure, transformations, vocabulary, or the correct mapping direction
    - [ ] Phase 6: normalize the remaining high-frequency bilingual hubs in bounded batches
        - [x] Phase 6A: normalize the English **do / make** and Spanish **hacer** bilingual hub
        - [ ] Phase 6B: normalize the English **get** hub and its qualifying Spanish reverse sources
    - [ ] Phase 7: complete the remaining mapping normalization
    - [ ] Phase 8: perform the final bidirectional completeness and reverse-coverage audit
    - [ ] Phase 9: perform a YAML-to-JSON dry run without replacing Markdown as the editable source
- [ ] Continue organizing and collating `/curriculum` into a clean canonical folder hierarchy before any other work
    - [ ] Review the complete curriculum tree and place every subject in the clearest conceptual home
    - [ ] Normalize folder names, category boundaries, and navigation so the hierarchy is easy to understand at a glance
    - [ ] Consolidate misplaced or overlapping branches while preserving distinct lessons and teaching logic
    - [ ] Keep reorganizing until the curriculum looks coherent, clean, and intentionally designed rather than merely migrated
    - [ ] Finish the canonical hierarchy before designing the database schema so the schema can follow the curriculum naturally
- [ ] Cut and collate the unified curriculum body of knowledge
    - [ ] Review adjacent and near-overlapping lessons without losing distinct teaching logic
    - [ ] Combine material that teaches the same concept and remove unnecessary repetition
    - [ ] Prioritize structural independence over breadth of vocabulary
    - [ ] Preserve Spanish-specific translation and interference distinctions that cannot be inferred from general structure
    - [ ] Prepare the curated body of knowledge for explicit prerequisite mapping and sequencing

## Roadmap

### Next

- [ ] Build the initial MVP from three representative curriculum lessons
    - [ ] Select three lessons from the organized and curated body of knowledge
    - [ ] Design the initial lesson data structure around those three lessons
    - [ ] Build the smallest complete learning flow using those lessons
    - [ ] Leave the rest of the curriculum body of knowledge untouched during the initial MVP
    - [ ] Write the application product brief

### Later

#### Curriculum curation

- [ ] Continue evidence-based curriculum curation after the MVP
    > Use evidence from the MVP to continue reducing material that is not necessary for the core course and defer appropriate content to optional supplementary modules later in the program.
    - [ ] Curate the cognates section
    - [ ] Reduce the pronouns section
    - [ ] Create a master curriculum inventory that consolidates the material from every curriculum Markdown file and classifies each item as critical, important, useful, low priority, or do not teach
    - [ ] Audit natural contractions and informal reductions such as **wanna**, **gonna**, and **gotta**

- [ ] Chunk and sequence the curated curriculum
    - [ ] Create no more than 100 phrases—or another arbitrary but reasonable number—that collectively teach all critical and important material
    - [ ] Incorporate spaced repetition into the sequence
    - [ ] Build the final sequence around minimal-difference sentences such as “She quit because it was too quiet and found it quite boring.”
    - [ ] Consider dividing the course into **Foundations I**, **Foundations II**, and later stages with clear qualitative differences

- [ ] Design for review and mastery
    - [ ] Assume that returning students may have forgotten everything
    - [ ] Require mastery of the current section before allowing advancement
    - [ ] Allow students to guess vocabulary, but not grammar

#### Curriculum data and documentation

- [ ] Convert the curriculum Markdown files into JSON objects
- [ ] Create the repository `README.md`
    - [ ] Explain the origin of the methodology
        - [ ] Describe direct instruction, **MT**, Siegfried Engelmann, and related influences
        - [ ] Explain how the methodology was developed from scratch
            - [ ] Word-frequency charts
            - [ ] Other language courses
            - [ ] The central question: How can English be taught with the minimum necessary material?

- [ ] Document the teaching methodology in `AGENTS.md`
    - [ ] Provide example lessons
    - [ ] Explain the education equation
    - [ ] Explain the principles of curation, chunking, sequencing, and presentation
    - [ ] Explain the risks of information overload
    - [ ] Explain spaced repetition
    - [ ] Explain mastery-based learning
    - [ ] Explain System 1 and System 2 from Kahneman and how examples build intuition
    - [ ] Explain the *flow* concept from Milhaly Csikszentmihalyi and how it applies to the course.

#### Product ideas

- [ ] Add per-question learner feedback
- [ ] Add a word-learning heatmap that becomes greener with additional repetitions
- [ ] Give progress indicators showing how far they are from A1, A2, B1, B2 levels (or IELTS) equivalent
    - make that a marketing point, telling them what level they expect to achieve
    - will need to analyze curriculum to determine exact points
- [ ] Have rotating voiceovers in different accents: Canadian, British, American, etc.
- [ ] when giving voiceovers, have two repetitions to improve listening and noticing contractions:
    - Spanish and English: "quiero - I want, hablar - to speak, quiero hablar - I wanna speak, contigo - with you - with ya -- I wanna speak with ya'
- [ ] Think about Creative Commons license, how to monitize but also allow others to fork the repo.
- [ ] Have a model where, I create some lessons, and don't make any more until I get 100 completing it, then I make more again. This ensures I don't make a huge curriculum and app only to see that nobody uses it.

#### Security

- [ ] Perform penetration testing using the [OWASP Web Security Testing Guide](https://github.com/OWASP/wstg/tree/master/document/4-Web_Application_Security_Testing)

#### Testing

- [ ] Create AI Test Users representing the typical student with mistakes they make.
    - memory-based as opposed to principles-based learners
    - assume IQ two standard deviations below normal
    - assume Tik-Tok addicted low attention span
    - assume need for instant results
    - assume little grit, and won't push through when things get difficult

#### Scope limitations

> Deciding what the app will NOT be for now, to avoid feature creep.
- Spanish-to-English only. No other languages. If others want to fork the repo, that's fine. And can give AGENT instructions explaining exactly how the method was made.

## Completed timeline

### 2026-08-11 — Spanish top-level mapping curation completed

- [x] Complete Phase 5C Pass 1 on Sol High without filtering teaching content
    - [x] Audit all 389 Spanish-to-English top-level buckets for genuine contextual mapping value, stronger lexical ownership, ordinary vocabulary, grammar, cognates, and incorrect direction
    - [x] Reduce the human-facing index from 389 to 350 exact top-level sources by retiring 39 weak or misplaced buckets
    - [x] Consolidate **poderoso, impotente**, and **todopoderoso** under `poder` while preserving all nine stable YAML mapping IDs and adding `poder` retrieval metadata
    - [x] Consolidate **llamado** under `llamar`, **muerto** under `morir`, **vivo** under `vivir`, **costo** under `costar`, **parecido** under `parecer`, and **pregunta** under `preguntar`
    - [x] Apply the close-form rule by placing **ante** under `antes`, **abajo/debajo** under `bajo`, **cuán** under `cuánto`, **tan** under `tanto`, and accented **sí** under `si`
    - [x] Route direct nouns and adjectives to supplemental vocabulary; route **dólar, especial, específico, exacto, posible**, and the **suceder/succeed** contrast to cognates
    - [x] Move frequency, clock-time, sequence, time-versus-tense, connector, and full-infinitive systems into structure while retaining the genuine **hora → hour/time** mapping
    - [x] Correct the reversed **walk, write**, and **read** families by preserving their particle and lexical contrasts under English-to-Spanish
    - [x] Audit all 160 teaching-table rows from deleted source files: preserve 97 verbatim and trace the remaining 63 through deliberate consolidation or direction-aware reformatting
    - [x] Validate all YAML parsing, the nine moved object contracts, 350 indexed sources against 350 physical source folders, touched local links, stale paths, empty directories, and Markdown whitespace

### 2026-08-11 — **Do / make ↔ hacer** hub normalized

- [x] Complete Phase 6A on Sol High as a bounded bilingual normalization phase
    - [x] Establish a loss baseline covering the three hub READMEs and 30 pre-existing non-index teaching lessons
    - [x] Preserve all 30 non-index lessons byte-for-byte and retain every original README line, including the existing reciprocal **make sense ↔ tener sentido** object
    - [x] Add 105 physical YAML files containing 137 new atomic mappings and eight compressed present/past form concepts
    - [x] Keep **hago, haces, hace, hacemos, hacen** and **hice, hiciste, hizo, hicimos, hicieron** independently trackable while rolling them up to shared task and creation concepts
    - [x] Separate high-value **do** and **make** collocations, Spanish weather and elapsed-time expressions, causatives, fixed **hacer** expressions, and English auxiliary **do** question/negative frames
    - [x] Create 43 new reciprocal translation pairs inside the bounded hub and mark genuinely external reverse work as pending rather than manufacturing symmetry
    - [x] Extend the controlled taxonomy with `causative-expression`, `weather-expression`, and `time-expression`
    - [x] Validate 1,249 globally unique atomic mappings, 1,013 linked objects, 230 pending objects, six not-applicable auxiliary objects, 59 concepts, consistent form references, and 135 hub links

### 2026-08-11 — Spanish mapping source ownership normalized

- [x] Complete Phase 5B on Sol High without deleting teaching material or broadly rewriting legacy lessons as YAML
    - [x] Audit all 394 top-level Spanish mapping buckets, normalized `source_lemma` metadata, multiword slugs, and likely inflected source families
    - [x] Move **a pesar de** under `pesar`, **así que** under `así`, **hace** under `hacer`, **cuántos/cuántas** under `cuánto`, and **juntos/juntas** under `junto`
    - [x] Retain lexicalized sources such as **pasado, muerto, llamado, dispuesto**, and **vivo** because their noun and adjective mappings are not merely conjugated aliases
    - [x] Preserve all seven relocated lesson files byte-for-byte and merge all five retired README indexes and teaching notes into their canonical destinations
    - [x] Replace the layered and incomplete Spanish root index with one exhaustive alphabetical index covering all 389 canonical source buckets exactly once
    - [x] Verify that no multiword slug remains at the Spanish top level, no retired path remains referenced, and no mapping directory is empty
    - [x] Revalidate all 1,112 globally unique YAML mapping objects, 927 linked objects, 185 pending objects, reciprocal IDs, examples, 407 affected local links, and clean Markdown whitespace

### 2026-08-11 — English mapping source ownership normalized

- [x] Complete Phase 5A on Sol High without deleting teaching material or broadly rewriting legacy lessons as YAML
    - [x] Audit all 313 top-level English mapping buckets and inspect normalized `source_lemma` metadata for hidden physical-ownership mismatches
    - [x] Move **end up** under `end`, **in front of** under `in`, **next to** under a new canonical `next` bucket, and **no longer** under `long`
    - [x] Apply the owner's earlier family decision by consolidating all five **aside** lessons under `side`
    - [x] Move the `authority → el poder` object out of `power`, preserve its stable ID and reciprocal edge, and add the missing atomic `authority → la autoridad` mapping
    - [x] Preserve all 13 relocated lesson files byte-for-byte and merge the five retired README indexes, explanations, and mastery tables into their canonical destinations
    - [x] Replace the layered and incomplete English root index with one exhaustive alphabetical index covering all 310 canonical source buckets exactly once
    - [x] Verify that no top-level English bucket remains hyphenated, every normalized English YAML object agrees with its physical source-lemma owner, and no retired path remains referenced
    - [x] Validate 1,112 globally unique YAML mapping objects, 927 linked objects, 185 pending objects, all reciprocal IDs, 376 affected links, zero empty mapping directories, and clean Markdown whitespace

### 2026-08-11 — Canonical **poder** hub finalized for future database export

- [x] Complete Phase 4E on Sol XHigh without filtering useful teaching content
    - [x] Audit all 42 non-index legacy lessons and 60 explicit teaching rows before retiring the temporary `poder/teaching-sets` scaffold
    - [x] Expand the hub from 41 to 51 human-readable mapping-concept files and from 118 to 140 independently trackable atomic **poder** mappings
    - [x] Add affirmative ability questions, negative ability questions, formal permission, repeated past permission, general **can be**, and uncertain or speculative **may/might/could have** mappings
    - [x] Add `clause_type`, `polarity`, and conditional `question_type` metadata so future database queries can distinguish statements, negatives, questions, ability, and requests without reading filenames or prose
    - [x] Add or normalize 22 direct English reverse objects under **can, could, may**, and **might**, including reciprocal question and negative-question edges
    - [x] Move neighboring lexical material into canonical **quizá, luz, poderoso, impotente, todopoderoso, dar, dejar, permitir**, and **lograr** hubs instead of hiding it under **poder**
    - [x] Preserve the longer contrasts and mastery examples in the canonical **poder** README while removing only the redundant teaching scaffold
    - [x] Correct the canonical target lemma for **authority**, repair transformation links, and replace the vague **may → poder** object with the trackable finite mapping **you may → puede**
    - [x] Validate 1,111 globally unique YAML mapping objects, 927 linked objects, 184 pending objects, complete reciprocal IDs, one-to-three examples, all 51 indexed **poder** concepts, touched links, and zero stale scaffold paths

### 2026-08-11 — Canonical **poder** mapping-concept template established

- [x] Complete corrective Phase 4D on Sol XHigh before using **poder** as the template for other conjugated mapping hubs
    - [x] Replace the ten oversized tense-family containers with 41 source-first, meaning-disambiguated concept files such as `poder (can - present ability).md`
    - [x] Keep grammatical family as queryable metadata rather than the physical file boundary, while retaining stable lemma, family, form, concept, and atomic-mapping references
    - [x] Preserve all 118 atomic mapping IDs, examples, grammatical features, teaching notes, statuses, and reciprocal reverse edges
    - [x] Remove explicit-subject aliases such as **yo puedo** and **ellos pueden**; preserve the 46 independently trackable subjectless forms through stable `form_id` and `form_surface` fields
    - [x] Rehome all 42 longer teaching and contrast files under `teaching-sets/`, remove sequence numbers from their filenames, and verify that every non-README file remains byte-identical
    - [x] Separate machine-facing concepts from teaching progression, update the **poder** index, and repair three transformation links affected by the teaching-set move
    - [x] Prove that **puedo** plus **puede** produces two lemma, present-family, and present-ability-concept exposures while retaining one exposure for each surface form
    - [x] Validate 1,045 atomic mappings, 41 mapping concepts, 46 **poder** forms, ten **poder** families, 877 linked objects, 168 pending objects, YAML-to-JSON round trips, 5,602 local links, and zero errors

### 2026-08-11 — **Poder** form-family compression piloted

- [x] Complete Phase 4C on Sol XHigh before extending the atomic contract to more conjugated hubs
    - [x] Replace 45 generated one-form directories with 10 form-family files and one compact index while retaining the complete teaching layer
    - [x] Define 46 independently trackable surface forms under nonfinite, present, imperfect, preterite, future, conditional, present-subjunctive, imperfect-subjunctive, perfect, and noun families
    - [x] Preserve all 118 atomic **poder** mapping IDs, metadata fields, examples, teaching notes, statuses, and reverse edges inside the compressed families
    - [x] Preserve all 42 preexisting non-README **poder** teaching and contrast files unchanged
    - [x] Extend the mapping contract with stable family and form IDs so future exercise occurrences can roll up to a lemma and tense/mood family without treating **puedo** and **puede** as unrelated concepts
    - [x] Prove the intended tracking result: one **puedo** question plus one **puede** question produces two **poder → present indicative** exposures and one exposure for each surface form
    - [x] Validate 1,045 atomic mapping objects, 10 mapping families, 46 trackable **poder** forms, 877 linked objects, 168 pending objects, JSON round trips, all reciprocal IDs, the complete loss audit, 5,581 local links, and zero errors or broken links

### 2026-08-11 — **Tener / poder** bilingual hub normalized

- [x] Complete Phase 4B on Sol XHigh without filtering the retained teaching layer
    - [x] Inventory 60 existing **tener / poder** source files, 607 lines, and 51 non-README teaching or contrast lessons before normalization
    - [x] Preserve all 51 original teaching and contrast files byte-for-byte while extending only the two root READMEs with atomic form indexes
    - [x] Add 99 Spanish **tener** objects covering possession, all modern non-**vosotros** simple forms, high-value perfect forms, age, physical states, obligation, desire, success, correctness, caution, and frequent fixed expressions
    - [x] Add 118 Spanish **poder** objects covering all modern non-**vosotros** simple forms, positive and negative present ability, permission, requests, possibility, opportunity, successful and failed past attempts, perfect forms, and noun **poder**
    - [x] Add 199 English reverse-hub objects under **have, can, could, manage, may, might, power, get**, remaining **be** forms, and directly relevant lexical heads
    - [x] Create 171 new reciprocal bilingual pairs, close 46 previously pending **be → tener / poder** edges, and retain 28 independently useful English-source objects as explicitly pending rather than manufacturing reverse folders
    - [x] Reuse the three existing canonical **haber** objects for **puede/podría haber** instead of creating duplicate IDs under **poder**
    - [x] Keep **have got to** canonically under **have**, index it from **get**, and keep informal **gotta** as its own register-marked mapping
    - [x] Extend the controlled taxonomy with possession, permission, possibility, opportunity, request, desire, success, and lexical-verb retrieval categories
    - [x] Validate 1,045 globally unique mapping objects, complete Phase 4B metadata, reciprocal reverse surfaces and grammatical features, all modern simple **tener / poder** forms, JSON round trips, README coverage, 5,768 local links, and zero empty directories or formatting errors

### 2026-08-10 — Normalized mapping metadata completed

- [x] Complete the enriched YAML audit for every mapping object already normalized
    - [x] Add canonical `target_lemma` and controlled `taxonomy` metadata to all 629 objects under **lo, be, ser, estar**, and **haber**
    - [x] Add source-side grammatical features to 626 applicable objects and target-side features to 620 applicable objects, while leaving only genuinely nonverbal expressions unforced
    - [x] Distinguish grammatical person from referent person for **usted**, formal **lo**, shared plural forms, and other cross-language mismatches
    - [x] Add meaningful source aliases to 307 objects and accepted target forms to 211 objects, including contractions and explicit subject forms
    - [x] Replace seven slash-style machine targets with one canonical target plus enumerated accepted forms without deleting any translation
    - [x] Add reciprocal identity-versus-characteristic contrast edges for **soy** and English **am**
    - [x] Preserve all 629 IDs, senses, examples, statuses, index ownership, and reverse edges; change only two Markdown headings to reflect the full retained subject coverage
    - [x] Keep **tener**, **poder**, non-YAML teaching sets, application tables, lessons, and learner state outside this audit

### 2026-08-09 — Mapping data-readiness metadata piloted

- [x] Refine the atomic mapping contract for future app queries without starting the database migration
    - [x] Keep mapping objects as stable curriculum concepts and explicitly exclude lesson position, taught state, exposure counts, errors, mastery, and spaced-repetition state
    - [x] Define backward-compatible optional fields for canonical target lemmas, accepted target forms, controlled taxonomy, source and target grammatical features, and concept contrasts
    - [x] Clarify that source-side variants use `aliases`, while target-side contractions such as **I'm** and **there's** use `accepted_targets`
    - [x] Apply the metadata pilot to 20 existing atomic objects across **lo, be, ser**, and **haber** without rewriting unnormalized teaching sets
    - [x] Demonstrate machine retrieval of personal-pronoun, direct-object, copular, state, ability, and existential concepts without relying on filenames
    - [x] Document the future exercise-block boundary as a non-canonical example only; create no tables, exercise bank, lesson engine, or learner-state files
    - [x] Preserve compatibility with all 629 existing atomic mapping objects and verify unique IDs, examples, reverse edges, controlled values, contrasts, local links, and Markdown formatting

### 2026-08-09 — Reverse **be** hub Phase 4A normalized

- [x] Normalize Spanish **ser, estar**, and **haber** on Sol XHigh without filtering source material
    - [x] Inventory the 16 original source files and 156 lines before migration
    - [x] Create 298 atomic Spanish-to-English mapping objects: 106 under **ser**, 114 under **estar**, and 78 under **haber**
    - [x] Organize present, past, future, conditional, subjunctive, participle, gerund, command, existential, obligation, and high-value expression forms under their canonical Spanish lemmas
    - [x] Add modern alternate imperfect-subjunctive families such as **fuese, estuviese**, and **hubiese** instead of silently omitting non-archaic variants
    - [x] Expand English **be** from 230 to 321 atomic objects by adding 91 real reverse-coverage mappings for subordinate forms, commands, subject-specific future and conditional forms, material and purpose expressions, and existential perfect forms
    - [x] Cross-link 218 English **be** objects and 225 reciprocal bilingual edges; leave auxiliary **have / has / had** and unrelated lexical heads pending for their own canonical hubs
    - [x] Preserve all 16 pre-normalization source files byte-for-byte under **teaching-sets**, while retaining their synthesis value separately from atomic YAML
    - [x] Apply the owner's completeness rule by duplicating uncertain but useful reverse paths now and deferring deconfliction
    - [x] Validate 629 globally unique mapping IDs, YAML fields, direction and language pairs, one-to-three examples, reciprocal reverse IDs, README coverage, source hashes, empty directories, stale paths, formatting, and 5,144 local curriculum links
    - [x] Keep **tener** and **poder** unchanged for the separately approved Phase 4B checkpoint

### 2026-08-09 — English **be** form topology normalized

- [x] Complete Phase 3 of the mapping normalization roadmap on Sol High
    - [x] Inventory all 55 source files, 622 lines, and 132 existing table teaching rows before migration
    - [x] Organize the canonical **be** hub into **base-form, am, is, are, was, were, been**, and **being** form buckets
    - [x] Create 230 atomic English-to-Spanish YAML mapping objects with stable IDs, readable filenames, one target meaning, and contextual examples
    - [x] Separate **ser / estar**, subject forms, completed versus background past, existential **haber**, modal forms, age and physical-state **tener** expressions, ability, and frequent fixed connections
    - [x] Add missing high-value branches such as **be supposed to, be allowed to, be expected to, be late, be careful, be in charge, be done, be over**, and modal or existential **be** forms
    - [x] Preserve all 54 moved teaching files byte-for-byte and retain the original whole-topic overview with only four relative-link corrections
    - [x] Keep passive, progressive, contraction, subjunctive, contrast, and retrieval explanations under **teaching-sets** rather than misclassifying broad rules as atomic mappings
    - [x] Apply the owner's rule to duplicate uncertain overlaps now and defer deconfliction until a later curation phase
    - [x] Leave the reverse **ser / estar / haber / tener / poder** hub unchanged for Phase 4
    - [x] Validate YAML syntax, required fields, direction and language pairs, 240 globally unique mapping IDs, README coverage, empty directories, stale paths, formatting, and 4,510 local curriculum links

### 2026-08-09 — Atomic **lo** pilot and **to / too / two** ownership split

- [x] Complete Phase 2 of the mapping normalization roadmap without losing existing teaching material
    - [x] Replace the mixed Spanish **lo** lessons with ten atomic source-to-target objects using the approved YAML contract and readable filenames
    - [x] Split **lo mejor** into separate **the best part** and **the best thing** objects while retaining the direct-object, abstract-adjective, degree, and relative-clause meanings
    - [x] Retire the combined **lo** lesson only after confirming its **him**, **it**, and formal **you** meanings are atomic and its **se lo** explanation remains in the canonical **se** map
    - [x] Split the former English **to / too / two** sound-family folder into canonical top-level **to** and **too** maps
    - [x] Route the direct **two** teaching set to supplemental number vocabulary because **two → dos** is not independently one-to-many
    - [x] Preserve all 28 moved **to**, **too**, and **two** lesson files byte-for-byte, retain the shared sound contrasts, and index the previously hidden positive-agreement lesson
    - [x] Validate YAML syntax, required fields, unique IDs, example counts, mapping direction, README coverage, and 4,251 local curriculum links

### 2026-08-09 — Atomic mapping normalization contract established

- [x] Complete Phase 1 of the mapping normalization roadmap without moving or rewriting lessons
    - [x] Record the baseline of 699 top-level source buckets, 3,222 mapping Markdown files, and 2,417 non-README lesson files
    - [x] Establish canonical ownership for source lemmas, inflected variants, multiword expressions, and intentionally shared retrieval paths
    - [x] Identify six top-level expression families for later rehoming while recording the then-approved `to-too-and-two` sound-family exception, later revised in Phase 2
    - [x] Define the atomic YAML contract, stable-ID rule, human-readable filename convention, reverse-coverage states, and review statuses
    - [x] Define loss-prevention and validation requirements for every migration phase
    - [x] Preserve the complete nine-phase roadmap and model guidance in `/curriculum/mappings/AGENTS.md` so future Codex sessions inherit it
    - [x] Select **lo**, **be**, and the reverse **poder** hub as the staged normalization pilots

### 2026-08-07 — Obsolete curriculum collation artifacts removed

- [x] Audit the curriculum tree for migration-only indexes, explicit duplicates, stale scaffolding, and empty directories
    - [x] Remove all 51 `README-former-*` files after confirming their linked lessons remain in canonical source folders
    - [x] Remove stale “preserved source index” links and migration commentary from the active mapping READMEs
    - [x] Remove the duplicate **él** personal-reference lesson while indexing the retained complete reference lesson
    - [x] Remove four byte-identical duplicate **-ward** lessons and their repeated index entries
    - [x] Preserve intentional duplicate teaching access across mapping directions and source buckets
    - [x] Verify canonical README coverage, local links, empty directories, stale artifact names, and Markdown formatting after cleanup

### 2026-08-07 — Bilingual mapping completeness audit

- [x] Re-audit the canonical mapping collection against high-frequency English and Spanish source words
    - [x] Review approximately 2,000 frequent entries in each language alongside the earlier inclusion-candidate audit
    - [x] Apply the asymmetric source-word rule: add a map only when one frequent source has multiple useful translations, without forcing a reverse map
    - [x] Add 123 English-to-Spanish source maps, emphasizing high-frequency verbs, modal verbs, function words, connectors, and context-sensitive description words
    - [x] Add 154 Spanish-to-English source maps, emphasizing polysemous verbs, function words, connectors, false-cognate risks, and context-sensitive description words
    - [x] Cover high-value additions such as **for**, **do**, **know**, **ask**, **need**, **become**, **meet**, **save**, and **lie**, plus **ser**, **estar**, **ir**, **conseguir**, **ganar**, **significar**, **andar**, **discutir**, **asistir**, and **pretender**
    - [x] Repair the missing **a/an** source README and index every newly added source in the appropriate directional master README
    - [x] Verify all top-level mapping folders have a README, all new index links resolve, all new lessons contain bilingual contextual examples, and no existing lessons were deleted

### 2026-08-06 — Adjective and state vocabulary routed to canonical homes

- [x] Retire `/curriculum/vocabulary/adjectives-and-states` after preserving its teaching points
- [x] Extend the canonical **bien**, **tener**, **mismo**, and **barato** maps with the missing examples and distinctions
- [x] Add Spanish-to-English adjective maps for **bueno**, **malo**, **fácil**, **duro**, **importante**, **necesario**, **viejo**, **joven**, **lento**, **despacio**, and **gratuito**
- [x] Keep cognate and adjective-to-adverb material under `/transformations` rather than duplicating it in vocabulary
- [x] Preserve basic color vocabulary in `/vocabulary/supplemental-adjectives.md`, with shade usage linked to the **claro** and **oscuro** maps

### 2026-08-06 — Retire the curriculum unsorted scaffold

- [x] Confirm `/curriculum/unsorted` contains no remaining curriculum lessons
- [x] Remove the obsolete root and `/core` README scaffolds
- [x] Remove stale unsorted references from the curriculum indexes
- [x] Remove the empty `remember/confusion-sets` mapping scaffold
- [x] Preserve prior unsorted paths in this backlog as historical migration records

### 2026-08-06 — Core nouns routed into canonical curriculum homes

- [x] Retire `/curriculum/unsorted/core/nouns` after routing its reusable noun material
    - [x] Expand the existing **kind**, **lugar**, and noun-quantity lessons
    - [x] Add Spanish-source maps for people, family relationships, general nouns, reservations, and money/business vocabulary
    - [x] Preserve the **hermano/hermana** and **hermandad** distinctions across brother, sister, sibling, brotherhood, and sisterhood
    - [x] Keep direct slot vocabulary such as **libro**, **inglés**, **español**, and **nacionalidad** under `/vocabulary`
    - [x] Verify the source branch is empty and all new mapping links resolve

### 2026-08-06 — Description, comparison, and question-word branches collated

- [x] Retire `/curriculum/unsorted/description-and-comparison` after routing its content to canonical homes
    - [x] Add English-first maps for **free**, **good**, **bad**, **far**, **fast**, **hard**, and **very**, while extending existing **too**, **so**, **really**, **enough**, **more**, and **most** maps
    - [x] Expand the Spanish **disponible** family with **available**, **free**, and **availability**, and preserve the related **libre** map
    - [x] Move productive adjective-to-adverb and regular comparative/superlative patterns into `/transformations`
    - [x] Move adjective position and comparative **than/the** rules into `/structure/description-and-comparison`
    - [x] Preserve irregular comparison families for **good**, **bad**, and **far** in their canonical English maps
- [x] Retire `/curriculum/unsorted/question-words` after routing its bilingual question-word families into mappings
    - [x] Add English-first maps for **how**, **what**, **which**, **why**, **because**, and **who**, and extend **when**
    - [x] Add Spanish-first maps for **cómo**, **cuál**, **cuánto**, **cuántos**, **quién**, **dónde**, **cuándo**, and **porque**
    - [x] Extend the existing **qué**, **qué tan**, and **por qué** maps and verify the source branches are empty

### 2026-08-06 — Clause connectors routed into canonical mappings

- [x] Retire the redundant future-time connector and preposition-stranding lessons from `/structure/clauses-and-connections`
    - [x] Verify **when**, **as soon as**, **once**, and **until** already have canonical English-to-Spanish maps
    - [x] Route preposition-stranding examples into the relevant **to**, **with**, **of**, **about**, **con**, and **de** maps in both directions
    - [x] Add the missing English-first **with** map and repair mapping and structure indexes
    - [x] Preserve the owner’s concurrent removal of the required-English-subject branch without restoring it

### 2026-08-06 — Direct verbs migrated into Spanish source mappings

- [x] Retire `/curriculum/unsorted/direct-verbs` after routing its verb lessons into canonical Spanish-source maps
    - [x] Split the mixed buying/selling and hearing/listening lessons into one source-word folder per Spanish verb
    - [x] Add reusable extensions such as **buy into**, **sell out**, **hear from/about**, **listen to/up**, **live in/with**, **pay for/back/up**, **read up on/through**, **walk into/away**, and **write down/up**
    - [x] Preserve every original direct-verb example and bilingual mapping row
    - [x] Update the unsorted-core navigation and verify zero stale references

### 2026-08-06 — Adjectives and states migrated into mappings and vocabulary

- [x] Retire `/curriculum/unsorted/core/adjectives-and-states` after routing its material to canonical homes
    - [x] Preserve the complete thematic adjective and state lessons under `/vocabulary/adjectives-and-states` for later curation
    - [x] Add focused Spanish-source maps for accuracy, specificity, color, difficulty, size, length, speed, price, sufficiency, possibility, difference, safety, readiness, availability, and activity states
    - [x] Expand the existing **bien**, **tener**, and **poder** maps with the **okay/fine/all right**, physical-state, and **ser capaz de** lessons
    - [x] Verify every original bilingual row remains present and remove the obsolete unsorted branch

### 2026-08-06 — Clauses and connections migrated into mappings

- [x] Retire `/curriculum/unsorted/clauses-and-connections` after routing its connector lessons into canonical source-word maps
    - [x] Add Spanish-source maps for **y/e**, **o/u**, **pero**, **con**, **si**, **sí**, **así que**, **entonces**, and **luego**
    - [x] Extend the existing **para**, **que**, **o**, and **luego** maps with purpose, connector, alternative, and sequence lessons
    - [x] Preserve the distinction between **si** → **if/whether**, **sí** → **yes**, and **si no** → **if not/otherwise**
    - [x] Verify every original bilingual row remains present and remove the obsolete unsorted branch

### 2026-08-06 — User-directed curriculum cleanup accepted

- [x] Accept the owner’s concurrent folder moves and deletions as intentional repository cleanup
    - [x] Keep the moved number and plural material under `/vocabulary`
    - [x] Accept removal of superseded past-and-participle migration archives after the canonical live collection was established
    - [x] Commit the resulting worktree state without restoring or discarding the owner’s changes

### 2026-08-06 — Reference and noun-phrase material routed to canonical homes

- [x] Retire `/curriculum/unsorted/reference-and-noun-phrases` after migrating its word-based lessons into canonical mappings
    - [x] Route articles, demonstratives, distribution words, alternatives, quantity words, indefinite compounds, and pronoun families into English-to-Spanish or Spanish-to-English source buckets
    - [x] Preserve the complete personal-pronoun reference sets under the existing Spanish pronoun maps
    - [x] Keep the genuinely non-word **countable/uncountable nouns** and **zero article** concepts under `/structure/reference-and-noun-phrases`
    - [x] Preserve the number material already moved to `/vocabulary/numbers` and repair its calendar cross-link
    - [x] Verify every original bilingual row remains under mappings or structure and remove the obsolete unsorted branch

### 2026-08-06 — Time and date vocabulary migrated into mappings

- [x] Retire `/curriculum/unsorted/time-space-and-relations` after routing its complete time curriculum into canonical mapping buckets
    - [x] Add English-to-Spanish **tomorrow** lessons for **tomorrow** and **the day after tomorrow**
    - [x] Add Spanish-source maps for clock time, duration, frequency, repeated periods, relative days, parts of the day, sequence, and order words
    - [x] Extend the existing **ya** map with the **just/already/yet/still** contrast
    - [x] Preserve every original bilingual mapping row and remove the obsolete unsorted navigation files
    - [x] Verify zero stale references and zero unmigrated source files

### 2026-08-06 — Curriculum holding branches separated from canonical structure

- [x] Record the owner's concurrent folder pass as a distinct migration layer without folding it into the mappings commit
    - [x] Move unresolved clause, question-word, description, comparison, reference, noun-phrase, time, space, relation, and core-vocabulary branches into the single curriculum-level `/unsorted` holding area
    - [x] Preserve the former vocabulary README with an explicit source label so its origin remains visible during later collation
    - [x] Lift `/fluency-drills` and `/verb-forms` out of the extra `/structure/verb-system` nesting and make them direct structure roots
    - [x] Place perception-verb lessons under the base-form and **-ing** form branches while preserving a root contrast index
    - [x] Keep focused preposition-stranding, required-subject, phrasal-verb, and intensifier constructions in their existing structure homes
    - [x] Audit apparent deletions and restore the unmatched **explain**, **study**, and **white-compound** lessons to `/unsorted` rather than lose course material
    - [x] Retire only the superseded verb-system navigation READMEs after preserving their useful form and perception contrasts
    - [x] Repair cross-links affected by the changed folder depth and verify zero broken local links across all 3,442 curriculum Markdown files
    - [x] Leave final classification and collation of every `/unsorted` branch for subsequent normalization passes

### 2026-08-06 — Unsorted mappings resolved by source direction

- [x] Retire the active `/curriculum/unsorted/mappings` holding area after routing its lessons by their true source word or construction
    - [x] Establish Spanish-to-English maps for **mucho**, **a pesar de**, and **aunque**, including the inflected **mucho/mucha/muchos/muchas** family and context-dependent English outputs
    - [x] Keep **a lot of** under Spanish **mucho** rather than forcing a low-value symmetric English map
    - [x] Move future-time connectors, required English subjects, intensifier systems, phrasal-verb placement and separability, preposition stranding, quantity contrasts, and demonstrative use into `/structure`
    - [x] Preserve the mixed **intentar / tratar de / probar** contrast as a focused confusion lesson while keeping each source's canonical map separate
    - [x] Merge the unique deciding, choosing, trying, caring, bothering, thinking, and believing patterns and mastery phrases from the source-pair archives into their canonical maps
    - [x] Remove 68 redundant archive files only after verifying that all 67 unique archived teaching rows remain present exactly
    - [x] Update all inbound references, remove stale `/unsorted/mappings` links, and verify zero broken links across the 76 affected lessons

### 2026-08-06 — Past transformations flattened into atomic teaching sets

- [x] Reorganize `/transformations/past-and-past-participle` around the relationship between the base, past, and past participle
    - [x] Establish five learner-facing roots: matching past and participle, past from base, participle from base, participle from past, and integrated unique patterns
    - [x] Divide matching forms into regular **/d/**, **/t/**, and **/ɪd/** pronunciations plus irregular **-d**, **-t**, vowel-shift, no-change, and memorized sets
    - [x] Give each Markdown lesson one compact teaching set without filename numbering or competing classification layers
    - [x] Name every teaching-set file after one canonical anchor transformation, such as `drink-drank-drunk.md`, while keeping the complete family inside the lesson
    - [x] Re-audit the complete collection by sound, uniting split families such as **slide → slid / hide → hid**, **begin → began → begun / sing → sang → sung**, and **show/mow/sew/sow → -owed → -own**
    - [x] Replace the broad uncommon, regional, meaning-dependent, and **-ed/-t** catch-all tables with anchored sound or usage sets
    - [x] Consolidate complete comparison families such as **bite/smite/write**, **beat/eat**, and **draw/saw** when the rhyming forms make the contrast easier to retain
    - [x] Teach independent transformations independently, including **go → went** under past-from-base and **go → gone / do → done** under participle-from-base
    - [x] Keep inseparable three-way patterns such as **begin → began → begun** together under unique patterns
    - [x] Rebuild `all-verbs-index.md` so every verb links separately to its past lesson and participle lesson
    - [x] Preserve all 190 indexed current verb entries and every indexed form exactly, while archiving both the complete 107-file structural input and the complete 158-file pre-sound-audit tree
    - [x] Reduce the live collection to 134 sound-grouped Markdown files, remove every obsolete lesson file and empty directory, and verify complete reachability, one H1 per file, zero broken links, and zero stale legacy-path references

### 2026-08-06 — Past and participle teaching families canonicalized

- [x] Tighten `/transformations/past-and-past-participle` from overlapping source views into one universal collection
    - [x] Replace six competing live branches with three exhaustive categories: regular forms, matching irregular forms, and different past/participle forms
    - [x] Flatten regular **-ed** lessons under `/pronounced-d`, `/pronounced-t`, and `/pronounced-id`, merging past-only and participle-only practice into complete form lessons
    - [x] Organize matching forms under `/no-change`, `/vowel-shifts`, `/final-consonant-shifts`, and `/standard-alternatives`
    - [x] Establish `/different-past-and-participle` with `/add-n-to-past`, `/add-n-to-base`, `/change-vowel-and-add-en`, `/i-a-u`, `/ew-to-own-or-awn`, `/returns-to-base`, `/one-offs`, and `/standard-alternatives`
    - [x] Distribute the former special-case tables according to their real transformations, including **steal → stole → stolen**, **behold → beheld → beheld**, and **tread → trod → trodden/trod**
    - [x] Move **there was/were**, **ser/estar with was/were**, **could vs was able to**, **was/were going to**, and **was/were hungry** to their mapping or verb-system teaching homes
    - [x] Retire the live `/reference` branch, replace it with the root `all-verbs-index.md`, and archive migration-only audits and source overviews outside the teaching tree
    - [x] Preserve all 190 indexed non-archaic head verbs and every indexed form unchanged; preserve 125 consolidated source bodies exactly after navigation normalization and adapt the remaining ten mixed or structural lessons without dropping their teaching content
    - [x] Reduce the live collection from 186 to 107 Markdown files, with every file reachable from the root and zero broken scoped links

### 2026-08-06 — Past and past-participle source of truth established

- [x] Merge the three overlapping past-form inventories into `/transformations/past-and-past-participle`
    - [x] Organize regular verbs by spoken **-ed** ending: `/d/`, `/t/`, and `/ɪd/`, without creating a spelling-teaching branch
    - [x] Organize irregular forms into matching past-and-participle forms, unique pasts, unique participles, and special variants
    - [x] Preserve past-focused, participle-focused, complete-family, and core teaching sets as labeled source views for later lesson-level collation
    - [x] Add the requested teaching sets **want–wanted / start–started / wait–waited**, **be–been / see–seen**, and **do–done / go–gone**
    - [x] Correct the prior coverage gap for **begin → began → begun** and add a safety-net lesson for current lower-frequency and regional forms
    - [x] Retire the two `needs merging` folders and update all curriculum references to the canonical source
    - [x] Preserve all 158 source Markdown files: 146 survive byte-for-byte, while the remaining 12 are navigation or index files rebuilt without omitting a lesson body
    - [x] Verify all 186 canonical Markdown files are reachable with zero broken scoped links, zero stale source-folder references, and an explicit modern-coverage audit

### 2026-08-06 — Core verbs migrated into canonical mappings

- [x] Retire `/curriculum/vocabulary/core/verbs` after routing all 52 teaching lessons by source word
    - [x] Move 40 single-source lessons intact and split 12 mixed topical lessons into atomic mapping destinations
    - [x] Establish 19 English-to-Spanish maps for **can, close, drink, drive, feel, finish, forget, give, have, help, introduce, open, remember, send, show, spend, start, stay**, and **think**
    - [x] Establish 8 Spanish-to-English maps for **buscar, comer, costar, entender, hablar, mirar, regresar**, and **ver**
    - [x] Merge core examples into existing maps such as **be, get, call, come, go, leave, make, run, take, work, decir, hacer, llegar, pedir, poder, saber, tener**, and **volver**
    - [x] Make useful overlap explicit, including **have got to** under English **have**, English **get**, and Spanish **tener**
    - [x] Preserve nine direct verb lessons and the non-word **handle verbs** course term in the single root `/curriculum/unsorted` area instead of forcing them into canonical maps
    - [x] Expand missed high-frequency branches such as **open up/opening**, money/time uses of **spend**, and the contextual uses of **stay, help, feel, start**, and **finish**
    - [x] Verify all 211 original bilingual example and table lines remain exact, with zero stale source references, zero broken curriculum links, and zero affected index gaps

### 2026-08-06 — Transformation curriculum established

- [x] Establish `/curriculum/transformations` as the productive vocabulary pillar immediately after mappings
    - [x] Move the existing cognate curriculum intact under `/transformations/cognates`
    - [x] Move **actual/actually/currently** and **eventually/eventualmente/finally** false-cognate families from unsorted into cognate confusion sets
    - [x] Distribute the former word-building curriculum into canonical `/suffix-transformations` folders such as **-ness, -ish, -en, -er, -th**, and **-ward**
    - [x] Build `/prefix-transformations` for **al-, be-, fore-, un-, re-, dis-, mis-, over-**, and **under-**, distinguishing productive prefixes from recognition-only beginning families
    - [x] Deduplicate the former 129-file mixed word-building archive after its preservation audit, retaining the unique **white** compound lessons in the single curriculum-level `/unsorted` bucket
    - [x] Keep **past-and-past-participle**, **past-II**, and **past-participle-II** intact for their dedicated next collation pass
    - [x] Keep passive and causative uses of past participles under structure while linking their form inventories from transformations
    - [x] Update the curriculum, vocabulary, structure, mapping, cognate, prefix, and suffix indexes for the new pillar
    - [x] Verify zero broken curriculum links, zero transformation index gaps, and preservation of every original lesson; four files changed only to repair relocated links

### 2026-08-05 — Spanish-to-English canonical collation

- [x] Collate `/curriculum/mappings/spanish-to-english` around one Spanish source per top-level folder while preserving complete reference access
    - [x] Split **decidir/elegir**, **importar/molestar**, **intentar/probar**, **pensar/creer**, **subir/bajar**, **tan/tanto**, and **todavía/aun** into canonical source folders
    - [x] Place **dejar de** and **dejar que** under **dejar**, **hacer que** under **hacer**, **hay que** under **haber**, **enterarse de** under **enterar**, and **volver a** under **volver**
    - [x] Rename **tener expressions** to the canonical **tener** map and organize **sino / si no** as a spelling-contrast family
    - [x] Keep **lo, la, los, las, le**, and **les** top-level and add complete top-level reference maps for **el, él, ella, ellas, ello, ellos, yo, tú, usted, ustedes, nosotros**, and **nosotras**
    - [x] Add pronoun micro-lessons for subject and common **para, con, a/por**, and **de** forms
    - [x] Keep **lugar/plaza** comparison material solely under **lugar** and move non-word **required English subject** grammar material to `/curriculum/unsorted`
    - [x] Rebuild incomplete indexes for **llevar, quedar, seguir**, pronoun maps, and previously unindexed local lessons
    - [x] Preserve the original mixed-source folders under `/curriculum/unsorted` for the later cutting and deduplication pass
    - [x] Verify all 742 unique baseline lesson bodies remain present, all 123 top-level folders are indexed, every canonical directory has a README, and there are zero unindexed local lessons or broken scoped links

### 2026-08-05 — English-to-Spanish canonical collation

- [x] Collate `/curriculum/mappings/english-to-spanish` around one qualifying English source per top-level folder
    - [x] Document the asymmetric rule: a source must be frequent and have multiple useful translations; reverse folders are not created merely for symmetry
    - [x] Split the bundled **all/every/each**, **but/yet**, **by/through**, **ever/never/however**, **just/only**, **leave/left**, **less/least**, **no/none/any**, **over/under**, **up/down**, and **way/away** families
    - [x] Consolidate **deal**, **due**, **one**, **some**, **tend**, and **side** under concise source-word folders
    - [x] Place **in case** under **in**, **up to** under **up**, and **down on** under **down**
    - [x] Keep the complete **-side** family under **side** while mirroring **inside/outside** under **in** and **out**
    - [x] Nest **myself** under **me** and **ourselves** under **us**, matching the existing **you/yourself/yourselves** pattern
    - [x] Move **actual/actually/currently**, **eventually/finally/the end**, **despite/in spite of**, intensifier material, and unresolved category lessons to `/curriculum/unsorted`
    - [x] Move **sensible/sensitive** to the cognate confusion sets
    - [x] Distribute future-time connector lessons to **when**, **as**, **once**, and **until**
    - [x] Verify all 1,342 baseline lessons remain accounted for; 1,338 are byte-identical and four changed only through repaired links
    - [x] Verify zero broken scoped links and complete README coverage after the collation

### 2026-08-05 — Asymmetric source-word mapping pass

- [x] Correct the mapping rule so canonical folders are created for high-frequency source words with multiple useful translations, not as forced English/Spanish mirrors
    - [x] Consolidate **hardly**, **barely**, and **scarcely** under the single Spanish source map **apenas**
    - [x] Split **more** and **most** into separate English source buckets
    - [x] Add the Spanish **más** map for **more**, **the most**, **more than**, and **lo más**
    - [x] Preserve all original contrast and usage lessons, including the **hardly** inversion and **more/most** family material
    - [x] Place the separate **a lot of** lesson in `/curriculum/unsorted` pending a canonical source-word decision
    - [x] Verify the targeted mapping and unsorted links after the move

### 2026-08-05 — Canonical mapping normalization

- [x] Reorganize `/curriculum/mappings` into source-word buckets without deleting lessons
    - [x] Remove the `translations-` folder prefix and rebuild both directional indexes
    - [x] Split mixed source families such as **either/neither/whether**, **in/out**, and **on/off**
    - [x] Nest related forms such as **into** under **in**, **onto** under **on**, and reflexive pronouns under **you**
    - [x] Consolidate same-word Spanish families such as **quedar**, **llevar**, **seguir**, and **mientras**
    - [x] Add the English **will** mapping for future statements, requests, decisions, and willingness
    - [x] Move clearly non-word grammar buckets into `/curriculum/unsorted` for a later organization pass
    - [x] Verify mapping links, indexes, and preservation after the reorganization

### 2026-07-31 — Migration completed and curriculum unified

- [x] Consolidate vocabulary and bilingual maps under `/curriculum/vocabulary`
    - [x] Organize vocabulary into `core`, `cognates`, `word-building`, `spanish-to-english`, and `english-to-spanish`
    - [x] Route standalone interference lessons into English-to-Spanish confusion sets instead of preserving a separate interference branch
    - [x] Shorten directional category names while preserving every atomic lesson
    - [x] Rebuild navigation and verify the reorganized body of knowledge before curation
- [x] Merge `/curriculum/foundations` and `/curriculum/advanced` into one definitive body of knowledge
    - [x] Organize the initial canonical hierarchy around structure, vocabulary, and Spanish–English bridges before the bridge material was consolidated under vocabulary
    - [x] Preserve every unique migrated curriculum file and canonicalize 59 byte-identical cognate copies
    - [x] Move structural, lexical, and bilingual material in separate reviewable Git checkpoints
    - [x] Rebuild curriculum navigation so every atomic lesson is reachable from the master index
    - [x] Verify zero broken links, duplicate-content groups, old hierarchy references, empty directories, or unindexed curriculum directories
- [x] Complete the textbook-to-`/curriculum` migration
    - [x] Migrate Foundations and Advanced source material into atomic Markdown lessons
    - [x] Complete the bilingual high-frequency inclusion audit and add all owner-approved candidates
    - [x] Perform the final completeness review and explicitly consolidate conditional structures
    - [x] Establish the pre-merge checkpoint before unifying `/foundations` and `/advanced`
    - [x] Finish and organize the approved English contextual maps, Spanish polysemous verbs, function words, constructions, and confusion sets

### 2026-07-30 — Advanced expansion and structural consolidation

- [x] Expand the Advanced bilingual and contextual-use curriculum
    - [x] Add the **over/under, leave/left, right, straight, at, back, about, around, of, from, by/through, into/onto, up-to/down-on**, and **be** maps
    - [x] Add the related Spanish maps for **de, conocer, saber, esperar, recordar, deber, importar, molestar, pedir, pensar, creer**, and **poder**
    - [x] Reorganize word-building families and add the advanced past-and-participle inventories
    - [x] Begin the bilingual high-frequency completeness audit

- [x] Consolidate advanced structural material into the Foundations curriculum
    - [x] Expand `/foundations/verbs/verb-forms` around the six-form framework
    - [x] Add full-infinitive, bare-infinitive, **-ing**, passive, and causative patterns as atomic lessons
    - [x] Merge the remaining adjective vocabulary into `/foundations/adjectives`
    - [x] Add dedicated comparison transformations for **easy, hard, difficult**, and **good**
- [x] Expand foundational number, calendar, and indefinite-expression coverage
    - [x] Add teens, tens, large numbers, ordinals, fractions, decimals, and phone-number patterns
    - [x] Consolidate weekday, month, year, and complete-date instruction under `/foundations/time`
    - [x] Add **some/any/no/every** place and time families with spelling and negative-pattern contrasts
- [x] Add the `/advanced/transformations/true - truth` family
    - [x] Group **truth, length, strength, width, depth, warmth, growth, youth, birth**, and **death**
    - [x] Cross-link the longer **lengthen** and **strengthen** transformation chains
    - [x] Distinguish noun-family **-th** from ordinal **-th**

### 2026-07-29 — Advanced contextual maps

- [x] Build the main Advanced English contextual-use system
    - [x] Expand and atomize **to/too/two, as, ever/never, such, while, well, no/none/any, all/every, some, wise, else, though, less/least, more/most, since, either/neither/whether**, and **just/only**
    - [x] Add complete maps for **make, use, long, mean, keep**, and **get**
    - [x] Organize contextual uses into navigable translation-map folders
    - [x] Add the **on/off, in/out**, and **up/down** concept maps

### 2026-07-28 — Foundations migration

- [x] Migrate the complete Foundation course from Excalidraw into atomic Markdown curriculum files
    - [x] `/foundations/pronouns` and the general curriculum template
    - [x] `/foundations/cognates`
        - [x] Migrate and normalize verb cognates
        - [x] Migrate and normalize the remaining cognates
        - [x] Migrate regular **-ed** and **-ing** form bridges
    - [x] Foundations word-building source material, now organized under `/advanced/transformations`
        - [x] Migrate the Excalidraw suffix families
        - [x] Add other high-yield prefix and suffix families
    - [x] `/foundations/verbs/core-verbs`
        - [x] Migrate all Excalidraw core-verb groups
        - [x] Normalize the folder structure and atomic lesson boundaries
        - [x] Audit the foundational verb scope, teaching contrasts, and examples
    - [x] `/foundations/verbs/verb-forms/past`
        - [x] Migrate regular-past formation and pronunciation groups
        - [x] Migrate foundational irregular-past sound and vowel-shift families
        - [x] Add **was/were** constructions
        - [x] Audit past-form coverage against core verbs and cognate tiers
    - [x] `/foundations/verbs/verb-forms/past-participle`
        - [x] Migrate regular-participle formation and pronunciation groups
        - [x] Migrate foundational irregular-participle phonetic families
        - [x] Distinguish participle constructions from overlapping simple-past forms
        - [x] Audit participle coverage against the closed core-verb curriculum
    - [x] `/foundations/verbs/verb-fluency-drills`
        - [x] Migrate the **do, does, did** transformation drills
        - [x] Migrate **be**, modal, and perfect-auxiliary drills
        - [x] Add progressive, perfect, and perfect-progressive comparison tables
        - [x] Audit high-confusion structures involving **have**, **have to**, and **there + be**
    - [x] `/foundations/time`
        - [x] Migrate clock time, relative days, and parts of the day
        - [x] Migrate sequence, duration, and frequency expressions
        - [x] Add essential calendar vocabulary for conversational scheduling
        - [x] Audit the minimal time vocabulary and key Spanish–English contrasts
    - [x] `/foundations/location`
        - [x] Migrate the location-word and **at / in / on** groups
        - [x] Add essential distance, relative-position, and direction contrasts
        - [x] Keep place nouns limited to reusable conversational examples
        - [x] Audit location vocabulary and Spanish **en** contrasts
    - [x] `/foundations/determiners`
        - [x] Migrate articles, demonstratives, quantity words, alternatives, and numbers
        - [x] Add possessive, distributive, and missing quantity determiners
        - [x] Distinguish determiners from related indefinite pronouns
        - [x] Audit countable and uncountable noun compatibility
    - [x] `/foundations/sentence-building-words`
        - [x] Migrate connectors and Spanish **a, de, para** translation bridges
        - [x] Migrate core question words and the **how** family
        - [x] Add a focused foundation section for translations of **que**
        - [x] Audit omitted connectors and context-dependent translations
    - [x] `/foundations/adjectives`
        - [x] Migrate foundational description and state vocabulary
        - [x] Add adjective position and adjective/adverb contrasts
        - [x] Add comparative, superlative, and intensifier patterns
        - [x] Audit comparison spelling rules and irregular forms
    - [x] `/foundations/nouns`
        - [x] Migrate the minimal essential and cognate-like noun groups
        - [x] Migrate foundational people and family nouns
        - [x] Add essential plural and noun-meaning contrasts
        - [x] Keep the explicit noun vocabulary intentionally limited
    - [x] `/foundations/expressions`
        - [x] Migrate the minimal polite-expression group
        - [x] Preserve nonliteral Colombian Spanish bridges
        - [x] Add essential responses to gratitude
    - [x] `/foundations/verbs/verb-forms/bare-infinitive`
        - [x] Migrate commands, **let's**, and foundational modal patterns
        - [x] Add the overlapping **do, does, did** bare-infinitive pattern
        - [x] Keep the bare-infinitive inventory closed to foundation structures
    - [x] `/foundations/verbs/verb-forms/gerund-present-participle`
        - [x] Migrate progressive, activity-noun, and selected verb patterns
        - [x] Reuse the word-building **-ing** noun bridge in its verb-form context
        - [x] Add the foundational **PING** preposition rule
        - [x] Keep deeper gerund-versus-infinitive contrasts in advanced
    - [x] `/foundations/verbs/verb-forms/full-infinitive`
        - [x] Add handle-verb and another-person full-infinitive patterns
        - [x] Add purpose translations for Spanish **para**
        - [x] Add adjective connectors such as **important to do**
        - [x] Document the six-form verb framework
    - [x] `/foundations/verbs/verb-forms/third-person-present`
        - [x] Add Spanish present **-a** and **-e** memory bridges
        - [x] Cover the closed core-verb inventory
        - [x] Add **has, goes, does**, and pronounced **says** exceptions
        - [x] Add source-relevant **-es**, **-ies**, and modal patterns
    - [x] `/foundations/verbs/cognate-verbs`
        - [x] Copy verb-focused cognate lessons into the verb curriculum
        - [x] Preserve direct, spelling, form, word-family, memory, and confusion groups
        - [x] Create a master high-frequency selected-verb inventory
- [x] Begin the Advanced course migration
    - [x] Establish the contextual translation-map format with **even**
    - [x] Add the first **way/away** and **rather** concept maps

### 2026-07-27 — Project setup

- [x] Created repository and curriculum `AGENTS.md` guidance
- [x] Added the Excalidraw file containing the teaching points for the Foundations and Advanced curricula, along with the 2023 instruction manual, to `/private/` as source material for the application

## Detailed migration archive

### 2026-07-28 → 2026-07-31 — Advanced course migration

- [x] Migrate the complete Advanced course from Excalidraw into atomic Markdown curriculum files
    - [x] Preserve the advanced course's teaching logic and detailed contrasts
    - [x] Complete the migration faithfully even if the resulting Advanced curriculum remains very large
    - [x] Do not curate or reduce the Advanced material during migration
    - [x] `/advanced/english-to-spanish-translations`
        - [x] Establish the multiple-translation lesson format with **uses of even**
        - [x] Add the combined **way-and-away** map, including atomic **away** movement, distance, absence, removal, and expression lessons
        - [x] Add **uses of rather**
        - [x] Add **uses of kind**, **pretty**, and **really**
        - [x] Add the related **but/yet** and **one** groups
        - [x] Add the focused **uses of so** lesson
        - [x] Atomize the large multiple-use concept maps into numbered lesson folders with bilingual summaries and mastery phrases
        - [x] Add numbered concept maps for **as**, **ever/never**, **such**, **while**, and **well**
        - [x] Add numbered concept maps for **no/none/any**, **all/every**, **some**, **wise**, **else**, and **though**
        - [x] Add numbered concept maps for **less/least**, **more/most**, **since**, **either/neither/whether**, and **just/only**
        - [x] Add completeness-first numbered concept maps for **make**, **use**, **long**, **mean**, and **keep**
        - [x] Add and pedagogically organize the complete **get** concept map across forms, obtaining, movement, becoming, phrasal verbs, causatives, passive voice, opportunity/obligation, and everyday replacements
        - [x] Add the **on/off** concept map organized by inferability: core uses, core picture, predictable extensions, fixed connections, and whole expressions
        - [x] Add the **in/out** concept map across core uses, physical movement, predictable extensions, fixed connections, whole expressions, and the productive **out-** prefix
        - [x] Add the **up/down** concept map across direction, position, completion/creation, intensity/control, and whole expressions
        - [x] Add the **over/under** concept map across physical paths and positions, comparisons with limits, productive prefixes, and whole expressions
        - [x] Add the related **leave/left**, **right**, and **straight** maps, including translations of **dejar**, direction contrasts, and homophones
        - [x] Add the **at** concept map with Spanish **en → at/in/on** confusion sets, core uses, verb connections, and the **at/in** beginning contrast
        - [x] Add the **back** concept map across rear position, return movement, core-verb particles, whole expressions, and related contrasts
        - [x] Add the interrelated **about**, **around**, and **of** concept maps, including Spanish **de** bridges and core-verb connections
        - [x] Add the **from** concept map across source, origin, starting points, movement, fixed connections, and contrasts with **to/for/of/since/away**
        - [x] Add the combined **by-and-through** map across proximity, deadlines, methods, interior paths, fixed connections, and the **through/threw/throw/thorough** sound family
        - [x] Add the related **into/onto** and **up-to/down-on** compound maps across movement, transformation, maximums, responsibility, evaluation, and fixed connections
        - [x] Add the complete **be** map across **ser/estar/tener/haber/ir/poder** translations, fixed connections, existential forms, constructions, and meaning-changing adjective contrasts
        - [x] Add the **side** word-building map across **inside/outside**, **upside/downside**, front/back and other-side positions, **across**, and **beside/besides**
        - [x] Add the related **inner/outer** and **upper/lower** family as a standalone map integrated into the **in/out** and **up/down** core lessons
        - [x] Rename the English-first section from `/contextual-uses` and add a dedicated verb index
        - [x] Organize the remaining English-first maps by space/direction, quantity/degree, clause-building connections, and reference/description/discourse
        - [x] Add the approved high-frequency verb maps for **take, go, come, put, turn, set, run, work, call, play, hold, pass, miss, point**, and **deal/deal with**
        - [x] Add the remaining approved English verb, function-word, fixed-construction, and interference candidates retained by the inclusion audit
        - [x] Add cross-cutting English construction maps for **would**, particle placement, phrasal-verb separability, preposition stranding, and future time clauses
        - [x] Add the remaining source words with context-dependent translations
    - [x] `/advanced/spanish-to-english-translations`
        - [x] Establish the Spanish-first translation-map structure
        - [x] Add the complete **de** map across core translations, English restructuring, fixed verb connections, expressions, and confusion sets
        - [x] Add the related **conocer** and **saber** maps, including **meet/know**, familiarity, learned ability, and **supe → found out**
        - [x] Add the related **esperar** and **recordar** maps across **wait/hope/expect/wish** and **remember/remind/recall**
        - [x] Add the **deber** map across obligation, advice, expectation, deduction, debt, and the related **own/owner/ownership** family
        - [x] Add the related **importar** and **molestar** maps across **matter/care/mind/bother/disturb/annoy**, including the false cognate **molest**
        - [x] Add the **pedir** map across **ask/ask for/order/request/borrow**, permissions, appointments, and applications
        - [x] Add the related **pensar** and **creer** maps across **think/believe/plan/intend/consider** and their fixed connections
        - [x] Add the complete **poder** map across ability, permission, possibility, opportunity, time forms, requests, and the **power** word family
        - [x] Add the Spanish **se** map across reflexive, reciprocal, formal second-person, **le/les** replacement, and pronominal structures
        - [x] Add standalone **para** and **por** maps across purpose, recipient, destination, cause, route, means, exchange, duration, rate, and agent
        - [x] Add the approved high-frequency maps for **quedar, llevar, pasar, hacer, haber, dar, poner, salir, seguir, tocar, sacar, contar, tratar**, and **faltar**
        - [x] Add the broader polysemous-verb set from **dejar, volver, llegar**, and **sentir** through **cargar, montar, lucir, extrañar, acordar**, and **resultar**
        - [x] Add the approved Spanish function-word maps from **ya, todavía/aún**, and **apenas** through **pues, tras, entre**, and **hacia**
        - [x] Add standalone Spanish-to-English construction maps for omitted subjects, **hay que**, duration/aspect, causatives, abstraction, and remaining quantity
        - [x] Organize Spanish-first maps under verb, function-word/connector, and pronoun/pronominal-structure indexes
    - [x] `/advanced/transformations`
        - [x] Add the **in → inner** map for relative inner/outer and upper/lower forms
        - [x] Add the **to → towards** map for the productive **-ward/-wards** directional family
        - [x] Add the **north → northern** map across cardinal directions, descriptive **-ern** forms, directional **-ward(s)** forms, intermediate directions, and capitalization
        - [x] Add isolated transformation maps anchored by **power → powerful/powerless → powerlessness**, **weak → weakness/weaken → weakening**, and **long → length → lengthen → lengthening**
        - [x] Add the five-use **white → whitish** map and separate **al-**, **be-**, and **fore-** word-family maps
        - [x] Move the noncritical Foundations word-building families into fifteen concrete Advanced transformation maps
    - [x] `/advanced/verb-forms`
        - [x] Add perception verbs with object + base verb versus object + **-ing**
    - [x] `/advanced/false-friends-and-interference`
        - [x] Add the approved false-friend and interference maps for current time, eventuality, sensitivity, career, success, compromise, argument, and negative-like degree
    - [x] `/advanced/past-and-past-participle`
        - [x] Migrate regular **-ed** pronunciation lessons for `/d/`, `/t/`, and `/ɪd/`
        - [x] Move the complete section to the Advanced root
        - [x] Unify the past and participle inventories into three-form lessons
        - [x] Organize irregular verbs into exact-rhyme and vowel-shift micro-lessons
        - [x] Add the complete modern head-verb and accepted-variant coverage index
        - [x] Separate one-offs, meaning-dependent forms, regional alternatives, and uncommon current forms
    - [x] `/advanced/english-to-spanish-translations/intensifiers`
        - [x] Add the degree-and-quantity contrast across **very**, **too**, **so**, **that**, and **as**
    - [x] `/advanced/english-to-spanish-translations/to-too-and-two`
        - [x] Contrast full-infinitive, bare-infinitive, purpose, and prepositional **to**
        - [x] Add destination, recipient, relationship, PING, and **used to** patterns
        - [x] Add focused **too**, **two**, pronunciation, contraction, and homophone lessons
        - [x] Atomize **too** and **two** into numbered lesson folders with bilingual summaries and mastery phrases
    - [x] Audit the completed migration against the original Excalidraw material
    - [x] Defer cross-course curation, final hierarchy, and application data-structure design until the Advanced migration is complete

### 2026-07-30 → 2026-07-31 — High-frequency completeness audit

- [x] Audit high-frequency English and Spanish for possible curriculum omissions
    - [x] Review approximately 2,000 frequent entries in each language
    - [x] Prioritize ambiguous translations, structural words, productive constructions, and likely Spanish interference
    - [x] Exclude ordinary direct vocabulary and transparent cognates from routine consideration
    - [x] Preserve missing, partial, and uncertain findings in `/curriculum/inclusion-candidates.md` for owner review
