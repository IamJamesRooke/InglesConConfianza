# Cognates plan — 2026-09-05

Read-only research pass. **Nothing in this document has been applied.** No database
write, no code change, no manifest run. Every id, count and gloss below was read
from the live Postgres catalog on 2026-09-05 (4,182 non-trash concepts).

Companion to `verb-organization-plan-2026-09-05.md`; same structure, same
discipline: enumerate every value, argue the schema from evidence, gate new work
behind an explicit non-derivability rule, flag every judgment call.

---

## 1. Executive summary

### The headline finding

**The cognate taxonomy the user is asking for already exists in the database. It
is filed under the wrong facet, split across three redundant tag families, and
only about half of it is reachable from `cognate:`.**

`morphology:suffix-*` has **234 values across 1,061 rows** — larger than the
whole `cognate:` facet. Inside it are three structurally different things that a
single value shape has flattened together:

| what it really is | example values | rows | belongs in |
|---|---|---|---|
| **Spanish↔English suffix swap** (the "trick") | `suffix-cion`+`suffix-tion`, `suffix-ismo`+`suffix-ism`, `suffix-dad`+`suffix-idad`+`suffix-ity`+`suffix-ty` | ~22 signatures | `cognate:` pattern family |
| **English derivational morphology drill** (no Spanish side) | `suffix-ward` (32), `suffix-ish` (23), `suffix-ness` (19), `suffix-less` (16), `suffix-ful` (18), `suffix-hood`, `suffix-ship`, `suffix-dom`, `suffix-est`, `suffix-teen` | ~17 values | stays `morphology:` — correct today |
| **Latin root swap on a Spanish verb** — *the acute gap* | `suffix-ain` (9: obtener→obtain), `suffix-ose` (9: proponer→propose), `suffix-mit` (8), `suffix-fer` (9), `suffix-uce` (7), `suffix-ute` (7), `suffix-uct` (6), `suffix-scribe` (5), `suffix-press` (4), `suffix-cede`/`-ceed` (4), `suffix-eive` (3), `suffix-vert` (3), `suffix-olve` (3), `suffix-gest` (3), `suffix-hibit` (3), `suffix-cur` (2), `suffix-hend` (2) | ~22 values, **124 memberships** | `cognate:<esStem>-to-<enRoot>` |

`obtener → to obtain` tagged `morphology:suffix-ain` is not a suffix fact at all:
`-ain` is not a suffix of *obtener*, and *-tener* is not a suffix of *obtain*. It
is a **root correspondence** (Latin *tenēre* ~ *-tain*) recorded in the only slot
that was available. That misfiling is why the user's `predecir`/`contradecir`
case reads as an import failure: the shape exists and works for `-tener`, and
nobody ever built the `-decir` row of the same table.

### The user's triggering example, verified

```
iuyce294go  predecir [algo] → to predict [something]      reference  cognate: NONE  morphology:prefix, prefix-pre
8ck7889dtr  contradecir a [alguien] → to contradict [somebody]  reference  cognate: NONE  morphology:prefix, prefix-contra
btsojlg7v0  maldecir a [alguien] → to curse [somebody]    reference  cognate: NONE  morphology:prefix, prefix-mal
aw96cncl64  bendecir a [alguien] → to bless [somebody]    reference  cognate: NONE  morphology:prefix, prefix-ben
d587f3ftw9  decir [algo] → to say [something]             core       cognate: NONE  (no morphology at all)
```

Confirmed exactly as reported: the prefix is right, the root is missing, and
**every single member of the `-decir` family carries zero cognate tags** — the
family is invisible. Compare the structurally identical `-tener` family, where 6
of 9 derivatives are tagged and reachable. `cognate:decir-to-dict` does not
exist; `cognate:icto-to-ict` does (6 members: *el conflicto → conflict*, *el
veredicto → verdict*, …) but it is the **noun/adjective** `-icto` spelling
family, a different pattern that will never gather *predecir*.

### The six large legacy values: what they actually encode

Queried row-by-row, not assumed.

| value | n | what it actually is | verdict |
|---|---|---|---|
| `cognate:spelling-pattern` | 777 | **"this row is in the cognate topic at all."** Every row with any real pattern family also carries it (only 10 exceptions). It is not a pattern — it is the topic membership flag. | **(b) → repurpose.** RENAME to `topic:cognate`; it becomes the topic page's `baseCollection` for free. |
| `cognate:true` | 755 | Strict subset of `spelling-pattern` — **zero** rows carry `true` without `spelling-pattern`. Encodes "not a false friend", against a false-friend set of size 2. Carries no information any query can use. | **(b) → retire.** DELETE. The type axis is re-established properly in §2. |
| `cognate:high-frequency` | 181 | A **priority marker**, not a cognate property. Overlaps the role tier almost perfectly in intent (all 811 cognate rows are 679 `reference` / 131 `supporting` / 1 `core`). | **(b) → retire.** DELETE; frequency is `curriculumRole`'s job. |
| `cognate:direct` | 90 | Genuine and useful: the Spanish and English are **the same word modulo a verb ending** — *el director→director*, *el favor→favor*, *controlar→control*, *editar→edit*, *vomitar→vomit*. | **(a)/type.** KEEP, rename `cognate:transparent`. This is one pole of a real *transparency* axis. |
| `cognate:memory-bridge` | 68 | The other pole: the English **cognate exists but is not the natural gloss** — *terminar→to finish* (not *terminate*), *notar→to notice*, *rechazar→to refuse* (*reject*), *liberar→to release* (*liberate*), *la escuela→school* (*scholastic*), *ser difícil→to be difficult*. Pedagogically the highest-value axis in the whole facet. | **(a)/type.** KEEP, rename `cognate:opaque-gloss` — after untagging 10 mis-filed `==>` inflection rows (below). |
| `cognate:word-family` | 60 | **This is the root/etymology axis, unnamed.** Members: *proyectar→project*, *sustraer→subtract*, *deponer→depose*, *proponer→propose*, *distraer→distract*, *comprimir→compress*, *extraer→extract*, *instruir→instruct*, *contener→contain*, *mantener→maintain*. Every member belongs to one of the §3 root families. It says "there is a root family here" without saying **which**. | **(b) → supersede.** DELETE once the named `cognate:<stem>-to-<root>` families of §3 exist; each member gets its actual family. |

Three smaller ones:

| value | n | reading | verdict |
|---|---|---|---|
| `cognate:confusion-set` | 16 | Not a cognate concept — one Spanish word with several competing English glosses (*vivir → live*, *estar disponible → available / free*, *ser diferente → different / unlike*) plus four `el norte ==> el/la norteño/a` derivation rows that are pure misfiles. | **(c) → wrong facet.** MERGE into `contrast:confusable`, which already models exactly this (44 members). |
| `cognate:contextual` | 9 | Same content, 8 of 9 rows overlap `confusion-set`. | **(c)** MERGE into `contrast:confusable`. |
| `cognate:false-friend` | 2 | Only `dciouj17pb mil millones → one billion` and `k55vujgmii un billón → one trillion`. Correct as far as it goes. | **KEEP as a type.** See §5. |
| legacy bare `false friend` | 1 | `17mqfzfrq1 ¿cuál es [algo]? → what is [something]?` — a `cuál`/*which* mis-tag, not a false friend. | **UNTAG**, removes one entry from `LEGACY_COLLECTIONS` (the legacy set is only allowed to shrink — a free win). |

### Data bug found in passing: 36 cognate-tagged rows are not cognate rows

36 of the 811 tagged rows have a `==>` derivation/inflection head. "Spelling
pattern" was read as "any Spanish spelling change":

```
cognate:spelling-pattern  ×22  4ybycrtvck ser grande ==> ser más grande → to be large ==> to be larger
                               3jt1svnphb hacer ==> haciendo → to do ==> doing
                               8yyro9imuk ser feliz ==> la felicidad → to be happy ==> the happiness
cognate:memory-bridge     ×10  w7w8ly9haz ser ==> es → to be ==> is
                               0qlz0zv1z5 tener ==> tiene → to have ==> has
                               sfknobofbx hacer ==> hace → to do ==> does
cognate:confusion-set     × 4  3t1fpmkces el norte ==> el/la norteño/a → the north ==> the northerner
```

`ser ==> es → to be ==> is` under a *cognate* tag is not a cognate claim, it is a
conjugation drill. Full list in §8, untag table U.

### The other half of the honest answer: the surface families are already done

The suffix-transform families are **complete relative to what the catalog
contains**. A detector that applies the full 30-pair suffix table plus verb-stem
matching over all 4,182 rows finds only **23 untagged candidates**, and ~7 of
those are false positives (*llevar → to wear* matched by `ar-to-ar`). The real
completion work is ~15 rows:

```
mente-to-ly   32lecsnkbn pesadamente → heavily · rvx9hh6oh0 poderosamente → powerfully · mfr1ecvufm prácticamente → practically
able-to-able  2afxzimfwm ser memorable · vqbg70cy5y ser invaluable · xi0bobj4sj ser inalcanzable → to be unattainable
ente-to-ent   map0ad7rwe suficiente → sufficient · 7iwln9ycmm la corriente → current · 7mjxt0orjk el presente → the present
al            64zpt713l1 ser sentimental · 0utix246nk ser visual
ecto-to-ect   9sfglbvskv ser incorrecto → to be incorrect
uro-ura-to-ure 0n9qw60q58 el futuro → the future
dad-to-ty     m0woso3bh0 la ciudad → city · xxxqpliz9z la responsabilidad → responsibility · 92y2a0e1y5 la hermandad → fraternity
ma-to-m       tb4pl8tpv6 la firma → firm
```

**So "the import went bad" is precise and narrow: the surface axis imported
well; the root axis did not import at all, and the type axis collapsed into a
constant.**

### Recommended shape of the fix — four moves, in dependency order

1. **Registry + audit first** (code, zero rows): `KNOWN_COGNATE_VALUES` in
   `collections.ts` wired through the existing `assertKnownValues()` helper, and
   a bespoke `scripts/audit-cognates.ts` (§2.3 argues why bespoke, not
   `TOPIC_AUDIT_SPECS`).
2. **Collection surgery** (`curriculum:collections:apply`, zero new rows):
   retire `true` / `high-frequency` / `word-family`, rename
   `spelling-pattern`→`topic:cognate`, `direct`→`transparent`,
   `memory-bridge`→`opaque-gloss`, `al`→`al-to-al`; merge `confusion-set` and
   `contextual` into `contrast:confusable`; untag the 36 `==>` rows.
3. **Promote the root families** (`curriculum:concepts:apply`): 124 memberships
   already sitting in `morphology:suffix-<enRoot>` become 22 named
   `cognate:<esStem>-to-<enRoot>` collections. This is where the user's ask is
   answered, and it costs **zero new rows**.
4. **Author the holes**: the `-decir` family (5 memberships, 0 new rows), plus
   ~10 false-friend contrast pairs (§5), plus the 15 suffix stragglers above.

---

## 2. Schema verdict, argued from evidence

### 2.1 Does `cognate:` need a controlled vocabulary? — **Yes, unambiguously.**

`grammar:`, `conjugation:` and `sense:` each have one; `cognate:` does not, and
the consequences are visible in the data:

- **Naming is already inconsistent.** 22 of 38 values use the `<es>-to-<en>`
  shape (`cion-to-tion`). Three do not: `cognate:al` (13 members — should be
  `al-to-al`), `cognate:sis-to-sis`, `cognate:ar-to-ar` (fine, but only by luck
  — the shape allows both). Nothing would have rejected `cognate:al`.
- **Duplicate axes went unnoticed.** `true` (755) and `spelling-pattern` (777)
  are the same set minus 22 rows. A registry review would have caught that the
  day the second one was added.
- **Type and pattern are already colliding in one namespace** (see 2.2).
- **The failure mode is exactly `sense:`'s.** The verb plan's argument — "what
  tags lack is not expressiveness but *enforcement*" — applies verbatim, and the
  reusable mechanism (`assertKnownValues()` in
  `tests/curriculum-database.test.ts`, lines 23–45) already exists and already
  rejects both unknown values *and* stale registry entries no concept carries.

Proposed initial `KNOWN_COGNATE_VALUES` — 3 type values + ~24 surface families +
~22 root families ≈ **49 entries**. Larger than `KNOWN_CONJUGATION_VALUES` (10),
smaller than `KNOWN_GRAMMAR_VALUES` (~230). Comfortably in range.

### 2.2 Does it need a second facet to split *type* from *pattern family*? — **No. One facet, two disjoint value classes, enforced by the auditor.**

The crux question, tested against the real ambiguous cases:

> Is there a row that must carry a *type* and a *pattern family* that are not
> derivable from one another, such that one namespace loses information?

Yes, and they are common:

```
a12miruf57  estar disponible → to be available
            pattern cognate:able-to-able · type transparent · ALSO confusable (→ "to be free")
or5vrih2lk  ser sensible → to be sensitive
            pattern cognate:able-to-able · type FALSE FRIEND (English "sensible" ≠ sensible)
ksmdrxloop  ser difícil → to be difficult
            pattern (none — difícil/difficult is not a suffix swap) · type opaque-gloss
1nm2wdol3n  terminar → to finish
            pattern cognate:verb-stem (terminar→terminate) · type opaque-gloss
```

`ser sensible` is the decisive one: it is simultaneously a textbook `-ible→-ible`
pattern member *and* a textbook false friend. Any design where "false friend"
displaces the pattern tag loses the pattern; any design where the pattern
displaces the type loses the warning. **Both must be expressible on one row.**

But that does not require a second facet, because a facet in this codebase is
just a namespace prefix and collection membership is many-to-many. Two disjoint
*value classes* inside `cognate:` carry the same information:

| class | values | cardinality per row | example |
|---|---|---|---|
| **type** | `transparent`, `opaque-gloss`, `false-friend` | 0 or 1 | `cognate:false-friend` |
| **pattern** | `<es>-to-<en>` suffix families + `<esStem>-to-<enRoot>` root families + `verb-stem` | 0..n | `cognate:ible-to-ible` |

Weighed against a real second facet (`cognate-type:` / `cognate:`):

| | one facet, two classes (recommended) | two facets |
|---|---|---|
| registry cost | one `KNOWN_COGNATE_VALUES`, one `assertKnownValues` line | second `CollectionFacet` union member, second registry set, second test line |
| topic page | one `baseCollection`, facet buttons draw from both classes uniformly | facet buttons must span two prefixes — no existing topic does this |
| "is this a type or a pattern?" | derived by set membership, checked by the auditor | derived by prefix |
| risk | a curator invents `cognate:partial` and it lands in neither class | same risk, one namespace deeper |

The distinguishing argument is the topic page. All four existing topics
(`topics.ts`) resolve their facet buttons as **plain collection names against one
`baseCollection`**. A second facet buys prefix-level tidiness and costs the
uniformity that makes `facetButtons` a flat `{collection, label}` list. Not
worth it for a 3-value class.

**One deliberate omission: no `cognate:partial`.** The brief floats
true/false/partial. Tested against the data, "partial" has no stable referent:
`t8xl5ujrhi introducir → to introduce` (Spanish *introducir* mostly means
*insert*), `l99hc4crr3 ignorar → to ignore` (Spanish also means *to not know*),
`0l9aed93ze aplicar → to apply` (not for jobs) are each **one sense true, one
sense false**, and the catalog already splits senses into separate rows. The
right model is per-row: the cognate sense is `transparent`, the trap sense is
`false-friend`, and they are joined by a `contrast:` pair. A `partial` value
would let a curator dodge the split. See JC #7.

### 2.3 `TOPIC_AUDIT_SPECS` or a bespoke checker? — **Bespoke, `scripts/audit-cognates.ts`.**

`topic-audit.ts` is a good fit for a topic that is a **closed inventory of
meanings**: it enumerates `englishTargets` ("every pronoun must be reachable"),
requires one `grammar:` subcategory per row, and checks the head word appears in
the example. Cognates fail all three premises:

- **No `englishTargets` exist.** Pronouns have 60 cells that must all be filled.
  Cognates are an open class — "every English word with a Spanish cognate" is not
  a list anyone can close, and inventing one would produce permanent false
  failures.
- **The subcategory regex is the wrong shape.** `subcategory` asserts *exactly
  one grammar family per row*; cognate rows carry **0..n patterns and 0..1
  types**, and the check that matters is a *class* check (a row must not carry
  two type values) which `TopicAuditSpec` cannot express.
- **The invariants that matter are per-collection, not per-row** — minimum family
  size, no pattern family without a corresponding `morphology:` pair, no orphan
  root family. `TopicAuditSpec.extraChecks` receives `ConceptRow[]` and could
  technically host these, but that is the escape hatch, not the shape.

`audit-verb-conjugation.ts` is the right precedent: a standalone script that
loads every row carrying the facet, groups by collection, and asserts structural
invariants — with named exemption sets (`NO_ANCHOR_REQUIRED`, `IMPERSONAL_ONLY`)
for the honest special cases. Proposed invariants:

1. **At most one type value per row.** (`transparent` xor `opaque-gloss` xor
   `false-friend` — they are mutually exclusive claims about the same gloss.)
2. **Every pattern family has ≥3 members**, or is listed in a
   `SEEDED_FAMILIES` exemption set with a written reason. Kills the one-off tags
   that `cognate:arte-to-art` (3) sits right at the edge of.
3. **Every `<es>-to-<en>` suffix family's members actually end in `<es>`** on the
   Spanish side (after stripping `el/la/un/una` and `ser/estar`) **and `<en>` on
   the English side** (after stripping `to`/`to be`/`the`/`a`). This is the check
   that would have caught `zdz3qzzhev ser parecido → to be similar` sitting in
   `cognate:ar-to-ar`, and `j6008tp8dx consignar → to transfer` in the `-fer`
   family.
4. **Every root family's members share the Spanish stem.** Catches
   `3lzsofawpo explicar → to explain` currently filed under `morphology:suffix-ain`
   (it is *plicare*, not *tenēre*).
5. **No row carries a `cognate:` tag and a `==>` head.** The 36-row bug class.
6. **Every `cognate:false-friend` row is a member of ≥1 `contrast:` pair.** A
   false friend with nothing to contrast against teaches nothing (§5).

### 2.4 No schema change

Same conclusion as the verb plan, same reasoning, and the case is weaker here:
cognate membership is a pure many-to-many tag with no ordering, no anchor row, no
completeness requirement. A collection is the natural representation. The one
thing a column would buy — "the English cognate word for this row, even when it
is not the gloss" (*terminar* → *terminate*) — is better served by an `en:`
membership than a column, and is deferred (JC #10).

---

## 3. Root / etymology cognate families

### 3.1 The gating rule

Adapted from the verb plan's §3 non-derivability rule:

> **A root family earns its own `cognate:` value only when the English cognate
> is NOT recoverable by stripping the Spanish verb ending.**

- `visitar → to visit`, `formar → to form`, `insistir → to insist`,
  `aceptar → to accept`, `detectar → to detect`, `funcionar → to function`,
  `justificar → to justify`, `especializar → to specialize`, `definir → to define`,
  `restaurar → to restore`, `importar → to import` — **derivable.** Drop `-ar/-er/-ir`
  and the stem *is* the English word. These are **one** family, `cognate:verb-stem`,
  not eleven. They currently occupy eleven `morphology:suffix-*` values
  (`it`, `rm`, `ist`, `pt`, `ect`, `ion`, `ify`, `ize`, `ine`, `ore`, `rt`) —
  the single largest source of taxonomy inflation in the facet.
- `obtener → to obtain`, `proponer → to propose`, `predecir → to predict`,
  `atraer → to attract`, `comprimir → to compress` — **not derivable.** *-tener*
  and *-tain* share no useful letters; the learner must be told the root maps.
  **These earn a family each.**

### 3.2 The families — every candidate, with real membership

Counted over non-trash rows. "Tagged" = already carries any `cognate:` value.
"Untagged derivatives" counts **prefixed derivatives only** (see the scope note
below).

| recommended value | Spanish stem | English root | catalog members | untagged | phase |
|---|---|---|---|---|---|
| `cognate:tener-to-tain` | `-tener` | `-tain` | 15 derivatives (9 tagged) | 9 | **1** |
| `cognate:poner-to-pose` | `-poner` | `-pose` | 10 derivatives (9 tagged) | 4 | **1** |
| `cognate:mitir-to-mit` | `-mitir`/`-meter` | `-mit` | 9 (8 tagged) | 3 | **1** |
| `cognate:ferir-to-fer` | `-ferir`/`-frir` | `-fer` | 9 (8 tagged) | 1 | **1** |
| `cognate:ducir-to-duce` | `-ducir` | `-duce`/`-duct` | 7 (7 tagged) | 1 | **1** |
| `cognate:tribuir-to-tribute` | `-tribuir` | `-tribute` | 7 (6 tagged) | 1 | **1** |
| `cognate:struir-to-struct` | `-struir` | `-struct` | 6 (5 tagged) | 1 | **1** |
| `cognate:traer-to-tract` | `-traer` | `-tract` | 5 (5 tagged) | 0 | **1** |
| `cognate:escribir-to-scribe` | `-scribir` | `-scribe` | 5 (5 tagged) | 0 | **1** |
| `cognate:cluir-to-clude` | `-cluir` | `-clude` | 5 (3 tagged) | 0 | **1** |
| `cognate:decir-to-dict` | `-decir` | `-dict` | **5 (0 tagged)** | **5** | **1 — the reported gap** |
| `cognate:ceder-to-cede` | `-ceder` | `-cede`/`-ceed` | 4 (4 tagged) | 0 | **1** |
| `cognate:primir-to-press` | `-primir` | `-press` | 4 (4 tagged) | 0 | **1** |
| `cognate:vertir-to-vert` | `-vertir` | `-vert` | 4 (3 tagged) | 1 | **1** |
| `cognate:servar-to-serve` | `-servar` | `-serve` | 4 (4 tagged) | 0 | **1** |
| `cognate:solver-to-solve` | `-solver` | `-solve` | 3 (3 tagged) | 0 | **1** |
| `cognate:gerir-to-gest` | `-gerir` | `-gest` | 4 (3 tagged) | 1 | **1** |
| `cognate:hibir-to-hibit` | `-hibir` | `-hibit` | 3 (3 tagged) | 0 | **1** |
| `cognate:cibir-to-ceive` | `-cibir` | `-ceive` | 3 (3 tagged) | 0 | **1** |
| `cognate:plicar-to-ply` | `-plicar` | `-ply`/`-plic` | 4 (3 tagged) | 0 | **1** |
| `cognate:currir-to-cur` | `-currir` | `-cur` | 2 (2 tagged) | 0 | 1, exempt from min-3 |
| `cognate:hender-to-hend` | `-hender` | `-hend` | 2 (2 tagged) | 0 | 1, exempt from min-3 |
| `cognate:sistir-to-sist` | `-sistir` | `-sist` | 5 (5 tagged) | 0 | **2 — borderline derivable** |
| `cognate:seguir-to-sequ` | `-seguir` | `-secut`/`-sequ` | 11 rows, **0 tagged** | 11 | **2 — no cognate gloss in catalog** |
| `cognate:vencer-to-vinc` | `-vencer` | `-vinc` | 3 rows, **0 tagged** | 3 | **2 — `convencer → to convince` is ABSENT** |
| `cognate:volver-to-volve` | `-volver` | `-volve` | 5 rows, 0 tagged | 5 | **2** |
| `cognate:tender-to-tend` | `-tender` | `-tend` | 4 rows, 1 tagged | 3 | **2** |
| `cognate:sumir-to-sume` | `-sumir` | `-sume` | 2 rows, 0 tagged | 2 | **2** |
| `cognate:fundir-to-fuse` | `-fundir` | `-fuse` | 1 row | 0 | **defer — below min-3** |
| `cognate:venir-to-vene` | `-venir` | `-vene`/`-vent` | **0 derivatives** | — | **DEFER — see below** |
| `cognate:hacer-to-fact` | `hacer` | `fact-`/`-fect`/`-fic` | 0 derivatives with a cognate gloss | — | **DEFER** |

**Two corrections to the brief's assumed list, verified by query:**

- **`venir → vene/vent` has no members.** `prevenir`, `convenir`, `intervenir`,
  `provenir`, `sobrevenir` are **all absent** from the catalog. The 12 `venir`
  rows are all bare-verb complement frames (`venir a [un lugar] → to come to`).
  Nothing to gather; a `cognate:venir-to-vene` family would have zero members.
  Defer until the derivatives are authored.
- **`vencer → vinc` has three members but no cognate gloss.** The catalog has
  `sk978mgwus convencer a [alguien] de [hacer algo] → to talk [somebody] into`
  and two siblings — **`convencer → to convince` does not exist as a row.** The
  family is unteachable until that row is authored. Same shape for
  `seguir`: 11 rows, all glossed *get* / *follow* / *manage to*, and
  `perseguir → to pursue/persecute` is absent.

Also confirmed absent, i.e. genuine catalog gaps rather than tagging gaps:
`adscribir`, `proscribir`, `circunscribir`, `yuxtaponer`, `descomponer`,
`retraer`, `abstraer`, `detraer`, `interceder`, `suceder`, `retroceder`,
`revolver`, `envolver`, `desenvolver`.

### 3.3 The scope note that keeps the families honest

A root family's members are **prefixed derivatives plus one anchor**, never the
base verb's complement frames.

`cognate:poner-to-pose` gathers `4fc2kcqip3 proponer → to propose`,
`qta6ei3b67 componer → to compose`, `mt3fyxp4nv exponer → to expose` — and the
bare-lemma anchor `rtsiqg8t58 poner [algo] [en algún lugar] → to put`, which is
what makes the family findable from *poner*. It does **not** gather
`dtodl04vtu poner [algo] en práctica → to put into practice`,
`xy9ovfmmwc poner la mesa → to set the table`, or the other 14 `poner`
complement frames. Without this rule the naive query returns 25 "members" for
`poner`, 28 for `tener` and 13 for `hacer` — almost all of them noise, because
the English side (*put*, *keep*, *make*) is not the cognate at all.

**Anchor convention:** exactly one row per family carries the family tag *and*
is the bare Spanish lemma. It is tagged `cognate:opaque-gloss` (its own English
— *put*, *say*, *bring* — is deliberately not the cognate), which is precisely
the teaching point: *decir* looks nothing like *dict*, and that is why the family
needs a tag.

---

## 4. Bounded first pass — what to tag NOW, what to defer

### 4.1 The prioritisation rule

> **Tag now what is invisible without a tag. Defer what a learner can see.**

Applied:

| priority | class | why | rows |
|---|---|---|---|
| **P0** | Retire / rename the 6 legacy values; untag the 36 `==>` rows | Zero new rows; unblocks everything else; the taxonomy cannot be audited until `true`/`spelling-pattern` stop being noise | 0 new, ~1,900 membership changes (mechanical, one `collections:apply`) |
| **P1** | Promote the 22 phase-1 root families from `morphology:suffix-*` | **The acute gap.** Invisible without tagging, high pedagogical value, and the memberships already exist — this is a re-file, not a judgment call, for 124 of 129 rows | 0 new rows, **129 memberships** |
| **P1** | The `-decir` family | The reported bug; 5 rows, all currently untagged | 0 new rows, 5 memberships |
| **P2** | 15 suffix-family stragglers (§1) | Real but small; the families are otherwise complete | 0 new rows, 15 memberships |
| **P2** | False friends (§5) | Genuinely high-value, but mostly a **row-authoring** job — 34 of 60 probed headwords are absent | ~10 memberships + ~8 new rows |
| **DEFER** | `cognate:verb-stem` bulk tag (~90 rows across 11 collapsed `morphology:suffix-*` values) | Derivable by rule; one family, not eleven; better as a taught rule than 90 tags | — |
| **DEFER** | `seguir`, `vencer`, `volver`, `tender`, `sumir` root families | Need new rows first (`convencer → to convince`, `perseguir → to pursue`) — authoring, not tagging | — |
| **DEFER** | `venir`, `hacer` root families | Zero eligible members today | — |
| **DEFER** | The ~34 English-only `morphology:` values (`-ward`, `-ish`, `-ness`, `-less`, `-ful`, `-hood`, `-ship`, `-dom`, `-est`, `-teen`) | Correctly filed already. Not cognate patterns. **Leave alone.** | — |
| **DEFER** | Deduplicating the triple-tag `morphology:suffix-<es>` + `suffix-<en>` + `<en>` scheme (e.g. `dad`+`idad`+`ity`+`ty` on the same 15 rows) | Real redundancy, but it is `morphology:`'s problem, and touching it in the same batch would make the cognate diff unreviewable | — |

### 4.2 Concrete phase-1 count

- **New concept rows: 0** (P0 + P1). Every phase-1 membership targets a row that
  already exists.
- **Membership additions: ~149** — 124 root-family promotions + 5 `-decir` +
  ~5 anchors + 15 suffix stragglers.
- **Membership removals: ~1,900** — `cognate:true` (755),
  `cognate:high-frequency` (181), `cognate:word-family` (60), the 36 `==>`
  untags, `confusion-set`/`contextual` merges (25). All via
  `curriculum:collections:apply DELETE`/`MERGE`, which is one reviewable line per
  collection, not 1,900 rows of TSV.
- **Renames: 4** (`spelling-pattern`→`topic:cognate`, `direct`→`transparent`,
  `memory-bridge`→`opaque-gloss`, `al`→`al-to-al`).
- **Registry: ~49 `KNOWN_COGNATE_VALUES` entries**, one new audit script.

Net effect on the facet: **38 values → ~49 values, 2,233 memberships → ~1,300**,
and every remaining value means one specific thing.

---

## 5. False friends — recommendation: **both, and `contrast:` is the load-bearing half**

### 5.1 What the level-appropriate list actually looks like against this catalog

Probed 60 classic Spanish↔English false friends. Result: **26 present, 34
absent.** The absent ones include most of the canonical set —
`embarazada`, `actualmente`, `campo`, `sopa`, `librería`, `asistir`, `realizar`,
`pretender`, `soportar`, `carpeta`, `fábrica`, `simpático`, `educado`,
`colegio`, `carta`, `vaso`, `constipado`, `grabar`, `remover`, `parientes`,
`idioma`, `salado`, `compromiso`, `atender`, `dependiente`, `emocionante`,
`policía`, `suceso`, `tópico`.

**So false friends are chiefly a row-authoring gap, not a tagging gap.** Tagging
alone cannot deliver the topic.

What *is* already present and tag-able today:

| id | row | the trap | recommended |
|---|---|---|---|
| `or5vrih2lk` | `ser sensible → to be sensitive` | English *sensible* = *sensato* | `cognate:false-friend` + `contrast:sensible-vs-sensible` |
| `iswcllbips` | `la dirección → address` | vs `btcf40lgg6 la dirección → direction` | `contrast:direccion-address-vs-direction` + `contrast:confusable` |
| `t7i1q6sopk` | `el éxito → success` | English *exit* = *la salida* | `cognate:false-friend` + `contrast:exito-vs-exit` |
| `k55vujgmii` / `dciouj17pb` | `un billón → one trillion` / `mil millones → one billion` | already tagged `cognate:false-friend` | keep; add `contrast:billon-vs-billion` |
| `t8xl5ujrhi` | `introducir → to introduce` | Spanish *introducir* usually = *to insert* | `cognate:false-friend` — **and split the sense** (JC #7) |
| `l99hc4crr3` | `ignorar → to ignore` | Spanish *ignorar* also = *to be unaware of* | `cognate:false-friend` + sense split |
| `0l9aed93ze` | `aplicar → to apply` | Spanish *aplicar* ≠ apply for a job | `cognate:false-friend` + sense split |
| `v1a7c89j32` | `ser largo → to be long` | English *large* = *grande* | `contrast:largo-vs-large` |
| `nuuwniplla` | `último/a → last` | English *ultimate* = *definitivo* | `contrast:ultimo-vs-ultimate` |
| `sp9vpwtyfk` | `antiguo/a → old` | English *antique* = *antigüedad* | `contrast:antiguo-vs-antique` |
| `6gh8d3gw7b` | `leer ==> la lectura → the reading` | English *lecture* = *la conferencia* | `contrast:lectura-vs-lecture` |
| `nkl9jukruz` | `discutir [algo] → to discuss [something]` | **the row's own gloss is the trap** — Spanish *discutir* leans *to argue* | **data bug**, JC #12 |

### 5.2 The recommendation

**A false friend is modelled as a `contrast:` pair; `cognate:false-friend` is the
type marker that makes it findable from the Cognates topic.** Both, with
`contrast:` doing the work.

Why `contrast:` is load-bearing:

- The project already models exactly this. `contrast:su-ambiguity` (10 members),
  `contrast:soy-vs-estoy` (2), `contrast:tener-anos-vs-to-be` (2),
  `contrast:tu-vs-tu-tilde` (2) — the established pattern is *a named pair plus
  `contrast:confusable`*, and every built topic surfaces it as a "Confusions"
  facet button.
- A false friend is **information about two words**, not one. `ser sensible →
  sensitive` alone teaches nothing; the lesson is *sensible ≠ sensible, English
  sensible is Spanish sensato*. A flat `cognate:false-friend` tag on one row
  cannot express the second half. That is precisely why the existing
  `cognate:confusion-set` (16) is being folded into `contrast:confusable` in §1.
- The audit invariant #6 (§2.3) enforces it: **every `cognate:false-friend` row
  must belong to ≥1 `contrast:` collection.** A false friend with nothing to
  contrast against is a curation error, and the auditor should say so.

Why `cognate:false-friend` still earns its place: it is the **type** value that
answers "show me every false friend" from the topic page in one query, without
walking `contrast:`'s 20 unrelated values. It is the negative pole of the
`transparent` / `opaque-gloss` / `false-friend` axis, and dropping it would leave
that axis with no bad news in it.

**Phase-1 scope for false friends: the 11 tag-able rows above + 3 new rows**
(`ser sensato → to be sensible`, `la salida → exit`, `la conferencia → lecture`)
so the contrast pairs have a second half. Authoring the other ~34 absent
headwords is a separate, larger batch — flagged, not scoped here (JC #11).

---

## 6. Detection at scale — the script exists; here is what it found

Written and run read-only for this pass (`web/.cscratch/`, deleted). No writes.

### 6.1 Method

Per row: extract a Spanish head (strip `[…]` placeholders, leading
`el/la/los/las/un/una`, leading `ser/estar/tener/hacer`, punctuation, accents)
and an English head (strip `to be`/`to`/`the`/`a`), then score with four
strategies in descending confidence:

1. **identical** after normalisation (`memorable` = `memorable`) — conf 3
2. **suffix-pair table**, 30 pairs (`ción→tion`, `mente→ly`, `tud→tude`, …);
   exact match conf 3, edit distance ≤1 conf 2
3. **verb-stem**: strip `-ar/-er/-ir(se)`, accept stem / stem+`e` / stem+`ate` —
   conf 3, ≤1 edit conf 2
4. **consonant skeleton** (drop vowels + h/y, collapse doubles) equal — conf 2;
   ≤1 edit — conf 1
5. **raw Levenshtein ≤2** on words ≥6 chars — conf 1

### 6.2 Measured result

```
rows scanned (parsable heads)                          3,690 of 4,182
flagged as cognate-looking                               680
  of which already carry a cognate: tag                  609
NEW candidates (flagged, no cognate: tag)                 71
    conf 3: 15    conf 2: 39    conf 1: 17
recall against the existing tagged set          609 of 811 (75%)
```

### 6.3 What the numbers mean — the honest reading

**The surface axis is ~90% saturated.** 609 of 680 string-similar rows are
already tagged, and only 15 high-confidence candidates are new (`j48zuk79f7 la
persona → person`, `2afxzimfwm ser memorable`, `7mjxt0orjk el presente → the
present`, `0n9qw60q58 el futuro → the future`, `9sfglbvskv ser incorrecto`, …).
There is no large hidden reservoir of untagged surface cognates. **A
string-similarity sweep is not where the value is.**

**And the 25% recall miss is the whole point.** The 202 tagged rows the detector
*fails* to flag are exactly the ones worth tagging by hand: *terminar → to
finish*, *rechazar → to refuse*, *la escuela → school*, *ser difícil → to be
difficult* — the `opaque-gloss` set, where surface similarity is low by
definition. Likewise the root families: `iuyce294go predecir → to predict` and
`8ck7889dtr contradecir → to contradict` surface only at **conf 1**, mixed in
with noise like `uo22ci75zg el primero → the former` and `1x5p74ftvn durante →
during`.

**Conclusion — the strategy recommendation.** String similarity is
*structurally* the wrong tool for the two axes that matter, because both are
defined by *absence* of surface similarity. Use it as a **completeness check**
(the 23-candidate sweep of §1 that proved the suffix families are done), not as a
discovery engine. Discovery for root families comes from a **hand-written
`ROOT_TABLE`** — Spanish stem regex + English root regex, ~30 entries — which is
what produced §3's table and is precise where the fuzzy matcher is not. That
table belongs in the audit script, not in a throwaway: it is the mechanism that
makes the next `-decir`-shaped gap *fail an audit* instead of waiting for a user
to notice.

---

## 7. The Cognates topic page

### 7.1 Data model

```ts
{
  slug: "cognates",
  title: "Cognates",
  description:
    "Words Spanish and English share. Most of them convert by rule — -ción becomes -tion, " +
    "-mente becomes -ly — and a smaller set share a Latin root that has drifted apart: " +
    "decir and predict, tener and contain. And a few look identical and mean something else.",
  baseCollection: "topic:cognate",
  facetButtons: [ /* see 7.2 */ ],
}
```

`baseCollection: "topic:cognate"` costs **zero new memberships**: it is
`cognate:spelling-pattern` renamed (777 rows), minus the 22 `==>` untags, plus
~34 stragglers. That single rename is the cheapest topic base in the project —
`pos:verb` had to be reused; pronouns and determiners each needed a bulk apply.

### 7.2 Facet buttons — the tier that fits, and the honest UI flag

The other four topics carry 4–16 buttons. Cognates will have **~49 values**. A
flat row of 49 buttons is not a topic page, it is a wall.

Recommended: **9 buttons in `topics.ts`**, chosen as the level at which a learner
actually navigates.

| button | collection | n after phase 1 |
|---|---|---|
| Identical | `cognate:transparent` | ~90 |
| Looks different | `cognate:opaque-gloss` | ~58 |
| False friends | `cognate:false-friend` | ~11 |
| -ción → -tion | `cognate:cion-to-tion` | 16 |
| -mente → -ly | `cognate:mente-to-ly` | 21 |
| -ico → -ic | `cognate:ico-to-ic` | 13 |
| -dad → -ty | `cognate:dad-to-ty` | ~18 |
| Latin roots | *(see below)* | ~129 |
| Confusions | `contrast:confusable` | ~69 |

The remaining ~40 pattern families are reachable the way every other collection
in this catalog is reachable — by clicking a row's collection chip, and via
`/curriculum?collection=cognate:tener-to-tain`.

**"Latin roots" needs one decision.** There is no collection today that means
"member of some root family". Two options: (a) tag all 129 root-family rows with
a shared `cognate:latin-root` umbrella alongside their specific family — one
extra membership per row, no code change; (b) extend `CurriculumTopic` with an
optional `facetGroups` so a button can expand into a sub-list of collections.
**Recommend (a) for phase 1** — it is data, matches how every existing button
works, and defers the UI question until there is evidence anyone wants the
sub-list. This is JC #9.

**UI concern, flagged and deliberately out of scope:** at ~49 values the flat
`facetButtons` array is at the end of its useful life. A grouped or searchable
facet list is the eventual answer. It should be driven by a second topic hitting
the same wall, not by this one — and nothing in the data model above forecloses
it, since `facetButtons` stays a plain `{collection, label}[]` either way.

---

## 8. Phase-1 tables (TSV-ready)

Column order per `docs/curation/README.md`:
`curriculum:concepts:apply` = `concept-id · spanish · english · role · |-collections-to-add · reason`;
`curriculum:concepts:untag` = `concept-id · collection-name · reason`;
`curriculum:collections:apply` = `DELETE|MERGE|RENAME · from · [into/to] · reason`.

### Table C — collection surgery (`curriculum:collections:apply`), 11 lines

| op | from | into/to | reason |
|---|---|---|---|
| RENAME | `cognate:spelling-pattern` | `topic:cognate` | 777 members; it is topic membership, not a pattern — becomes the topic page's baseCollection |
| DELETE | `cognate:true` | — | 755 members, strict subset of `spelling-pattern` (0 rows carry it alone); no information |
| DELETE | `cognate:high-frequency` | — | 181 members; frequency is `curriculumRole`'s job, not a cognate property |
| DELETE | `cognate:word-family` | — | 60 members; superseded by the named root families of §3, each of which says *which* family |
| RENAME | `cognate:direct` | `cognate:transparent` | 90 members; keep as the positive pole of the type axis, named for what it asserts |
| RENAME | `cognate:memory-bridge` | `cognate:opaque-gloss` | 68 members; keep as the type value for "the cognate exists but is not the gloss" |
| RENAME | `cognate:al` | `cognate:al-to-al` | 13 members; only value violating the `<es>-to-<en>` shape |
| MERGE | `cognate:confusion-set` | `contrast:confusable` | 16 members; multiple competing English glosses is `contrast:`'s job |
| MERGE | `cognate:contextual` | `contrast:confusable` | 9 members, 8 of them already in `confusion-set` |
| DELETE | `false friend` (legacy, bare) | — | 1 member, and it is a mis-tag (see Table U); shrinks `LEGACY_COLLECTIONS` by one |
| RENAME | `cognate:icto-to-ict` | *(keep as-is)* | listed only to record that it is the **noun** `-icto` family and must not be confused with `cognate:decir-to-dict` |

### Table U — untag (`curriculum:concepts:untag`), 37 lines

The 36 `==>` rows plus the legacy false-friend mis-tag. All reason: *"a `==>`
derivation/inflection row, not a cognate — `cognate:` was used as a generic
'spelling changes here' marker."*

| concept-id | collection-name | row |
|---|---|---|
| `4ybycrtvck` | `cognate:spelling-pattern` | ser grande ==> ser más grande |
| `loc2s7jjrm` | `cognate:spelling-pattern` | ser grande ==> ser el/la más grande |
| `ntdw54v6qp` | `cognate:spelling-pattern` | ser grande ==> ser más grande (big) |
| `tnl1yimmyb` | `cognate:spelling-pattern` | ser grande ==> ser el/la más grande (big) |
| `7q3idfw27t` | `cognate:spelling-pattern` | ser seguro/a ==> ser más seguro/a |
| `d4nhp6of4q` | `cognate:spelling-pattern` | ser seguro/a ==> ser el/la más seguro/a |
| `8tlubdz2jb` | `cognate:spelling-pattern` | ser gracioso/a ==> ser más gracioso/a |
| `r6af4026y9` | `cognate:spelling-pattern` | ser gracioso/a ==> ser el/la más gracioso/a |
| `y6m6lbi7x1` | `cognate:spelling-pattern` | ser feliz ==> ser más feliz |
| `f1hip5yar5` | `cognate:spelling-pattern` | ser feliz ==> ser el/la más feliz |
| `wtxe2yjp1j` | `cognate:spelling-pattern` | ser fácil ==> ser más fácil |
| `8f830wa18p` | `cognate:spelling-pattern` | ser fácil ==> ser el/la más fácil |
| `tnwlnfg2vy` | `cognate:spelling-pattern` | ser blanco/a ==> ser blanquecino/a |
| `7d2jip4ahu` | `cognate:spelling-pattern` | ser blanco/a ==> la blancura |
| `wqfpw1yjuw` | `cognate:spelling-pattern` | la belleza ==> ser bello/a |
| `8yyro9imuk` | `cognate:spelling-pattern` | ser feliz ==> la felicidad |
| `i4dsmvl6mo` | `cognate:spelling-pattern` | ser probable ==> probablemente |
| `3a98t443ht` | `cognate:spelling-pattern` | ser fácil ==> fácilmente |
| `3jt1svnphb` | `cognate:spelling-pattern` | hacer ==> haciendo (do) |
| `n9rfhc3fi7` | `cognate:spelling-pattern` | hacer ==> haciendo (make) |
| `ajya630rfu` | `cognate:spelling-pattern` | ver ==> viendo |
| `mrx054a60o` | `cognate:spelling-pattern` | correr ==> corriendo |
| `leowvp7a8n` | `cognate:memory-bridge` | estudiar ==> estudia |
| `qg82ypat4e` | `cognate:memory-bridge` | tratar ==> trata |
| `an6awlzdv1` | `cognate:memory-bridge` | terminar ==> termina |
| `v7ltrzxban` | `cognate:memory-bridge` | intentar ==> intenta |
| `32c7r6jugo` | `cognate:memory-bridge` | decir ==> dice |
| `0qlz0zv1z5` | `cognate:memory-bridge` | tener ==> tiene |
| `wlbaxqy8wx` | `cognate:memory-bridge` | ir ==> va |
| `sfknobofbx` | `cognate:memory-bridge` | hacer ==> hace |
| `w7w8ly9haz` | `cognate:memory-bridge` | ser ==> es |
| `715ron2lud` | `cognate:memory-bridge` | estar ==> está |
| `3t1fpmkces` | `cognate:confusion-set` | el norte ==> el/la norteño/a |
| `8m3b7j0hv5` | `cognate:confusion-set` | el sur ==> el/la sureño/a |
| `s5en2tu6vz` | `cognate:confusion-set` | el este ==> el/la oriental |
| `9qgyhzacqv` | `cognate:confusion-set` | el oeste ==> el/la occidental |
| `17mqfzfrq1` | `false friend` | ¿cuál es [algo]? → what is [something]? — a `cuál`/*which* row, not a false friend |

### Table R1 — the `-decir` family (the reported gap), 5 rows

| concept-id | spanish | english | role | collections to add | reason |
|---|---|---|---|---|---|
| `iuyce294go` | predecir [algo] | to predict [something] | reference | `cognate:decir-to-dict` · `topic:cognate` · `cognate:transparent` | *predecir*/*predict*: the prefix is already tagged (`morphology:prefix-pre`), the root was never recorded. The reported case. |
| `8ck7889dtr` | contradecir a [alguien] | to contradict [somebody] | reference | `cognate:decir-to-dict` · `topic:cognate` · `cognate:transparent` | same, with `morphology:prefix-contra` |
| `d587f3ftw9` | decir [algo] | to say [something] | core | `cognate:decir-to-dict` · `topic:cognate` · `cognate:opaque-gloss` | **family anchor.** *say* is not the cognate — *dict* is. That is exactly why the family needs a tag. |
| `aw96cncl64` | bendecir a [alguien] | to bless [somebody] | reference | `cognate:decir-to-dict` · `topic:cognate` · `cognate:opaque-gloss` | root is there (*benediction*), gloss is not. See JC #4 |
| `btsojlg7v0` | maldecir a [alguien] | to curse [somebody] | reference | `cognate:decir-to-dict` · `topic:cognate` · `cognate:opaque-gloss` | same (*malediction*) |

Also flagged, not tagged: `fa0oa5e7dp predecir ==> ser predecible` and
`ui5iwqc9ze decir [algo] ==> predecir [algo]` are `==>` derivation rows and are
excluded by the Table-U rule.

### Table R2 — root-family promotions, 124 memberships across 22 families

Mechanical: every row currently carrying `morphology:suffix-<enRoot>` gains
`cognate:<esStem>-to-<enRoot>` + `topic:cognate`. Reason for every line:
*"promote a root correspondence mis-filed as an English suffix — `-tain` is not
a suffix of `obtener`."* The `morphology:suffix-*` tag is **kept**, not removed
(JC #3). Representative slice; the full 124 are a direct query result:

| concept-id | spanish | english | role | collections to add |
|---|---|---|---|---|
| `q6nk7om8xl` | obtener | to obtain | supporting | `cognate:tener-to-tain` |
| `jbffg23epm` | mantener | to maintain | supporting | `cognate:tener-to-tain` |
| `nk60yb6f9o` | contener | to contain | supporting | `cognate:tener-to-tain` |
| `nxk7dtjdpe` | sostener | to sustain | reference | `cognate:tener-to-tain` |
| `mpxfwjh99r` | retener | to retain | reference | `cognate:tener-to-tain` |
| `u1njnze2ss` | detener | to detain | reference | `cognate:tener-to-tain` |
| `dpp6pujrc4` | entretener | to entertain | reference | `cognate:tener-to-tain` |
| `mvddgib5ti` | abstenerse | to abstain | reference | `cognate:tener-to-tain` |
| `4fc2kcqip3` | proponer | to propose | reference | `cognate:poner-to-pose` |
| `qta6ei3b67` | componer | to compose | reference | `cognate:poner-to-pose` |
| `mt3fyxp4nv` | exponer | to expose | reference | `cognate:poner-to-pose` |
| `inf9g9dmd7` | imponer | to impose | reference | `cognate:poner-to-pose` |
| `g05qdfu47y` | oponerse | to oppose | reference | `cognate:poner-to-pose` |
| `x2avxaorkd` | suponer | to suppose | supporting | `cognate:poner-to-pose` |
| `3x6gdy36k9` | deponer | to depose | reference | `cognate:poner-to-pose` |
| `cencbpbbei` | interponer | to interpose | reference | `cognate:poner-to-pose` |
| `fktf9mepcn` | predisponer | to predispose | reference | `cognate:poner-to-pose` |
| `zz361ii5vv` | atraer | to attract | supporting | `cognate:traer-to-tract` |
| `p4scw97v1h` | contraer | to contract | reference | `cognate:traer-to-tract` |
| `4rbp4wgwso` | distraer | to distract | reference | `cognate:traer-to-tract` |
| `905ihja4zo` | extraer | to extract | reference | `cognate:traer-to-tract` |
| `208ry1ffqk` | sustraer | to subtract | reference | `cognate:traer-to-tract` |
| `4ur7u7wdv4` | describir | to describe | supporting | `cognate:escribir-to-scribe` |
| `b6wua9uv0p` | prescribir | to prescribe | reference | `cognate:escribir-to-scribe` |
| `1bs20nqq1z` | inscribir | to inscribe | reference | `cognate:escribir-to-scribe` |
| `gjh5b0lek7` | suscribirse | to subscribe | reference | `cognate:escribir-to-scribe` |
| `xjwylsxod0` | transcribir | to transcribe | reference | `cognate:escribir-to-scribe` |
| `4b6y1dtam9` | permitir | to permit | supporting | `cognate:mitir-to-mit` |
| `huqj9mq0gj` | admitir | to admit | supporting | `cognate:mitir-to-mit` |
| `cl6jhf2u3u` | transmitir | to transmit | reference | `cognate:mitir-to-mit` |
| `bm5xv1t2ju` | emitir | to emit | reference | `cognate:mitir-to-mit` |
| `9y3wackzb5` | omitir | to omit | reference | `cognate:mitir-to-mit` |
| `7193nsmx07` | remitir | to remit | reference | `cognate:mitir-to-mit` |
| `se694g3es1` | cometer | to commit | supporting | `cognate:mitir-to-mit` |
| `15acw0vdrq` | someterse | to submit | reference | `cognate:mitir-to-mit` |
| `t8xl5ujrhi` | introducir | to introduce | supporting | `cognate:ducir-to-duce` *(+ `cognate:false-friend`, §5)* |
| `iwrrtg66rv` | producir | to produce | supporting | `cognate:ducir-to-duce` |
| `4e8xlbp20p` | reducir | to reduce | supporting | `cognate:ducir-to-duce` |
| `4w4rj5i3g0` | deducir | to deduce | reference | `cognate:ducir-to-duce` |
| `ljjs4igbh8` | inducir | to induce | reference | `cognate:ducir-to-duce` |
| `z0ppej4qej` | seducir | to seduce | reference | `cognate:ducir-to-duce` |
| `czdf4gnfnp` | reproducir | to reproduce | reference | `cognate:ducir-to-duce` |
| `o3l6oubtj6` | conceder | to concede | reference | `cognate:ceder-to-cede` |
| `zb1r0lavqo` | exceder | to exceed | reference | `cognate:ceder-to-cede` |
| `xltdt2bpq9` | preceder | to precede | reference | `cognate:ceder-to-cede` |
| `ihevpwrjl9` | proceder | to proceed | reference | `cognate:ceder-to-cede` |
| `4yf8ijcj19` | comprimir | to compress | reference | `cognate:primir-to-press` |
| `nk0a8snhq8` | reprimir | to repress | reference | `cognate:primir-to-press` |
| `a3bhdljvih` | suprimir | to suppress | reference | `cognate:primir-to-press` |
| `dfw51tn4hy` | expresar | to express | reference | `cognate:primir-to-press` |
| `3scspzwt5d` | instruir | to instruct | reference | `cognate:struir-to-struct` |
| `n0v5y8wx0o` | construir | to construct | reference | `cognate:struir-to-struct` |
| `hbbltk5r4f` | obstruir | to obstruct | reference | `cognate:struir-to-struct` |
| `sz6kj23n5m` | reconstruir | to reconstruct | reference | `cognate:struir-to-struct` |
| `pe06lzc5y3` | concluir | to conclude | reference | `cognate:cluir-to-clude` |
| `xklnks32qd` | excluir | to exclude | reference | `cognate:cluir-to-clude` |
| `dwu519xf0p` | incluir | to include | supporting | `cognate:cluir-to-clude` |
| `4r07khungy` | contribuir | to contribute | reference | `cognate:tribuir-to-tribute` |
| `779ynouu11` | distribuir | to distribute | reference | `cognate:tribuir-to-tribute` |
| `p34vsonve4` | atribuir | to attribute | reference | `cognate:tribuir-to-tribute` |
| `xuo5hy2tk4` | recibir | to receive | supporting | `cognate:cibir-to-ceive` |
| `a2ujxq83pk` | percibir | to perceive | reference | `cognate:cibir-to-ceive` |
| `286sjydeon` | concebir | to conceive | reference | `cognate:cibir-to-ceive` |
| `hyjsumzen7` | convertir | to convert | supporting | `cognate:vertir-to-vert` |
| `bwkdp2bsi4` | revertir | to revert | reference | `cognate:vertir-to-vert` |
| `vmofgr1p4a` | invertir | to invert | reference | `cognate:vertir-to-vert` |
| `jck1nkdlkp` | resolver | to resolve | supporting | `cognate:solver-to-solve` |
| `vuqfy6bg06` | disolver | to dissolve | reference | `cognate:solver-to-solve` |
| `55iitmw0d7` | absolver | to absolve | reference | `cognate:solver-to-solve` |
| `ph8exwfohx` | sugerir | to suggest | supporting | `cognate:gerir-to-gest` |
| `gqqod0k0fl` | digerir | to digest | reference | `cognate:gerir-to-gest` |
| `6hc9qj9an6` | ingerir | to ingest | reference | `cognate:gerir-to-gest` |
| `znnmxrglvi` | preferir | to prefer | supporting | `cognate:ferir-to-fer` |
| `hpqr1ns3w1` | referirse a | to refer to | supporting | `cognate:ferir-to-fer` |
| `lp8l4wpj4p` | transferir | to transfer | reference | `cognate:ferir-to-fer` |
| `ll708ai2nl` | diferir | to differ | reference | `cognate:ferir-to-fer` |
| `psjycfzsmh` | conferir | to confer | reference | `cognate:ferir-to-fer` |
| `ktufkog3lp` | inferir | to infer | reference | `cognate:ferir-to-fer` |
| `dpcbf2wx7l` | sufrir | to suffer | supporting | `cognate:ferir-to-fer` |
| `3qo4l6ua2u` | prohibir | to prohibit | supporting | `cognate:hibir-to-hibit` |
| `hzw88e00ad` | exhibir | to exhibit | supporting | `cognate:hibir-to-hibit` |
| `ahkjwrez5w` | inhibir | to inhibit | reference | `cognate:hibir-to-hibit` |
| `5g4fbayz0u` | observar | to observe | supporting | `cognate:servar-to-serve` |
| `invu1lmtuw` | conservar | to conserve | supporting | `cognate:servar-to-serve` |
| `gbkix5lyv6` | preservar | to preserve | supporting | `cognate:servar-to-serve` |
| `alnivw5ja6` | reservar | to reserve | supporting | `cognate:servar-to-serve` |
| `p0b6bsx2vd` | ocurrir | to occur | supporting | `cognate:currir-to-cur` |
| `zuvh5lsd8u` | incurrir en | to incur | reference | `cognate:currir-to-cur` |
| `98sen5xp7y` | comprender | to comprehend | supporting | `cognate:hender-to-hend` |
| `9nxtl23uza` | aprehender | to apprehend | reference | `cognate:hender-to-hend` |
| `0l9aed93ze` | aplicar | to apply | supporting | `cognate:plicar-to-ply` |
| `uu1cnr3a36` | multiplicar | to multiply | reference | `cognate:plicar-to-ply` |
| `bp593daco9` | implicar | to imply | reference | `cognate:plicar-to-ply` |
| `3lzsofawpo` | explicar | to explain | supporting | `cognate:plicar-to-ply` — **and untag `morphology:suffix-ain`**, a misfile: *explicar* is *plicare*, not *tenēre* |

Plus the anchor rows, tagged `cognate:opaque-gloss` per §3.3:
`rtsiqg8t58 poner [algo] [en algún lugar] → to put` (`cognate:poner-to-pose`),
`qdd1gcrv5r traerle [algo] a [alguien] → to bring` (`cognate:traer-to-tract`),
`gxz0b4d70d escribir` family anchor (`cognate:escribir-to-scribe`),
`d587f3ftw9 decir [algo]` (already in Table R1),
and `wwwc8jugby tener [algo] → to have [something]` (`cognate:tener-to-tain`).

### Table F — false friends, 11 retags + 3 new rows

Retags per §5.1, each adding `cognate:false-friend` (where the gloss is a genuine
trap) and/or a named `contrast:` value plus `contrast:confusable`. New rows
(`curriculum:concepts:add`): `ser sensato → to be sensible`,
`la salida → the exit`, `la conferencia → the lecture` — each authored solely so
its contrast pair has a second half.

### Table S — suffix stragglers, 15 memberships

The §1 list, each adding its family value + `topic:cognate`. Excluded as false
positives: `wpfrk73j3o llevar puesto/a`, `jdb560wluh llevar [ropa]`,
`xwfttsrbm4 despejar`, `j1hw054qpy procesar`, `jjln6naurj cargar con`,
`tidi1ymaul seguro de algo` — matched by the `ar-to-ar`/`uro-to-ure` rules but
not cognate pairs.

---

## 9. Judgment calls

Each has a recommendation and the tradeoff. Nothing below has been applied.

**1. Retire `cognate:true` (755 memberships) outright?**
*Recommendation:* **yes, DELETE.** Zero rows carry it without
`spelling-pattern`, so it partitions nothing; and with a false-friend set of 2 it
asserts "not one of these two." The type axis is re-established properly as
`transparent`/`opaque-gloss`/`false-friend`.
*Tradeoff:* it is the second-largest collection in the facet and deleting it is
irreversible except by re-applying a manifest. If the intent was "verified by a
human", that intent is lost — but nothing in the data distinguishes verified from
imported, so the intent is already lost.

**2. Rename `cognate:spelling-pattern` → `topic:cognate` rather than deleting it?**
*Recommendation:* **rename.** It gives the topic page a `baseCollection` for
free, and 777 of the eventual ~800 memberships are correct as-is.
*Tradeoff:* the name `spelling-pattern` disappears, and anyone reading old
manifests will have to follow the rename. Mitigated by logging it in
`docs/curation/README.md`.

**3. Keep the `morphology:suffix-<enRoot>` tags after promoting to `cognate:`, or move them?**
*Recommendation:* **keep both.** `morphology:` is doing real work for the
English-side drill ("this English word ends in *-tain*"), and removing 124
memberships in the same batch that adds 124 would make the diff unreadable.
*Tradeoff:* deliberate redundancy — two facets describe the same fact from
different sides — and a future curator may not know which to add. Mitigated by
audit invariant #4, which asserts they agree. Revisit when the `morphology:`
triple-tag redundancy (`dad`+`idad`+`ity`+`ty`) is addressed on its own.

**4. `bendecir → to bless` / `maldecir → to curse` — in the `-decir` family or not?**
*Recommendation:* **in, tagged `cognate:opaque-gloss`.** The root is genuinely
there (*benediction*, *malediction*) and excluding them would leave the family
with 3 of its 5 catalog members, which is exactly the silent-drop the verb plan
was written against.
*Tradeoff:* the learner cannot *use* the cognate to produce *bless*. The
`opaque-gloss` type is precisely the honest label for that, but a curator might
reasonably want a "recognition-only" distinction the type axis does not draw.

**5. Collapse the eleven derivable `morphology:suffix-*` values into one `cognate:verb-stem`, or leave them?**
*Recommendation:* **leave them in `morphology:` for now; do not create
`cognate:verb-stem` in phase 1.** The rule ("drop *-ar/-er/-ir* and you have the
English word") is a *lesson*, not ~90 tags, and creating the collection invites a
bulk-tag pass with no teaching payoff.
*Tradeoff:* the Cognates page then has no button for the single most productive
pattern in Spanish→English. If Module 1 teaches that rule explicitly, revisit —
one collection, ~90 memberships, mechanical.

**6. Minimum family size of 3 — enforce it?**
*Recommendation:* **yes, with a named exemption set** (the `NO_ANCHOR_REQUIRED`
pattern from `audit-verb-conjugation.ts`). Seed the exemptions with
`currir-to-cur` (2), `hender-to-hend` (2), `arte-to-art` (3, at the boundary).
*Tradeoff:* a legitimately small family needs a code change to be added, which is
friction. That friction is the point — it is what stops one-off tags.

**7. Reject `cognate:partial` as a type value?**
*Recommendation:* **yes, reject it.** Every candidate (`introducir`, `ignorar`,
`aplicar`) is one sense true and one sense false, and the catalog already splits
senses into rows. Model as two rows joined by a `contrast:` pair.
*Tradeoff:* it forces sense splits that do not exist yet — `t8xl5ujrhi introducir
→ to introduce` has no `introducir → to insert` sibling. So rejecting `partial`
creates authoring work that accepting it would avoid. I still recommend
rejecting: `partial` is a slot for "we did not decide."

**8. Fold `cognate:confusion-set` / `cognate:contextual` into `contrast:confusable`?**
*Recommendation:* **yes.** Their content ("one Spanish word, several competing
English glosses") is `contrast:`'s stated purpose — *"a confusable pair a Spanish
speaker must actively distinguish."*
*Tradeoff:* `contrast:confusable` grows from 44 to ~69 and becomes noisier; and
the 25 rows arrive without the *named* pair value (`contrast:vivir-vs-live`) that
every existing member has. Recommend authoring those names in the same batch —
about 8 pairs — rather than merging into the bare flag.

**9. "Latin roots" umbrella tag (`cognate:latin-root`) or a `facetGroups` UI change?**
*Recommendation:* **the umbrella tag.** 129 extra memberships, no code change,
identical to how every other facet button works.
*Tradeoff:* a 130th membership per root row, and a value that is a *category of
values* rather than a value — mild taxonomic impurity. The alternative changes
`CurriculumTopic`'s shape for one topic's benefit.

**10. Record the English cognate word when it is not the gloss (*terminar* → *terminate*)?**
*Recommendation:* **defer, but note the mechanism:** an `en:terminate`
membership on `1nm2wdol3n terminar → to finish` would do it with no schema
change, using the existing bilingual-dictionary facet. Not in phase 1 — it
touches 68 `opaque-gloss` rows and needs a per-row judgment about whether the
English word is one the learner should meet at all.
*Tradeoff:* until then, `cognate:opaque-gloss` says "there is a bridge" without
saying what the bridge is, which is half a teaching aid.

**11. Author the ~34 absent false-friend headwords in phase 1?**
*Recommendation:* **no — separate batch.** It is ~34 new rows plus ~34
contrast partners, i.e. ~68 rows, which is larger than everything else in phase 1
combined and is vocabulary selection, not curation.
*Tradeoff:* the Cognates page ships with a False-friends button showing ~11 rows
when the honest list is ~45, so the topic looks thinner than the domain is.
Acceptable — 11 correct rows beat 45 rushed ones, and the product brief lists
false-cognate families as a family to build, not to complete.

**12. Data bugs found in passing — fix in this batch or separately?**
- `nkl9jukruz discutir [algo] → to discuss [something]` — Spanish *discutir*
  leans *to argue*; the row's own gloss is the false friend.
- `j6008tp8dx consignar → to transfer` sits in `morphology:suffix-fer`; the root
  is *signare*, not *ferre*.
- `3lzsofawpo explicar → to explain` sits in `morphology:suffix-ain`; the root is
  *plicare*, not *tenēre*.
- `zdz3qzzhev ser parecido → to be similar` sits in `cognate:ar-to-ar`; *parecido*
  is not the *-ar → -ar* pattern (that family is *popular*, *regular*, *similar*).
- `aawalesw7o vivir → to live` is the **only `core` row in the entire cognate
  facet** (the other 810 are `reference`/`supporting`), and it is there via
  `confusion-set`, which §1 retires. After the merge the facet has zero `core`
  rows — worth confirming that is intended.
*Recommendation:* fix the first four in a small hygiene manifest **before** the
main batch, as the verb plan did with its JC #13; raise the fifth with the user
rather than acting on it.
*Tradeoff:* one extra commit.

**13. Sequencing: registry-and-audit before or after the tagging batches?**
*Recommendation:* **before**, and this is the one call I would not compromise on.
Every prior pass in this project that tagged first produced exactly the artefact
this document is cleaning up: 38 values, no vocabulary, six of them meaning
nothing. Ship `KNOWN_COGNATE_VALUES` + `audit-cognates.ts` with the P0 surgery,
so the P1 promotions land against a checker that would have rejected
`cognate:al`, the `==>` rows, and a `-decir` family with zero members.
*Tradeoff:* the visible catalog improvement is one batch later than it could be.

---

## 10. Suggested batch order

1. **Hygiene** — JC #12's four data bugs.
2. **Code** — `KNOWN_COGNATE_VALUES` in `collections.ts` (~49 entries, plus a
   written definition of the two value classes on the `cognate:` registry line);
   `assertKnownValues(collectionNames, "cognate", KNOWN_COGNATE_VALUES)` in
   `tests/curriculum-database.test.ts`; `scripts/audit-cognates.ts` with the six
   invariants of §2.3 and its `ROOT_TABLE`.
3. **P0 surgery** — Table C + Table U. *Run the audit here; it should pass with
   the root families reported as absent.*
4. **P1 promotions** — Table R1 (`-decir`) + Table R2 (124 root memberships) +
   anchors. *Audit passes clean.*
5. **P2** — Table S (suffix stragglers) + Table F (false friends, 11 retags + 3
   new rows + 8 named `contrast:` pairs).
6. **Topic page** — add the `cognates` entry to `CURRICULUM_TOPICS` (§7) and the
   `cognate:latin-root` umbrella memberships (JC #9).
7. **Log** the batch in `docs/curation/README.md`, and record the
   `cognate:spelling-pattern` → `topic:cognate` rename there so old manifests
   remain readable.
