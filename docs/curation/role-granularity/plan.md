# Priority tiers — from 3 roles to 5 (Phase 3)

_Started 2026-09-07. Supersedes the core/supporting/reference split for the
purpose of course sequencing. `trash` is unchanged. Builds on the Phase 2
taxonomy work (`docs/curation/taxonomy-cleanup-2026-09-07/`)._

## Why

`curriculumRole` was doing two jobs: "how central is this to the language"
(the `core` test) and "when does a course teach it" (the `supporting` vs
`reference` line). The second axis had no resolution — `supporting` (1147) and
`reference` (2795) were undifferentiated. This phase gives the sequencing axis
five bands so an MVP course can be built from a genuinely minimal set and later
courses can pull from named tiers.

## The philosophy this encodes

**Grammar-first with a limited vocabulary.** Master the whole grammatical
system on a small word set; teach the rest of the vocabulary incidentally or in
later advanced courses. This is deliberately *not* the CEFR model, which is
vocabulary-led.

## The five tiers

| Tier | Name | Definition |
|---|---|---|
| 1 | `core` | **The MVP set.** The minimum a student needs to assemble grammatically-correct sentences of any meaning, given a dictionary for content words. Test: *remove this row — can the student still build the sentence correctly with a dictionary?* If no, it is `core`. A dictionary supplies `mesa`, `manzana`, `correr`; it does not supply conjugation, ser/estar, `tener hambre` (not `estar hambriento`), the pronoun system, negation and question formation, `querer + infinitivo`, the prepositions, `hay`. |
| 2 | `essential` | Content vocabulary central enough that even a grammar-first MVP teaches it explicitly rather than sending the student to the dictionary every sentence. High everyday utility. Still a limited set. |
| 3 | `common` | Standard working vocabulary for the course *after* the MVP. Most thematic verbs, concrete nouns, descriptive adjectives, common idioms. |
| 4 | `extended` | Real but later: formal and abstract verbs, specialized-domain nouns, less common senses, most phrasal verbs, idioms. Advanced courses. |
| 5 | `rare` | Dictionary and drill completeness only. Transparent cognates, verb-form paradigm rows, archaic forms, hyper-specific senses. Never explicitly taught. |
| — | `trash` | Malformed, duplicate, or not real content. Unchanged. |

**Judgement, not a frequency list.** Importance is eyeballed per row against
the tier tests above. There is no external frequency list in play.

**Design decision (P3-4a, recorded): `core` carries the *entire* grammatical
system.** The philosophy is "master the entire grammar system with a limited
vocabulary." In this catalog the Spanish grammatical system — the full
pronoun, determiner, connector and preposition sets, the question words, and
the verb machinery (ser/estar/tener/ir/haber conjugation, negation, questions,
the perfect, the modals, comparison, the change-of-state copulas) — is about
**860 rows, ~19% of the catalog** (it grew as the Verb-Pattern / Q&N / Imperative
content was consolidated in P3-6). That is not vocabulary bloat; it is the
size of the grammar. The "limited vocabulary" of the MVP is the ~30
non-grammar rows that also sit in `core`. A row is grammar (→ `core`) if a
dictionary plus the rest of the grammar cannot produce it: every function
word, every conjugation/mood/tense pattern, every fixed construction. A row
is vocabulary (→ `essential`/`common`/`extended`/`rare`) if a dictionary
supplies it once the learner has the grammar.

**`core` is re-scoped tighter, not rebuilt.** The Phase 1/2 `core` (309) was
curated under "functional, can't-derive-unaided", which is nearly this tier-1
test. ~85% of it is already grammatical-operating-system (ser/estar/tener/ir/
haber/querer/poder/deber/gustar/necesitar, the pronoun and determiner sets,
question words, intensifiers, `tener + noun` frames, sentence-frame templates).
The tail to move down: lookupable content verbs (`comprar`, `vender`,
`trabajar`, `leer`, `mirar`) and the four kinship nouns.

## Old → new migration map (P3-1, mechanical)

| Old | New | Note |
|---|---|---|
| `core` | `core` | untouched; P3-2 trims the ~35-row content tail |
| `supporting` | `common` | P3-3 promotes the `essential` set up from here |
| `reference` | `rare` | P3-4 promotes the `extended` set up from here |
| `trash` | `trash` | untouched |

`reference` splits roughly 70/30 toward `rare`, so defaulting to `rare` and
promoting the minority is the lower-effort correct direction. **During the
window between P3-1 and P3-4, treat tiers 1–3 as the teachable set** (tier 4
material is temporarily sitting in `rare`).

## Phases

**PHASE 3 COMPLETE (P3-0..P3-8), 2026-09-07.** Final tiers:
core 917 / essential 398 / common 764 / extended 1070 / rare 1102 / trash 233.
All six guardrail bands in target. Open follow-ups, all optional:
- the essential verb tier still carries multi-sense verbs at ~2 senses each;
  a stricter MVP would keep only the single base sense.
- extended / rare within the specialized vocabulary is still a rule-based
  split; a per-topic human pass would sharpen the edges.


| # | Batch | Model | State |
|---|---|---|---|
| P3-0 | This plan | Sonnet | done |
| P3-1 | Prisma enum migration + code + mechanical remap | Sonnet | **done** (`43c0336d`). supporting→common, reference→rare. |
| P3-2 | Trim `core` to the MVP set | Sonnet | **done** — 27 rows core→essential (20 lookupable content verbs incl. comer/comprar/leer/vender/trabajar/vivir, + the 4 kinship nouns). Core 309→282. |
| P3-3a | Grammar rows common→core | Sonnet | **done** (`030054bb`) — 166 rows: the full determiner/connector systems + ser/estar/haber/ir/poder/deber machinery. Core 282→448. |
| P3-3b | Build `essential` from `common` | Sonnet | **done** — 362 rows: everyday verbs, people/family/body/place/time nouns, basic adjectives, cardinals 5-100, days, everyday adverbs. Essential 27→389. |
| P3-4a | Rescue grammar stranded in rare/common → core | Sonnet | **done** (`459bfeea`) — 279 rows (pronouns, prepositions, connectors, determiners, modal/copula verbs). Core 448→727. |
| P3-4b | Split `extended` out of `rare` | Sonnet | **done** — 1616 rows rare→extended (everything not a transparent cognate, paradigm drill, or bare mapping anchor). |
| P3-5 | Boundary review, guardrail retune, docs, memory | Sonnet | **done** — guardrails tuned; README + memory + policy updated. |
| P3-6 | Verb-Pattern / Q&N / Imperative / passive grammar → core | Sonnet | **done** — 136 rows. Core 727→863. |
| P3-7 | Stranded function words + conversational expressions | Sonnet | **done** — 17 function words → core; 17 conversational expressions → essential + `topic:social-expression`. |
| P3-8 | Per-tier boundary review | Sonnet | **done** — verb-form + `==>` drills common→rare (177); grammar constructions common→core (37+); everyday vocab common→essential (111); secondary verb senses essential→common (105); mid-tier vocab extended→common (475). Bands retuned. |

### P3-1 detail

- `prisma/schema.prisma`: `enum CurriculumRole { core essential common extended rare trash }`.
- Migration: `ALTER TYPE "CurriculumRole" ADD VALUE 'essential'` etc. (precedent: `20260902141350_add_trash_curriculum_role`).
- `src/lib/curriculum/types.ts`: `CurriculumRole` union + `curriculumRoles` array, ordered most→least priority.
- `src/lib/curriculum/validation.ts`, `scripts/lib/manifest.ts` / `apply-role-manifest.ts`: accept the new values.
- `scripts/audit-status.ts`: `ROLE_TARGETS` for 5 bands (set provisional, tune in P3-5).
- `src/components/curriculum/curriculum-table.tsx` + `src/app/admin/curriculum/page.tsx`: role-filter dropdown lists the five.
- `src/lib/lesson-builder/concept-suggestions.ts`: `conceptPriority` already derives bands from `teachableRoles` position, so it adapts; verify the banding still reads sensibly with 5.
- `src/lib/curriculum/scope.ts`: `unlessRole` on the Verbs cognate exclusion currently lists `["core","supporting"]` — update to the new set that means "teachable" (`["core","essential","common"]` initially, revisit after P3-4).
- Mechanical role manifest, then `npm run curriculum:snapshots:export -- --apply`, `db:verify`, `db:test`.

### Guardrail bands (tuned to the real shape, P3-8)

| Tier | Target % | Actual |
|---|---|---|
| `core` | 17–24 | 20.5 |
| `essential` | 6–11 | 8.9 |
| `common` | 13–22 | 17.0 |
| `extended` | 20–32 | 23.9 |
| `rare` | 20–30 | 24.6 |
| `trash` | 3–6 | 5.2 |
