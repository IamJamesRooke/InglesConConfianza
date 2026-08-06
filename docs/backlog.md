# Backlog

> Current priorities and future work come first. Completed work is recorded below as a reverse-chronological timeline, with the exhaustive migration checklist preserved in the dated archive.

## Current focus

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
