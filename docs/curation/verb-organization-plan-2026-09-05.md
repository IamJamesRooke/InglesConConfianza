# Verb organization plan — 2026-09-05

Supersedes `verb-conjugation-matrix.md`, which is incomplete in ways documented
below. Read-only research pass; nothing in this document has been applied.

---

## 1. Executive summary

### What is actually wrong

**(a) The 2026-09-05 conjugation pass enumerated persons, not senses.** It
produced a clean 5×5 grid (`ir`, `ser`, `estar`, `tener`, `haber` × 1sg/2sg/3sg/1pl/3pl)
and, because it never listed the senses each verb already has, it silently
dropped most of them. Concretely, against the live database:

| verb | senses already split at the infinitive level | senses the conjugated rows actually cover |
|---|---|---|
| `ser` | 12 rows | 2–3 (identity / classification), via one vague `soy [algo] → I am [something]` |
| `estar` | 16 rows (3 of them core) | 2 (state + location, merged); **progressive dropped** |
| `ir` | 10 rows | 1 (`ir a [hacer algo]`, going-to); **`ir a [un lugar]` dropped** |
| `tener` | 13 rows | 1 (`tener [algo]`); **age and obligation dropped** |
| `haber` | 5 rows + a separate 6-row `hay` family | 1 (perfect auxiliary); existential family left outside the facet |

The reported symptom — `estoy hablando` has no taggable concept — is real and
verified: `f2zryn85p8 estar [haciendo algo] → to be [doing something]` exists at
the infinitive level, and searching `estoy` returns exactly one row,
`93wmoiwink estoy [en un estado o lugar]`, which is the wrong sense. Searching
`estoy hablando` returns **zero**. So does `tengo que`. So does `hablo`.

**(b) The premise "regular verbs stay infinitive-only" is already false in the
catalog.** Of 730 `pos:verb` rows, 82 have a finite (non-infinitive) Spanish
head, and only the 25 new ones carry any `conjugation:` tag. The other 57 are
ad-hoc conjugated rows accumulated before the facet existed:
`sgum9oyi5l hizo → did`, `c16i76gpbx hace → does`, `jdd2lebx6x ¿Puedo [hacer algo]?`,
`43z1s233ya ¿Puedes [hacer algo]? (capacidad)`, `zgny1ugayh ¿Podrías [hacer algo]?`,
`al22a3sck3 pudo [hacer algo] (éxito específico) → was able to`,
`o9amfhzn7k podrá [hacer algo] → will be able to`,
`gtr8psda9i podría [hacer algo] → would be able to`,
`yrb2jzggm4 debería [hacer algo] → should`,
`ihsw7a0ggn ¿vas a [hacer algo]?`, `v7y40xtgb3 ¿has [hecho algo]?`,
`8aej7jfu2y ¿tienes que [hacer algo]?`, `5pzoflm3f4 [alguien] estaba [haciendo algo] → was [doing something]`,
`9jt3xxrxse gustaría [hacer algo] → would like to`, and the whole
`hay / no hay / ¿hay?` family. Some of these duplicate the new rows in a
different shape (`ihsw7a0ggn ¿vas a…?` vs `0lbant78ng vas a…`; `v7y40xtgb3 ¿has…?`
vs `xffe82pdpg has…`). The facet's stated scope does not describe the data.

Note especially `5pzoflm3f4 [alguien] estaba [haciendo algo] → was [doing something]`:
the **past** progressive already has a row; only the present one is missing.

**(c) The `es:` lemma facet — the only thing linking a conjugated form to its
verb — is not reliably a lemma facet.** It contains English words
(`es:be` ×22, `es:have` ×15, `es:do` ×12, `es:can` ×12, `es:get` ×3, `es:go` ×2)
and Spanish finite forms used as if they were lemmas (`es:he`, `es:ha`, `es:has`,
`es:son`, `es:hizo`, `es:puedo`, `es:sea`, `es:iba`, `es:ibas`, `es:debe`,
`es:debes`, `es:debía`, `es:debería`, `es:deberías`). One row, `nuo847x66j hay
[algo singular]`, carries `es:deber` outright — a straight mis-tag.

### Recommended shape of the fix

Four moves, in dependency order:

1. **Add a `sense:` facet** — the missing edge. One collection per infinitive
   sense, carried by the infinitive anchor row *and* by every conjugated row of
   that sense. No schema change (see §2).
2. **Add `conjugation:infinitive` and `conjugation:deferred`** to
   `KNOWN_CONJUGATION_VALUES`, and add a `verbs` spec to `topic-audit.ts` that
   enforces four invariants (§4.3). The `deferred` value is the anti-silent-drop
   mechanism: a sense that is in scope must either have a complete paradigm or be
   explicitly, visibly deferred. The previous pass could not have shipped under
   this check.
3. **Fix search before adding rows** — lemma-aware expansion in the concept
   picker (§7). This is what makes `hablo`, `quiero`, `estoy hablando` findable
   without a row per person per verb per tense (which would be ~13,000 rows).
4. **Add ~25–30 conjugated rows** only where the conjugated form's English is
   *not derivable* from the infinitive row's English (§6). `tengo veinte años →
   I am twenty` passes that test. `hablo → I speak` fails it and stays a search
   problem.

---

## 2. Schema verdict: no schema change. Add a facet and an auditor.

### The crux question, answered against real data

> Can the current schema express "this conjugated form belongs to THAT
> infinitive sense" losslessly and query-ably?

**Today: no.** Run the requested query — *every conjugated form of `ser`'s
identity sense*:

```
es:ser  ∩  conjugation:present
  → soy [algo], eres [algo], es [algo], somos [algo], son [algo]
```

That returns the paradigm, but `es:ser` has **377 members** spanning all 12
infinitive senses plus ~350 `ser + adjetivo` collocations, and nothing in the
result distinguishes `othawv9u0f ser [identidad]` from
`m5wxiwxpo1 ser [una clasificación]` from `2z3yhpg9ve ser de [un lugar]`. There
is no tag that `soy [algo]` and `ser [identidad]` share and that
`ser de [un lugar]` does not. The relation is not merely unindexed — it is
**absent**. Same for the other two questions: "these five rows are one
person-paradigm" is only inferable because `es:ser ∩ conjugation:present`
happens to have exactly five members today (it breaks the moment `ser` gets a
second paradigm — which §6 proposes), and "these two rows are the classic
confusion pair" *is* already expressible and works: `contrast:soy-vs-estoy` has
exactly 2 members, `contrast:lo-vs-le` 2, `contrast:su-ambiguity` 10.

### But the fix is a tag, not a column

`contrast:` is the existence proof. A collection whose membership is exactly
{anchor} ∪ {paradigm} **is** a typed relation — a many-to-many join table with a
string key instead of an integer one. What tags lack is not expressiveness but
*enforcement*: nothing stops a `sense:` collection from having two anchors, or
zero, or a member from the wrong lemma.

The existing project already solved that problem once, for `grammar:`: a
controlled vocabulary in `collections.ts` plus a regression test that rejects
unknown values, plus `curriculum:audit` for per-topic structural rules. Extend
that machinery rather than the schema.

| | `sense:` facet (recommended) | schema change (`senseOf` self-FK + `lemma` + `paradigmSlot`) |
|---|---|---|
| migration cost | **zero rows migrated**; one facet + ~15 collection names + ~55 memberships | Prisma migration, backfill 4,358 rows, rewrite `seed-data/curriculum.json` export shape, update `db:verify`/`db:test`, update all six `curriculum:*` manifest scripts and `scripts/lib/manifest.ts`, update `/curriculum` table + the three built topic pages |
| risk to the 3 built topics | none — they filter on `baseCollection` + `facetButtons`, both plain collection names | each topic page and its audit spec needs re-testing |
| integrity | enforced by registry test + new audit spec | enforced by the DB |
| ordering a paradigm | derived in code from `conjugation:1sg…3pl` (fixed order) | `paradigmSlot` column |
| query "ser identity's forms" | `sense:ser-identidad ∩ conjugation:present` — one indexed join, same shape as every existing topic query | one join |
| reversibility | `curriculum:collections:apply DELETE/RENAME/MERGE` | a down-migration |

**Verdict: do not change the schema now.** The one condition that would flip
this: if rendering ordered conjugation tables from data becomes a *learner-facing
product feature* (not a curator view), the ordering and completeness guarantees
are worth a real column. That is not in scope for Modules 1–3.

One honest caveat: `ConceptCollection.position` is `@@unique([conceptId, position])`
— per-concept, not per-collection — so it cannot be used to order a paradigm.
Order comes from a hard-coded slot sequence in code. That is fine; there are five
slots and they never change.

---

## 3. Facet / tag design for verbs

Every conjugated verb row carries, exactly:

| facet | value | required |
|---|---|---|
| `pos:` | `verb` | yes |
| `es:` | the **infinitive lemma** — `es:ser`, `es:estar`, `es:ir`, `es:tener`, `es:haber` | yes, exactly one verb lemma |
| `sense:` | **new** — which infinitive sense this form realizes | yes, ≥1 |
| `conjugation:` | one person value (`1sg`/`2sg`/`3sg`/`1pl`/`3pl`) **or** `infinitive` | yes, exactly one |
| `conjugation:` | one tense value (`present`, and later `preterite`/`imperfect`/`future`/`conditional`) | yes, exactly one |
| `conjugation:` | `irregular` where the form is suppletive/stem-changing | optional |
| `en:` | the English head (`en:am`, `en:is`, `en:are`, `en:have`, `en:has`, `en:going`) | yes |
| `grammar:` | as the sense requires (`grammar:progressive`, `grammar:going-to`, `grammar:age`, `grammar:modal`, `grammar:existence`) | as applicable |
| `contrast:` | pair/set membership + `contrast:confusable` | where it teaches something |

### New facet: `sense:`

Registry entry for `COLLECTION_FACETS`:

```
sense: "one sense of one Spanish lemma — the anchor infinitive row plus every
        conjugated form that realizes it; the join between a paradigm and its meaning"
```

Value shape: `<lemma>-<slug>`, unaccented ASCII. Proposed `KNOWN_SENSE_VALUES`
for this pass (15):

```
ser-identidad        ser-clasificacion    ser-caracteristica   ser-origen        ser-hora
estar-estado         estar-lugar          estar-progresivo
ir-destino           ir-futuro
tener-posesion       tener-edad           tener-obligacion
haber-perfecto       haber-existencia
```

`sense:` is deliberately *not* `construction:` (which is a syntactic frame,
`construction:map-a-to`) and not `es:` (which is a whole lemma, all senses).

### Additions to `KNOWN_CONJUGATION_VALUES`

```
infinitive   — the anchor row of a sense; the lemma slot of the paradigm
deferred     — this sense is in verb scope but deliberately has no paradigm yet
```

Plus, if judgment call #1 is accepted (retag existing rows):
`preterite`, `imperfect`, `future`, `conditional`, `perfect`, `imperative`.

### Person inventory (5 slots, documented explicitly)

`1sg` (yo) · `2sg` (tú) · `3sg` (él/ella/usted) · `1pl` (nosotros) · `3pl`
(ellos/ellas/ustedes). No `2pl` — Latin American Spanish is the target dialect
(product brief: "Colombian and broader Latin American Spanish as the default"),
so `vosotros` is out and `usted`/`ustedes` fold into 3sg/3pl. **A paradigm is
all five slots or none** — a partial paradigm is exactly the silent drop this
pass exists to prevent.

### The rule that decides whether a sense gets rows at all

> **Add conjugated rows only when the conjugated form's English mapping is not
> derivable from the infinitive row's English.**

- `hablar → to speak` ⇒ `hablo → I speak`. Derivable. **No row.** Search problem.
- `tener [número] años → to be [number] years old` ⇒ `tengo veinte años → ?`
  The learner must produce *I am twenty*, not *I have twenty years*. Not
  derivable from anything on the page. **Row.**
- `ir a [un lugar] → to go to [a place]` vs `ir a [hacer algo] → to be going to`:
  the *same* Spanish surface `voy a` splits into two Englishes. Not derivable.
  **Rows, plus a contrast.**

And a corollary that removes a lot of noise:

> **A sense that only ever occurs in 3sg does not need a paradigm; it needs its
> example sentence to carry the form.** (`cbhs0k69zd ser [adjetivo] [hacer algo]`,
> `4pgifzt26u hay que [hacer algo]`.)

---

## 4. Scope

### 4.1 Re-derived, not inherited

The prior list (ser, estar, ir, tener, haber) was derived from "suppletive
present-tense forms." Re-deriving from (i) what Module 1 actually teaches, (ii)
the product brief's named problems, and (iii) what conjugated rows already exist:

**In scope, full sense accounting + rows (§5, §6):** `ser`, `estar`, `ir`,
`tener`, `haber`. Confirmed — these five carry the two problems the product
brief names first (`ser`/`estar` → `be`) and the existential `hay`.

**In scope, retag only, no new rows:** `poder`. The product brief names it
second ("can, could, may, might, manage to") and the catalog **already** has its
paradigm scattered as `0zuw37lnfv`, `nk4hb2zaok`, `mxguwwzrxk`, `a1eubfzyp5`,
`dugiwco70z` (senses) plus `jdd2lebx6x`, `43z1s233ya`, `r30tfgius4`, `zgny1ugayh`,
`jwk81y46bp`, `al22a3sck3`, `o9amfhzn7k`, `gtr8psda9i`, `7r5w8ljmzc`,
`rblsgxrrm1`, `278hopgdpm`, `yhchadk82l` (forms). Bringing these under
`sense:`/`conjugation:` costs no new rows and turns an existing mess into a
queryable paradigm. Deliberately excluded from §6's row table.

**Explicitly out of scope for this pass:** `hacer`, `querer`, `saber`, `decir`,
`dar`, `ver`, `venir`, `gustar`, `deber`, and all 600+ other infinitives.
Rationale: their conjugated forms are within one or two characters of the
infinitive stem, so §7's lemma expansion resolves them, and none of them has a
sense whose English is non-derivable. `hacer`'s four English-morphology rows
(`hace/hizo/hecho/haciendo`) are `form:` drills, not Spanish conjugation, and
should stay out of the `conjugation:` facet — flag only.

### 4.2 Tenses — judgment call, see #1

New rows in §6: **present only.** But the tense question is not "should we add
past tense" — the catalog *already contains* past/future/conditional conjugated
rows (`pudo`, `podrá`, `podría`, `debería`, `había podido`, `estaba [haciendo
algo]`, `hizo`, and `haber [algo] (pasado singular) → there was`). The real
question is whether the facet's controlled vocabulary acknowledges them. See
judgment call #1.

### 4.3 Audit invariants (`npm run curriculum:audit verbs`)

1. Every `sense:X` collection contains **exactly one** row also tagged
   `conjugation:infinitive` (the anchor).
2. Every row tagged `sense:X` carries exactly one `es:` verb lemma, and it
   matches `X`'s prefix.
3. Every row tagged with a person value carries exactly one tense value and
   ≥1 `sense:`.
4. **Completeness:** for every `sense:X` on an in-scope lemma, either all five
   person slots are present for at least one tense, or the anchor carries
   `conjugation:deferred`. *This is the check that would have caught
   `estar [haciendo algo]`.*

---

## 5. Per-verb, per-sense enumeration

Every row currently in the catalog at the infinitive level for the five in-scope
verbs, with an explicit disposition. **No omissions.** Legend: **CONJ** = build
a full 5-slot paradigm · **SHARE** = deliberately shares another sense's
paradigm · **DEFER** = in scope, no paradigm yet, tag `conjugation:deferred` ·
**3SG-ONLY** = sense exists only in 3sg, no paradigm by rule · **N/A** = not a
verb sense (morphology/derivation row).

### `ser` — 12 infinitive-level rows

| id | row | sense tag | disposition | why |
|---|---|---|---|---|
| `othawv9u0f` | `ser [identidad]` → to be [an identity] · *Soy profesora.* | `ser-identidad` | **CONJ** (exists) | anchor of the existing `soy/eres/es/somos/son [algo]` paradigm |
| `m5wxiwxpo1` | `ser [una clasificación]` → to be [a classification] · *Es un problema.* | `ser-clasificacion` | **SHARE** with `ser-identidad` | both are *be + noun*; identical surface behaviour, identical English. Tag the same 5 rows with both senses — sharing declared, not silent. See JC #3 |
| `z2n8811v62` | `ser [una característica]` → to be [a characteristic] · *Es importante.* | `ser-caracteristica` | **CONJ** (new, conditional) | *be + adjective* is where the `ser`/`estar` confusion actually lives (*es bien* / *está importante*). `soy [algo]` claims to cover it but its English says *something*, i.e. a noun. See JC #4 |
| `46elg5u15i` | `ser [adjetivo]` → to be [adjective] · *La reunión es importante.* | `ser-caracteristica` | **SHARE** + dedup candidate | near-duplicate of `z2n8811v62`; differs only in bracket wording. Flag for merge, JC #13 |
| `6vgdzpegua` | `ser [una hora o fecha]` → to be [a time or date] · *Son las tres.* | `ser-hora` | **PARTIAL, retag only** | `05558aoht5 son las [hora] → it's [time]` and `shzp9wzrxq son las [hora y minutos]` already exist; tag them `sense:ser-hora`, `conjugation:3pl`, `conjugation:present`. Only 3sg/3pl ever occur (*es la una* / *son las tres*) → completeness exemption; anchor gets `conjugation:deferred`. Check whether `es la una` exists; if not, one new row. See JC #5 |
| `2z3yhpg9ve` | `ser de [un lugar]` → to be from [a place] · *Soy de Colombia.* | `ser-origen` | **CONJ (new)** | **dropped by the previous pass.** Self-introduction is Module 1 material; *soy de* is the single most-used `ser` frame after *soy [noun]* |
| `obznlhzdxe` | `ser en [un lugar]` → to be at [a place] · *La reunión es en la oficina.* | `ser-lugar-evento` | **DEFER** | the rare event-location `ser`; teaching it inside Module 1 fights the *estar* = location rule the learner is still installing. Tag `contrast:ser-en-vs-estar-en` now, conjugate later |
| `cme1al3v5p` | `ser de [un material]` → to be made of | `ser-material` | **DEFER** | supporting tier, 3sg-dominant, no Module 1–3 need |
| `qbdgh95q4i` | `ser de [alguien]` → to belong to | `ser-posesion` | **DEFER** | same |
| `cbhs0k69zd` | `ser [adjetivo] [hacer algo]` → it is [adjective] to [do something] · *Es importante hacerlo.* | `ser-impersonal` | **3SG-ONLY** | occurs only as *es* + adjective + infinitive; the row's own example already shows the surface form. Search, not rows |
| `emji2mg22t` | `ser [hecho] por [alguien]` → to be [done] by · passive | `ser-pasiva` | **DEFER** | passive voice is past Module 3 |
| `ft6li4zkws` | `ser [adverbio de frecuencia] [estado]` · *Ella casi siempre **está** aquí.* | — | **DEFER + DATA BUG** | a `ser` row whose Spanish example uses `estar`. Either the row belongs to `estar` or the example is wrong. Flag, JC #13 |

*(The ~350 `ser + adjetivo` collocation rows — `ser necesario`, `ser pesado/a`, …
— are `pos:adjective` vocabulary that happen to carry `es:ser`. They are not
verb senses and get no `sense:` tag. Accounted for, deliberately excluded.)*

### `estar` — 16 infinitive-level rows

| id | row | sense tag | disposition | why |
|---|---|---|---|---|
| `nqyror4j5f` | `estar [en un estado]` → to be [in a state] · *Estoy cansado.* | `estar-estado` | **CONJ** (exists) | anchor for `estoy [en un estado o lugar]` etc. |
| `obf74hel79` | `estar [en un lugar]` → to be [in a place] · *Ana está en casa.* | `estar-lugar` | **SHARE** with `estar-estado` | the existing 5 rows say "somewhere or feeling something" — they genuinely cover both. Same paradigm, same English, and the learner's difficulty is `ser` vs `estar`, not state vs location. Tag both senses on the same 5 rows. See JC #2 |
| `f2zryn85p8` | `estar [haciendo algo]` → to be [doing something] · *Estoy trabajando.* | `estar-progresivo` | **CONJ (new) — THE DROP** | this is the reported failure. Note `5pzoflm3f4 [alguien] estaba [haciendo algo] → was [doing something]` already covers the *past* progressive, so the present is the only hole. 5 new rows |
| `f5h0hvcv1d` | `estar de acuerdo` → to agree | `estar-acuerdo` | **DEFER** | fixed expression; its example *is* `Estoy de acuerdo`, so §7 search resolves it |
| `e6gbegp44a` | `estar a punto de [hacer algo]` → to be about to | `estar-punto` | **DEFER** | supporting, Module 3+ |
| `x9rvf35d7y` | `estar a tiempo` → to be on time | — | **DEFER** | supporting fixed expression |
| `p76va4jmyy` | `estar a cargo de [algo]` → to be in charge of | — | **DEFER** | reference tier |
| `ahj6apo9ri` | `estar de vacaciones` → to be on vacation | — | **DEFER** | reference tier |
| `6ywiv1c0l5` | `estar a favor de [algo]` → to be in favor of | — | **DEFER** | reference tier |
| `nfursmvnpb` | `estar en contra de [algo]` → to be against | — | **DEFER** | reference tier |
| `myuguvt6ul` | `estar de pie` → to be standing | — | **DEFER** | reference tier |
| `i2sih4q1lh` | `estar en lo cierto` → to be right | — | **DEFER** | reference tier |
| `oyxzv5jbvk` | `estar de acuerdo con [alguien]` → to agree with | — | **DEFER** | reference tier |
| `9v5e2r6rkb` | `estar en blanco` → to be blank | — | **DEFER** | reference tier |
| `zjixrrmhoh` | `estar de acuerdo ==> el acuerdo` | — | **N/A** | `morphology:` derivation row, not a verb sense |
| `ytr81haq2m` | `estar de acuerdo ==> estar en desacuerdo` | — | **N/A** | same |

### `ir` — 10 rows + 2 `irse` rows

| id | row | sense tag | disposition | why |
|---|---|---|---|---|
| `38d1kfif1b` | `ir a [hacer algo]` → to be going to · *Voy a llamar a Ana.* | `ir-futuro` | **CONJ** (exists) | anchor for `voy/vas/va/vamos/van a [hacer algo]` |
| `64xccqphml` | `ir a [hacer algo]` → gonna | `ir-futuro` | **SHARE** | register variant of the same paradigm; do **not** build a parallel *gonna* paradigm |
| `2iiyjrogmc` | `ir a [un lugar]` → to go to [a place] · *Voy a la oficina.* | `ir-destino` | **CONJ (new)** | **dropped by the previous pass.** `voy a` is ambiguous between destination and future — the single most valuable `ir` contrast, and today only one branch has rows. `@@unique([spanish, english])` permits it: same Spanish, different English |
| `k9y5vq9p06` | `ir a casa` → to go home | `ir-destino` | **DEFER** | supporting; no-preposition special case |
| `nsdu5c6q9d` | `ir en [un medio de transporte]` → to go by | `ir-transporte` | **DEFER** | supporting |
| `cpwm5oqh8t` | `ir a pie` → to go on foot | — | **DEFER** | reference |
| `dv55nncur9` | `ir de compras` → to go shopping | `ir-actividad` | **DEFER** | *go + -ing* family; the family, not the person, is the teaching unit |
| `qldej05yfp` | `ir a correr` → to go running | `ir-actividad` | **DEFER** | same |
| `cvw44cpv4h` | `ir a bailar` → to go dancing | `ir-actividad` | **DEFER** | same |
| `8wpdwqvpbe` | `ir a [hacer algo]` → to go [do something] · *Ve a hacerlo.* | `ir-imperativo` | **DEFER** | this is an **imperative**, a different conjugation axis entirely. Needs `conjugation:imperative` before it can be tagged. Flag |
| `2a5bbtm7cl` | `irse` → to leave · *Ya me voy.* | `irse-partir` | **DEFER + FLAG** | *me voy* is very high frequency and is a **pronominal** paradigm (*me voy / te vas / se va*) — a different row shape, needing a clitic column the model does not have. See JC #6 |
| `nis5rixomq` | `irse` → to go away | `irse-partir` | **DEFER** | reference |

### `tener` — 13 rows

| id | row | sense tag | disposition | why |
|---|---|---|---|---|
| `wwwc8jugby` | `tener [algo]` → to have [something] | `tener-posesion` | **CONJ** (exists) | anchor for `tengo/tienes/tiene/tenemos/tienen [algo]` |
| `ccrgp9wvgz` | `tener [número] años` → to be [number] years old · *Tiene diez años.* | `tener-edad` | **CONJ (new)** | **dropped.** The canonical Spanish-speaker error is *"I have twenty-five years."* The English is not derivable from the Spanish by any rule the learner has. Highest-value new paradigm in this document |
| `7s7vnrgxud` | `tener que [hacer algo]` → to have to | `tener-obligacion` | **CONJ (new)** | **dropped.** Searching `tengo que` returns **zero rows** today. Partially shadowed by `8aej7jfu2y ¿tienes que [hacer algo]?` (question frame) and `22pjks5vmh no tener que…` (negative) — neither is the plain declarative |
| `8zgoedsnqi` | `tener que` → to have got to | `tener-obligacion` | **SHARE** | English register variant |
| `ooz5w92kjm` | `tener que` → gotta | `tener-obligacion` | **SHARE** | English register variant |
| `dtnmnb60nj` | `tener que [hacer algo] (hablado)` → gotta | `tener-obligacion` | **SHARE + dedup candidate** | duplicate of `ooz5w92kjm`. JC #13 |
| `acxwq7xjm9` | `tener que` → must | `tener-obligacion` | **SHARE** | modal variant |
| `86v2tii41j` | `tener en cuenta [algo]` → to keep in mind | — | **DEFER** | reference fixed expression |
| `7xfrxi3jd5` | `tener en cuenta [algo]` → to take into account | — | **DEFER** | reference |
| `15khny2b9v` | `tener que ver con [algo]` → to have to do with | — | **DEFER** | reference |
| `6vpv4m0g02` | `tener que ver con [algo]` → to be related to | — | **DEFER** | reference |
| `5qr32psjlf` | `tener [algo] puesto` → to have [something] on | — | **DEFER** | reference |
| `fs8u8cu63l` | `tener a [alguien] [haciendo algo]` → to keep [somebody] [doing something] | — | **DEFER** | reference, causative |

*(The `tener + noun` state idioms — `tener hambre`, `tener frío` — live under
other lemmas and are a separate, genuinely large family. Out of scope; flagged
as future work, since they are a second high-value `tener` ≠ `have` mapping.)*

### `haber` — 5 rows, plus a parallel 6-row `hay` family

| id | row | sense tag | disposition | why |
|---|---|---|---|---|
| `rvo8g5gv94` | `haber [hecho algo]` → to have [done something] | `haber-perfecto` | **CONJ** (exists) | anchor for `he/has/ha/hemos/han [hecho algo]`; keep the forms at `supporting` — the present perfect is past Module 1–2 |
| `6j9mgb7b17` | `haber [algo] (presente singular)` → there is | `haber-existencia` | **MERGE candidate** | duplicates `nuo847x66j hay [algo singular]` at a different level. `hay` is the real teaching row. JC #5 |
| `7yqanblhbj` | `haber [cosas] (presente plural)` → there are | `haber-existencia` | **MERGE candidate** | duplicates `54mbh87vk1 hay [cosas plurales]` |
| `89ut7cha5j` | `haber [algo] (pasado singular)` → there was | `haber-existencia` | **RETAG, imperfect** | an existing **past-tense** conjugated row (*Había un problema*). Direct evidence for JC #1 |
| `4w8zmnbknt` | `haber [cosas] (pasado plural)` → there were | `haber-existencia` | **RETAG, imperfect** | same |
| `nuo847x66j` | `hay [algo singular]` → there is [something singular] | `haber-existencia` | **RETAG** `conjugation:3sg` + `present` · **also carries a bogus `es:deber` tag — untag** | |
| `54mbh87vk1` | `hay [cosas plurales]` → there are | `haber-existencia` | **RETAG** `conjugation:3pl` + `present` | |
| `cp5hmttaq2` | `hay [algo singular]` → there's | `haber-existencia` | **RETAG** (contraction variant) | |
| `qhznzi6ug8` / `ker7jy3lyb` | `no hay …` → there isn't / aren't | `haber-existencia` | **RETAG** (negative frame) | |
| `esf7i85ozv` / `g7zuuumnig` | `¿hay …?` → is there / are there | `haber-existencia` | **RETAG** (question frame) | |
| `4pgifzt26u` | `hay que [hacer algo]` → you have to | `haber-necesidad` | **3SG-ONLY** | impersonal; exists only as *hay que*. No paradigm by rule |
| `laom4z3bwd` | `hay que [hacer algo]` → we need to | `haber-necesidad` | **3SG-ONLY** | same |

The `haber` existential is the clearest illustration of the whole problem: the
*right* rows already exist (`hay`, `no hay`, `¿hay?`, `había`), they are `core`,
they teach well — and the conjugation facet does not know about any of them,
while an inferior duplicate set sits at the infinitive level with `supporting`.

---

## 6. Row-by-row table (ready for TSV manifests)

Manifest column order for `curriculum:concepts:add` is
`spanish · english · exSpanish · exEnglish · role · |-collections`.

All new rows carry `pos:verb`, `conjugation:present`, `conjugation:irregular`,
their `es:` lemma, their `sense:`, their person slot, and an `en:` head. The
`|-collections` column below abbreviates: **C** = `conjugation:`, plus the listed
extras. Roles follow the established pattern (1sg/3sg `core`, others `supporting`).

### Set A — `estar` progressive (the reported drop) · `sense:estar-progresivo`

| # | spanish | english | ex (es) | ex (en) | role | slot |
|---|---|---|---|---|---|---|
| A1 | `estoy [haciendo algo]` | I am [doing something] | Estoy hablando con ella. | I am speaking with her. | core | C1sg |
| A2 | `estás [haciendo algo]` | you are [doing something] | Estás trabajando mucho. | You are working a lot. | supporting | C2sg |
| A3 | `está [haciendo algo]` | is [doing something] | Ella está estudiando. | She is studying. | core | C3sg |
| A4 | `estamos [haciendo algo]` | we are [doing something] | Estamos comiendo. | We are eating. | supporting | C1pl |
| A5 | `están [haciendo algo]` | they are [doing something] | Ellos están esperando. | They are waiting. | supporting | C3pl |

Extra collections: `es:estar`, `grammar:progressive`, `form:present-participle`,
`construction:be-present-participle`, `en:am`/`en:is`/`en:are`.

### Set B — `ir` destination · `sense:ir-destino`

| # | spanish | english | ex (es) | ex (en) | role | slot |
|---|---|---|---|---|---|---|
| B1 | `voy a [un lugar]` | I am going to [a place] | Voy a la oficina. | I am going to the office. | core | C1sg |
| B2 | `vas a [un lugar]` | you are going to [a place] | Vas a la escuela. | You are going to the school. | supporting | C2sg |
| B3 | `va a [un lugar]` | is going to [a place] | Ella va al parque. | She is going to the park. | core | C3sg |
| B4 | `vamos a [un lugar]` | we are going to [a place] | Vamos a la casa de Ana. | We are going to Ana's house. | supporting | C1pl |
| B5 | `van a [un lugar]` | they are going to [a place] | Ellos van al mercado. | They are going to the market. | supporting | C3pl |

Extra: `es:ir`, `en:go`, `construction:map-a-to`, `topic:location`,
`contrast:voy-a-lugar-vs-voy-a-infinitivo` + `contrast:confusable` on B1/B3.

### Set C — `ser` origin · `sense:ser-origen`

| # | spanish | english | ex (es) | ex (en) | role | slot |
|---|---|---|---|---|---|---|
| C1 | `soy de [un lugar]` | I am from [a place] | Soy de Colombia. | I am from Colombia. | core | C1sg |
| C2 | `eres de [un lugar]` | you are from [a place] | ¿Eres de México? | Are you from Mexico? | supporting | C2sg |
| C3 | `es de [un lugar]` | is from [a place] | Ella es de Perú. | She is from Peru. | core | C3sg |
| C4 | `somos de [un lugar]` | we are from [a place] | Somos de Bogotá. | We are from Bogotá. | supporting | C1pl |
| C5 | `son de [un lugar]` | they are from [a place] | Ellos son de España. | They are from Spain. | supporting | C3pl |

Extra: `es:ser`, `en:from`, `construction:map-de-from`, `grammar:origin`.

### Set D — `tener` age · `sense:tener-edad`

| # | spanish | english | ex (es) | ex (en) | role | slot |
|---|---|---|---|---|---|---|
| D1 | `tengo [número] años` | I am [number] years old | Tengo veinte años. | I am twenty years old. | core | C1sg |
| D2 | `tienes [número] años` | you are [number] years old | ¿Cuántos años tienes? | How old are you? | supporting | C2sg |
| D3 | `tiene [número] años` | is [number] years old | Ella tiene diez años. | She is ten years old. | core | C3sg |
| D4 | `tenemos [número] años` | we are [number] years old | Tenemos treinta años. | We are thirty years old. | supporting | C1pl |
| D5 | `tienen [número] años` | they are [number] years old | Ellos tienen cinco años. | They are five years old. | supporting | C3pl |

Extra: `es:tener`, `en:old`, `en:years`, `grammar:age`, `grammar:be`,
`contrast:tener-anos-vs-to-be` + `contrast:confusable` on D1/D3 (paired with
`b5c13zo3bg soy [algo]`).

### Set E — `tener` obligation · `sense:tener-obligacion`

| # | spanish | english | ex (es) | ex (en) | role | slot |
|---|---|---|---|---|---|---|
| E1 | `tengo que [hacer algo]` | I have to [do something] | Tengo que salir. | I have to leave. | core | C1sg |
| E2 | `tienes que [hacer algo]` | you have to [do something] | Tienes que llamarla. | You have to call her. | core | C2sg |
| E3 | `tiene que [hacer algo]` | has to [do something] | Ella tiene que trabajar. | She has to work. | core | C3sg |
| E4 | `tenemos que [hacer algo]` | we have to [do something] | Tenemos que esperar. | We have to wait. | supporting | C1pl |
| E5 | `tienen que [hacer algo]` | they have to [do something] | Ellos tienen que pagar. | They have to pay. | supporting | C3pl |

Extra: `es:tener`, `en:obligation`, `en:to`, `grammar:modal`,
`construction:followed-by-full-infinitive`, `form:full-infinitive`.
E2 is `core` (not the usual `supporting`) because the paired question frame
`8aej7jfu2y ¿tienes que…?` is already `core`.

### Set F — `ser` + adjective · `sense:ser-caracteristica` — **conditional on JC #4**

| # | spanish | english | ex (es) | ex (en) | role | slot |
|---|---|---|---|---|---|---|
| F1 | `soy [adjetivo]` | I am [adjective] | Soy alto. | I am tall. | core | C1sg |
| F2 | `eres [adjetivo]` | you are [adjective] | Eres muy amable. | You are very kind. | supporting | C2sg |
| F3 | `es [adjetivo]` | is [adjective] | La reunión es importante. | The meeting is important. | core | C3sg |
| F4 | `somos [adjetivo]` | we are [adjective] | Somos puntuales. | We are punctual. | supporting | C1pl |
| F5 | `son [adjetivo]` | they are [adjective] | Ellos son jóvenes. | They are young. | supporting | C3pl |

Extra: `es:ser`, `en:be`, `grammar:ser-adjective`, `grammar:linking-verb-adjective`,
`contrast:ser-adjetivo-vs-estar-adjetivo` on F1/F3 paired with `93wmoiwink`/`zs2vl4oxdq`.

**Totals: 25 rows (A–E), or 30 with F.**

### Retag manifests (no new rows) — `curriculum:concepts:apply`

| target | add |
|---|---|
| the 25 existing `conjugation:present` rows | their `sense:` tag(s) |
| the 12 anchor infinitive rows in §5 marked CONJ | `conjugation:infinitive` + `sense:` |
| every DEFER row in §5 | `sense:` + `conjugation:deferred` |
| `nuo847x66j`, `54mbh87vk1`, `cp5hmttaq2`, `qhznzi6ug8`, `ker7jy3lyb`, `esf7i85ozv`, `g7zuuumnig` | `sense:haber-existencia`, `conjugation:3sg`/`3pl`, `conjugation:present` |
| `89ut7cha5j`, `4w8zmnbknt` | `sense:haber-existencia`, `conjugation:imperfect` (JC #1) |
| `05558aoht5`, `shzp9wzrxq` | `sense:ser-hora`, `conjugation:3pl`, `conjugation:present` |
| `5pzoflm3f4`, `bvjzllj20d`, `jsajob6okd` | `sense:estar-progresivo`, `conjugation:imperfect` (JC #1) |
| `ihsw7a0ggn`, `v7y40xtgb3`, `8aej7jfu2y`, `r30tfgius4`, `43z1s233ya`, `jdd2lebx6x`, `zgny1ugayh` | their sense + person + tense (question frames) |
| the 12 `poder` rows in §4.1 | `sense:poder-*` + person/tense |

### Untag / merge manifests

| script | action | reason |
|---|---|---|
| `curriculum:concepts:untag` | `nuo847x66j` ✕ `es:deber` | mis-tag |
| `curriculum:collections:apply` | MERGE `es:be`→`es:ser`?, `es:have`→`es:tener`?, `es:do`→`es:hacer`?, `es:can`→`es:poder`?, `es:go`→`es:ir`?, `es:get`→? | English words in the Spanish-lemma facet (66 memberships). **Needs review row-by-row** — the mapping is not always 1:1 |
| `curriculum:collections:apply` | MERGE `es:he`,`es:ha`,`es:has`→`es:haber`; `es:son`→`es:ser`; `es:hizo`→`es:hacer`; `es:puedo`→`es:poder`; `es:sea`→`es:ser`; `es:iba`,`es:ibas`→`es:ir`; `es:debe`,`es:debes`,`es:debía`,`es:debería`,`es:deberías`→`es:deber` | finite forms used as lemmas (~20 memberships) |
| `curriculum:collections:apply` | MERGE `es:cuántos`, `es:cuántas` → `es:cuánto` | same class of bug, in the interrogatives topic (§8) |

---

## 7. Discoverability: **(b) primarily, (a) narrowly** — build search first

### Why not "more rows"

The strongest evidence is the authored lessons themselves. `web/data/lessons.json`,
Module 1, lesson 1:

```
explanation: "==hablo== o ==yo hablo== es ==I speak=="
concepts:    hablar (4c0v1mewmv)
```

and lesson 2:

```
explanation: "==quiero== o ==yo quiero== es ==I want=="
concepts:    querer [hacer algo] (df1fa2p3xy)
```

The working practice is **already** "teach the conjugated surface form, tag the
infinitive." `hablo` and `quiero` never needed rows. What they needed — and did
not have — was for the picker to find `hablar` when the author types `hablo`
(returns 0 today) and `querer` when they type `quiero` (returns only the
unrelated `okgrw0eqjz quiero decir → I mean`).

Scaling the row approach to make literal search work means 648 infinitive verb
rows × 5 persons × 4 tenses ≈ 13,000 rows against a catalog of 4,358 — it would
swamp the picker, the `core` tier, and every collection count.

### Why not "smarter search alone"

Rows still do real work that search cannot: they are what `/curriculum?topic=verbs`
displays, what `contrast:` pairs hang on, and the only place a **non-derivable**
English mapping (`tengo veinte años → I am twenty`) can be stated. Search cannot
teach that `voy a` splits two ways.

### The recommendation

**1. Lemma-aware search expansion** (`web/src/app/api/curriculum/concepts/search/route.ts`).
Add `web/src/lib/curriculum/lemma-index.ts`:

- a hand-written irregular table (~150 entries) covering the forms of the ~20
  verbs whose stems change: ser, estar, ir, tener, haber, poder, querer, saber,
  hacer, decir, dar, ver, venir, poner, salir, traer, oír, conocer, pedir, seguir;
- a regular-ending stripper: `-o|-as|-a|-amos|-an|-es|-e|-emos|-en|-imos|-í|-ó|-aste|-aron|-aba|-ía|-ando|-iendo|-ado|-ido|-aré|-ería|…` → candidate stems → re-attach `-ar|-er|-ir`, keep candidates that exist as an `es:` collection name;
- expansion is *additive*: the query becomes `literal OR lemma(token₁) OR lemma(token₂)…`, with literal matches ranked first, so nothing that works today regresses.

Verified target behaviour against real rows:

| typed | today | after |
|---|---|---|
| `hablo` | 0 | `4c0v1mewmv hablar` |
| `quiero` | 1 (wrong: *quiero decir*) | + `df1fa2p3xy querer [hacer algo]`, `w7bu9jslac querer [algo]`, `z3i6f8s1or querer que…` |
| `estoy hablando` | 0 | `f2zryn85p8 estar [haciendo algo]` + `4c0v1mewmv hablar` (+ new A1) |
| `tengo que` | 0 | `7s7vnrgxud tener que [hacer algo]` (+ new E1) |
| `fui` | 0 | `othawv9u0f ser […]`, `2iiyjrogmc ir a [un lugar]` |

**2. Add rows only under the non-derivability rule** (§3) — the 25–30 rows in §6.

**3. Cheap tie-breaker worth doing at the same time:** the picker currently
matches `spanish` and `english` only. Also matching the `exampleSpanish` field
would find `Estoy de acuerdo`, `Es importante hacerlo`, `Voy a pie`, `Hay un
problema` — dozens of conjugated forms already sitting in examples — for the
cost of one `OR` clause. Rank example matches below headword matches.

---

## 8. Sanity check: pronouns / determiners / interrogatives

Bounded pass. Checked each built topic for the pathology verbs showed — a
lemma/form with senses that exist in the catalog but have no row, and rows that
fall outside the topic's own grouping axes.

**Verdict: the silent-drop pathology is specific to verbs, and structurally so.**
Verbs are the only topic where one lemma has *both* many senses *and* many
surface forms. The other three are one-form-per-cell, and the pronoun matrix
already applies the multi-sense principle explicitly (`le → to him / to her /
to it / to you`; `su → his / her / its / their / your`, 10 rows under
`contrast:su-ambiguity`). No sense-completeness failures found.

Findings worth logging, none fixed here:

| topic | rows | finding | severity |
|---|---|---|---|
| pronouns | 172 | 100% carry a `grammar:` subcategory and an `en:` head — structurally clean | — |
| pronouns | 7 | `vi3wxfj3r2`, `w8wzsxl8uq`, `selhft7tbn`, `fz385c053c`, `1e1njdasi9`, `lojl4a497b`, `1g6dssuu7g` — every `se` row — carry **no `es:` lemma tag**. Clicking a Spanish chip cannot trace `se` across the system | low, real |
| determiners | 137 | clean on all three axes (`grammar:`, `es:`, `en:`) | — |
| interrogatives | 21 | clean on all three axes | — |
| interrogatives | 2 | `ynlc19lduf cuántos` and `cd0w4nxkj8 cuántas` are tagged `es:cuántos` / `es:cuántas` — **surface forms used as lemmas**, so the `es:cuánto` chip (4 rows) silently misses *how many*. Exactly the same bug class as `es:he`/`es:ha` on verbs | medium — fix in the `es:` merge batch of §6 |
| interrogatives | 13 | 13 of the 15 `es:qué` rows sit outside `topic:interrogative` (`ojgir22avr ¿qué hora es?`, `erzbzs0gzc ¿a qué hora…?`, `05ugh62h83 ¿Qué te parece…?`, the exclamatives). This appears **deliberate** — the topic is a closed inventory of bare question words and the exclamatives belong to `topic:pronoun` per the pronoun matrix. Confirm, don't fix | informational |

Cross-cutting hygiene found while checking (affects all topics):
`es:be` ×22, `es:have` ×15, `es:do` ×12, `es:can` ×12, `es:get` ×3, `es:go` ×2 —
English headwords living in the Spanish-lemma facet. 47 `es:` collections in
total look like inflections of another `es:` collection (`es:les`/`es:le`,
`es:sus`/`es:su`, `es:todos`/`es:todo`, `es:ellos`/`es:ello`, …) — most of those
are legitimately distinct forms with distinct rows, but they should be reviewed
against a single stated rule for what `es:` means. **`es:` needs a written
definition** ("the dictionary headword, never an inflected form") before the next
topic is built on it; the verb work depends on it more than any prior topic did.

---

## 9. Judgment calls for the user

Each has a recommendation and the tradeoff. Nothing below has been applied.

**1. Tenses — retag the past/future rows that already exist?**
New rows in §6 are present-only, which I am confident about. The open question is
the ~15 existing conjugated rows in other tenses (`89ut7cha5j había → there was`,
`al22a3sck3 pudo`, `o9amfhzn7k podrá`, `gtr8psda9i podría`, `yrb2jzggm4 debería`,
`5pzoflm3f4 estaba [haciendo algo]`, …).
*Recommendation:* **yes** — add `preterite`, `imperfect`, `future`, `conditional`,
`perfect`, `imperative` to `KNOWN_CONJUGATION_VALUES` and retag. Zero new rows;
it makes the facet describe the data instead of an aspiration, and the completeness
audit needs a tense on every person row anyway.
*Tradeoff:* a bigger controlled vocabulary invites future rows in tenses that are
out of teaching scope. Mitigated by the non-derivability rule gating new rows.

**2. `estar`: keep state and location on one shared paradigm, or split into two?**
*Recommendation:* **keep shared**, tagged with both `sense:estar-estado` and
`sense:estar-lugar` on the same 5 rows. The English is identical, the Spanish is
identical, and the learner's actual difficulty is `ser` vs `estar`.
*Tradeoff:* the two anchor rows (`nqyror4j5f`, `obf74hel79`) are `core` and
separately teachable, so a curator might reasonably want separate paradigms and
separate contrast pairs. Splitting costs 5 extra rows and makes `estoy` return
two near-identical picker results.

**3. `ser`: keep identity and classification on one shared paradigm?**
*Recommendation:* **keep shared** (same reasoning as #2 — both are *be + noun*).
*Tradeoff:* none material; this one is low-stakes.

**4. Add Set F (`soy/es [adjetivo]`, 5 rows)?**
*Recommendation:* **yes.** The product brief names `ser`/`estar` → `be` as
problem #1, and the confusion lives in the adjective slot (*es bien* / *está
importante*), not the noun slot. Today `soy [algo] → I am [something]` claims the
territory but its English says "something," i.e. a noun, so the adjective sense
`z2n8811v62` has no truthful conjugated row — a fourth silent drop.
*Tradeoff:* it makes `soy` return two picker results (`soy [algo]`, `soy
[adjetivo]`) where one is currently returned, and it needs the `z2n8811v62` /
`46elg5u15i` near-duplicate resolved first (see #13).

**5. `haber` existential: merge the infinitive-level duplicates into the `hay` rows?**
`6j9mgb7b17 haber [algo] (presente singular) → there is` (supporting) duplicates
`nuo847x66j hay [algo singular] → there is [something singular]` (core).
*Recommendation:* **keep the `hay` family, move the two `haber […] (presente …)`
rows to `trash`.** The `hay` rows are `core`, better-worded, and already have
negative and question frames. Also check whether `es la una → it's one o'clock`
exists for `sense:ser-hora`; if not, add one row (it is the 3sg counterpart of
`05558aoht5 son las [hora]`).
*Tradeoff:* the `haber` anchor for `sense:haber-existencia` then has no
infinitive-shaped row, which breaks audit invariant #1. Either exempt existential
`haber` (it genuinely has no useful infinitive use in this sense) or keep one
anchor row at `reference`. I lean toward the exemption, recorded in the audit spec.

**6. `irse` / pronominal paradigms (`me voy / te vas / se va`)?**
*Recommendation:* **defer to Module 2**, tagged `conjugation:deferred`. *Ya me
voy* is high-frequency, but the row shape needs a clitic slot the current
paradigm design has no column for, and getting it wrong now would create a
second incoherent family.
*Tradeoff:* `me voy` stays unsearchable until then; §7's lemma expansion mitigates
(it resolves `voy` → `ir` and finds `2a5bbtm7cl irse → to leave`).

**7. Schema change vs `sense:` facet?**
*Recommendation:* **facet + auditor, no schema change** (full argument in §2).
*Tradeoff:* integrity is enforced by a test rather than the database, so a manual
`psql` write could break it. Acceptable given `trash`-only deletion and
manifest-only writes are already the workflow.

**8. Build lemma-aware search before or after the row batch?**
*Recommendation:* **before.** It changes how many rows are worth adding, and it
is the actual fix for the recurring "I searched and found nothing" complaint. The
row sets in §6 are correct either way, but a further row-adding pass should not
be planned until search is measured with expansion on.
*Tradeoff:* it is application code (~150 lines + a data table), i.e. a different
kind of work from a curation batch, and delays the visible catalog improvement.

**9. Scope — `poder` by retag only; `hacer`/`querer`/`saber`/`decir`/`ver`/`venir` out?**
*Recommendation:* **yes.** `poder` earns inclusion (product brief #2) but needs
no new rows, only tagging of the 12 rows that already exist. The others are
resolved by lemma expansion and have no non-derivable senses.
*Tradeoff:* if Module 2 turns out to lean on `sé` / `no sé` / `puedo` heavily,
`saber` may need the same treatment; the design extends cleanly.

**10. `es:` facet hygiene — run the merge batch now?**
*Recommendation:* **yes, but split it.** The finite-form merges (`es:he`→`es:haber`
etc., ~20 memberships) and `es:cuántos`/`es:cuántas`→`es:cuánto` are mechanical
and safe. The English-word merges (`es:be`, `es:have`, `es:do`, `es:can`,
`es:go`, `es:get`, 66 memberships) are **not** 1:1 — `es:be` sits on both `ser`
and `estar` rows — and need row-by-row review. Do the safe half now; schedule
the other half.
*Tradeoff:* leaving `es:be` in place means the `es:` facet's definition stays
ambiguous for one more batch.

**11. Confirm the 5-slot person inventory (no `vosotros`; `usted`→3sg, `ustedes`→3pl).**
*Recommendation:* **confirm and write it into `collections.ts`.** It matches the
product brief's Latin American default.
*Tradeoff:* peninsular Spanish learners would be underserved; explicitly a
non-goal today.

**12. Role tiers for the 25–30 new rows: 1sg/3sg `core`, rest `supporting` (with E2 `core`).**
*Recommendation:* **accept**, matching the existing 25 rows. It adds ~12 rows to
the `core` tier (currently 270).
*Tradeoff:* the backlog says "gut the `core` tier using the functional-necessity
test." Every one of these passes that test, but the tier grows ~4%.

**13. Data bugs found in passing — fix in this batch or a separate one?**
- `ft6li4zkws ser [adverbio de frecuencia] [estado]` — a `ser` row whose example is `Ella casi siempre **está** aquí` (uses `estar`). Row or example is wrong.
- `nuo847x66j hay [algo singular]` carries `es:deber`.
- `ooz5w92kjm` and `dtnmnb60nj` — two rows, both `tener que → gotta`.
- `z2n8811v62 ser [una característica]` vs `46elg5u15i ser [adjetivo]` — near-duplicate; blocks Set F until resolved.
- `ihsw7a0ggn ¿vas a [hacer algo]?` / `0lbant78ng vas a [hacer algo]` and `v7y40xtgb3 ¿has [hecho algo]?` / `xffe82pdpg has [hecho algo]` — question frame and declarative as separate rows. Probably correct, but confirm it is the intended pattern before it is replicated across 25 more rows.

*Recommendation:* fix the first three in a small hygiene manifest **before** the
row batch; resolve the fourth as part of the Set F decision (#4); confirm the
fifth as a stated convention.
*Tradeoff:* one extra batch and commit.

---

## 10. Suggested batch order

1. Hygiene: JC #13 fixes + the safe half of the `es:` merges (#10).
2. Code: `sense:` facet + new `conjugation:` values in `collections.ts`; `verbs` spec in `topic-audit.ts` with the four invariants of §4.3.
3. Retag manifests (§6) — every existing sense gets `sense:` + either a paradigm or `conjugation:deferred`. **Run the audit here; it should pass with `estar-progresivo` flagged as incomplete.**
4. Code: lemma-aware search (§7) + example-field matching. Re-measure the five queries in the §7 table.
5. New rows: Sets A–E (+ F if #4 is accepted); contrasts; audit passes clean.
6. Update `topics.ts` verb facet buttons to the `sense:` collections, and rewrite `verb-conjugation-matrix.md` to point here.
