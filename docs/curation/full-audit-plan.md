# Full database audit — plan & rubric

**Status:** Phase 0 (scaffolding) in progress. See `full-audit-progress.md` for
the live checklist and `full-audit-findings.md` for open questions for the
user. Read both of those before starting any session's work — this file is
the fixed rubric, those two are the moving state.

## Why this file exists

This audit spans many sessions with no shared memory between them. Every
session must apply the same standard, or the role tiers drift session to
session. This file is that fixed standard. **Read it in full before doing any
audit work.** Do not re-derive the rubric from first principles each session
— use the definitions and worked examples below exactly as given.

## The two tracks

- **Track A — per facet** (~665 units, one per facet button across the 22
  topic pages in `src/lib/curriculum/topics.ts`). Judges: does each row
  belong in this facet, is the facet's own tagging coherent, what's missing
  from this facet's coverage. Each facet is visited once.
- **Track B — per concept** (4,226 non-trash rows). Judges: role tier, tag
  correctness beyond just this one facet, normalization, example quality.
  Each concept is judged **exactly once**, gated by the `audit:reviewed` tag
  — check for that tag before spending judgment on a row a prior session
  already covered.

A session doing Track A work on a facet should also do Track B work on the
rows it's already looking at (tag `audit:reviewed` when done) — don't make a
second pass over the same rows later. The tracks are two lenses on one pass,
not two separate passes.

## State tracking

- `audit:reviewed` — this concept has been judged at least once (role,
  membership, tags, example) by a Track B pass.
- `audit:flagged` — this concept has an open question logged in
  `full-audit-findings.md` that needs the user's judgment call, not mine.
- Progress checklist (which facet-button units are done): `full-audit-progress.md`.
- Open questions for the user: `full-audit-findings.md`.

Never invent a third piece of state. If you need to remember something across
sessions, it goes in one of these three places, not in your own head.

## Role rubric

| Role | Definition | Test question |
|---|---|---|
| **core** | Can't hold a basic conversation without it. The closed-class grammatical skeleton and the ~200-400 highest-frequency function words/verbs. | "Would a beginner be stuck in a real conversation within the first few exchanges without this?" |
| **supporting** | Everyday and common, but learnable on contact — not structurally load-bearing. | "Would you hear this in normal conversation within your first weeks, but could you route around not knowing it?" |
| **reference** | Correct and worth having, but situational, specialized, or lower-frequency. | "Would most learners only need this in a specific context (work, travel, a hobby)?" |
| **trash** | Archaic, a duplicate, mistagged into existence, or actively wrong. | "Does keeping this row teach something false, or teach nothing at all?" |

### Worked examples (use these to calibrate, don't just read the abstract definitions)

**Core** (should stay rare — target ~5-8% of the database):
- `ser`/`estar` (to be), `tener` (to have), `ir` (to go), `querer` (to want),
  `poder` (can/to be able), `hacer` (to do/make) — the suppletive-verb
  system itself
- `yo`/`tú`/`él`/`ella`/`nosotros`/`ellos` — subject pronouns
- `no`, `sí`, `y`, `pero`, `o` — the negation/conjunction skeleton
- `agua` (water), `comida` (food), `casa` (house) — the handful of nouns
  that come up in nearly every beginner exchange
- `[el] bueno`/`[el] malo` (good/bad), `grande`/`pequeño` (big/small) — the
  handful of adjectives you cannot avoid

**Supporting** (target ~25-35%):
- `almorzar` (to have lunch), `manejar` (to drive), `preocuparse` (to worry)
  — common daily-life verbs, but a beginner can survive not knowing them for
  a week
- `[el] vecino` (neighbor), `[la] reunión` (meeting) — common nouns tied to
  daily life but not universal
- `a menudo` (often), `de vez en cuando` (once in a while) — common but
  replaceable adverbial phrases

**Reference** (target ~55-65% — this SHOULD be the majority; it is not a
demotion, it is the correct home for most specific vocabulary):
- `vigilancia` (vigilance), `precedente` (precedent) — real, correct,
  situationally specific
- `[el] republicano` (Republican), `[la] farmacia` (pharmacy) — domain-tied
- Most of the cognate spelling-family members, most business/legal/medical
  vocabulary, most of the phrasal-verb long tail

**Trash** (target ~3-6%):
- `beseech`/`besought` (archaic English, no learner needs this over the
  regular `beg`)
- A row duplicating another row's exact (spanish, english) meaning with
  worse data (see `malo / mala` → bad, trashed 2026-09-05 for exactly this)
- A row whose tag set contradicts its own content (mistagged into a facet
  it doesn't belong to, with no other coherent home)

### Numeric guardrail

Current DB-wide baseline (2026-09-05, before this audit): core 6.5% /
supporting 25.1% / reference 63.7% / trash 4.7%. This is already close to
healthy — **the goal is refinement of outliers, not a rebuild.** If your
session's changes are pushing any tier's share more than a couple of points
away from this baseline, stop and reconsider before continuing — you are
probably drifting the rubric, not fixing real outliers.

### Calibration set

Before starting a session's audit work, mentally re-rank these 12 concepts.
If your answer doesn't match the tier shown, re-read the worked examples
above before touching any real data — your calibration has drifted.

| Spanish | English | Correct tier |
|---|---|---|
| `[ser] bueno` | good | core |
| `no` | no/not | core |
| `[el] agua` | water | core |
| `[el] vecino` | neighbor | supporting |
| `almorzar` | to have lunch | supporting |
| `a menudo` | often | supporting |
| `[la] vigilancia` | vigilance | reference |
| `[el] precedente` | precedent | reference |
| `[el/la] republicano/a` | Republican | reference |
| `beseech` (archaic form row) | to beseech | trash |
| a broken-example duplicate row | (whatever it duplicates) | trash |
| `pedir disculpas por algo` | to apologize for | supporting |

## Per-unit checklist (apply to every facet-button unit, Track A + B combined)

1. **Role** — re-rank every row in the unit against its peers now that the
   list is small enough to compare directly. Use the rubric above, not gut
   feel in isolation.
2. **Membership** — does each row actually belong to this facet? If not,
   retag/move it. Don't leave a row somewhere just because moving it is more
   work.
3. **Tag correctness** — right `pos:`/`topic:`/`grammar:`/etc., no stray
   legacy tags, no contradictions (e.g., a row tagged `gender:masculine`
   whose bracket is `[la]`).
4. **Completeness — generate first, diff second.** Do not review the
   existing list and ask "does this look complete?" — that method misses
   gaps because you only notice what's in front of you. Instead: write out
   from first principles what *should* be in this facet (e.g., for
   `topic:color`: red, orange, yellow, green, blue, purple, black, white,
   gray, brown, pink — write this list before looking at the DB), *then*
   diff your list against what exists. Anything missing is a finding; add
   it or flag it.
5. **Normalization & example quality** — bracket conventions match the
   established patterns (`[ser]`/`[estar]`/`[el]`/`[la]`/`[el/la]`), example
   sentences are real natural usage (not a copy-pasted placeholder, not a
   self-referential circular example), no leftover slash notation.

Tag every row you touch (or confirm as fine) with `audit:reviewed`. If a row
raises a judgment call you shouldn't make unilaterally (a genuinely
ambiguous role call, a possible deletion of something that might be
intentional, a completeness gap big enough to be a mini-project of its own),
tag it `audit:flagged` and log it in `full-audit-findings.md` — do not block
the session on it.

## Phase 1 — global mechanical sweeps (run once, before Track A/B work starts)

These are cheap, scriptable, and would otherwise pollute every single manual
unit with the same recurring noise. Run each as its own script + manifest +
commit, before starting the facet-by-facet walk:

1. Duplicate `(spanish, english)`-adjacent pairs not caught by the DB's
   unique constraint (near-duplicates with different IDs).
2. Shared/placeholder example sentences (the bug class found and partially
   fixed 2026-09-05 — rerun the sweep now that every row has a home, since
   new instances may have been introduced by later batches).
3. Examples whose Spanish sentence doesn't contain the row's head word.
4. Missing `es:`/`en:` lemma tags on `pos:verb`/`pos:noun`/`pos:adjective`/
   `pos:adverb` rows that should have one.
5. Near-synonym facet values that should be merged (the `construction:`
   fragmentation pattern found 2026-09-05 — check `grammar:`, `morphology:`,
   `topic:` for the same issue).
6. Leftover slash notation or other bracket-format inconsistencies (the
   spaced `" / "` bug found 2026-09-05 in Adjectives — check DB-wide).

## Audit order (Track A, in priority order)

1. Closed-class grammar: Pronouns, Determiners, Interrogatives, Questions &
   Negation, Imperatives
2. Open-class core: Nouns, Adjectives, Adverbs, Numbers, Connectors,
   Prepositions, Expressions, Collocations
3. Verb machinery: Verb Patterns, Verb-Forms, Transformations
4. Spanish→English Mappings, English→Spanish Mappings
5. Phrasal Verbs by Root, Phrasal Verbs by Particle
6. Cognates (all suffix + Latin-root families)
7. The ~170 concepts in zero facet-button anywhere (reconciliation, not
   unit-by-unit)
8. Re-review the ~209 already-trashed rows (confirm each trash call still
   holds; nothing here should be un-trashed lightly, but check for
   over-eager trashing from before this rubric existed)

## Session protocol

1. Read this file (if not already cached from a recent turn in the same
   session) and skim `full-audit-progress.md` for the next unchecked unit.
2. Re-run the calibration set mentally before touching data.
3. Work forward through units. For each: pull the small list, apply the
   5-point checklist, build a manifest, dry-run → apply → verify → test
   (standard discipline — see `README.md`), tag `audit:reviewed`.
4. Commit after each unit or small natural batch (never end a session with
   uncommitted work).
5. Update `full-audit-progress.md` (checkbox + one-line note + commit hash)
   and `full-audit-findings.md` (anything flagged) before ending the
   session — these two files are the only continuity mechanism.
6. Stop with enough context headroom to do step 4-5 cleanly rather than
   rushing them.

## Trash policy

Trash is reversible (the row stays, just re-tiered — nothing is
hard-deleted), so apply it directly rather than blocking on approval per
row. Every trash decision gets one line in `full-audit-findings.md` with the
reason, so the user can review in bulk and reverse any call they disagree
with.
