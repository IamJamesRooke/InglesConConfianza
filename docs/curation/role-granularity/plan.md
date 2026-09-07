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

| # | Batch | Model | State |
|---|---|---|---|
| P3-0 | This plan | Sonnet | done |
| P3-1 | Prisma enum migration + code + mechanical remap | Sonnet | — |
| P3-2 | Trim `core` to the MVP set | Sonnet | **done** — 27 rows core→essential (20 lookupable content verbs incl. comer/comprar/leer/vender/trabajar/vivir, + the 4 kinship nouns). Core 309→282. |
| P3-3 | Build `essential` — promote the high-utility content set out of `common` | **Opus** | — |
| P3-4 | Split `extended` out of `rare` | Sonnet, signal-assisted | — |
| P3-5 | Boundary review, guardrail retune, docs, memory | Sonnet | — |

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

### Provisional guardrail bands (tune in P3-5)

| Tier | Target % |
|---|---|
| `core` | 4–7 |
| `essential` | 8–14 |
| `common` | 28–38 |
| `extended` | 18–28 |
| `rare` | 20–30 |
| `trash` | 3–6 |
