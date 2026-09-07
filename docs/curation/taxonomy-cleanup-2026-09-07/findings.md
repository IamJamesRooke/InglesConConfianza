# Taxonomy cleanup — findings (2026-09-07)

Concrete, reusable analysis from `inventory.json` + targeted DB probes so a
resuming session does not re-run them. IDs are stable.

<a id="confusion"></a>
## Confusion groups outside the two Mappings topics

`contrast:confusable` has **70 rows** DB-wide. Topic pages surface a subset each
(base-tag intersection). Nine facet buttons must leave ordinary topics:

| Topic | Button label | Collection | Rows on page | Disposition |
|---|---|---|---|---|
| pronouns | Confusions — su/sus | `topic:confusable-possessive` | 12 | → Spanish-to-English Mappings ("Common confusions" family). su/sus start from Spanish. |
| pronouns | Confusions — Other | `topic:confusable-pronoun-other` | 14 | split by direction: subject/reflexive/`se` contrasts (`tú/usted/ustedes`, `se` refl-vs-recip, dropped subject) → Sp→En; `you`-collapse view already lives in En→Sp. |
| determiners | Confusions — su/sus | `topic:confusable-possessive` | 12 | same group as pronouns' — → Sp→En Mappings (one shared button, not mirrored). |
| determiners | Confusions — Other | `topic:confusable-determiner-other` | 9 | `un vs uno`, `algún vs alguno`, `el` article-vs-pronoun, `billón vs billion`, `tanto vs tan` → Sp→En Mappings. |
| interrogatives | Confusions | `contrast:confusable` | **0** | stale — remove the button outright (no rows reachable; base `topic:interrogative` ∩ `contrast:confusable` is empty). |
| verbs | Confusions | `contrast:confusable` | 14 | `ser/estar` adjective, `soy vs estoy`, `voy a` place-vs-infinitive, `vivir`/`vivir en`/`vivir con`, `tener … años` → Sp→En Mappings. |
| cognates | Confusions | `contrast:confusable` | 13 | false friends (`realizar`, `actualizar`, `éxito`, `largo`, `sensible`, `antiguo`, `último`, `dirección`, `conferencia`, `billón`) → Sp→En Mappings. Note: false-friend pairs are already modelled as `contrast:<a>-vs-<b>` + `cognate:false-friend`; keep those, drop only the page button. |
| nouns | Confusions | `contrast:confusable` | 7 | `salida`, `conferencia`/`lectura`, `plaza`, `dirección` (address vs direction), `disponibilidad`, `éxito` → Sp→En Mappings. |
| adjectives | Confusions | `contrast:confusable` | 11 | `diferente`, `sensato`/`sensible`, `largo`, `imprudente`, `insignificante`, `disponible` → Sp→En Mappings. |

### Direction call
- **Spanish-to-English** (start from the Spanish form; default for this DB since
  it is a Spanish→English map): su/sus, all false friends, `un vs uno`,
  `algún vs alguno`, `este vs esto`, `voy a …`, `ser vs estar`, `tú vs usted`.
- **English-to-Spanish**: only where the confusion is genuinely an English
  headword fanning out — `you → tú/usted/ustedes/te/ti` (already partly on
  En→Sp via `topic:enmap-you-*`). Do **not** mirror the Spanish-side groups.

### Mechanism
1. `curriculum:concepts:apply` to add `topic:multi-sense` (Sp side) or
   `topic:en-multi-sense` (En side) to each confusion concept that lacks it.
   Many already carry one — check per row, only add the missing tag.
2. New facet buttons on `mappings` / `en-mappings` for the confusion
   collections, clustered under a "Common confusions" family.
3. `topics.ts`: delete the 9 buttons above.
4. `navigation.ts`: `facetGroup()` already maps `contrast:` → "Common
   confusions"; keep that only for the Mappings pages. Remove the
   `contrast:` special-case for other topics. `verbFamily()` has a
   `contrast:` branch — drop it.
5. `TOPIC_AUDIT_SPECS`: several specs have `anchorWhen: tags => tags.some(t =>
   t.startsWith("contrast:"))` — those anchors stay valid (they exempt
   contrast rows from subcategory checks) but the English-coverage targets
   that only a contrast row satisfied need re-checking. Run
   `npm run curriculum:audit` after.
6. `mi → my` (`i5ji4776n8`) in `topic:confusable-possessive`: **keep** — it is
   the `mi` vs `mí` contrast (`contrast:mi-vs-mi-tilde`), a real pair, and it
   belongs in the su/sus-adjacent possessive-confusion group.

### Batch 1 applied (2026-09-07)

- 9 buttons removed: pronouns `topic:confusable-possessive` + `-pronoun-other`;
  determiners `topic:confusable-possessive` + `-determiner-other`;
  interrogatives / verbs / cognates / nouns / adjectives `contrast:confusable`.
- `topic:confusable-pronoun-other` → `topic:confusable-pronoun`;
  `topic:confusable-determiner-other` → `topic:confusable-determiner` (RENAME).
- 65 confusable concepts bucketed into 5 groups
  (`topic:confusable-{possessive,pronoun,determiner,verb,false-friend}`);
  Spanish-anchored buckets (possessive/verb/false-friend) also got
  `topic:multi-sense`; pronoun/determiner left on whichever Mappings direction
  they already had (both buttons appear on both Mappings pages).
- 4 rows untagged from `contrast:confusable` (`c3t870d60r`, `zv195eq10v`,
  `c48b9qs6fd`, `lztdsmka37`) — plain adjectives with no `contrast:<x>-vs-<y>`,
  i.e. not real confusion pairs.
- `mi → my` (`i5ji4776n8`) kept in the possessive-confusion bucket (`mi` vs
  `mí`, a real pair) as decided.
- `leer ==> la lectura` (`6gh8d3gw7b`) deliberately left with only
  `contrast:confusable` — it is a Transformations row, not a mapping.
- **Follow-up (Batch 4):** cognates within-topic gap went 0→2 —
  `1amptqkvwv [la] disponibilidad → availability` and
  `a12miruf57 [estar] disponible → [to be] available` carry `topic:cognate`
  with **no** `cognate:` pattern/type tag (pre-existing hole, was masked by the
  now-removed `contrast:confusable` button). Either give them a `cognate:`
  family or drop `topic:cognate`. They remain reachable via the Mappings
  false-friend confusion group.
- **Follow-up (Batch 5/6):** legacy deep links
  `?topic=pronouns&facets=topic:confusable-possessive` (and the other 8) no
  longer resolve to a leaf — they fall back to the topic view. Concepts are
  reachable via the Mappings "Common confusions" family. Add redirects if the
  old links are known to be in use.

<a id="orphans"></a>
## Global orphans (24 non-trash, no topic base tag)

| Cluster | IDs | Suggested home |
|---|---|---|
| past time-frame phrases | `0nw2v2tg59` el año pasado, `uqb2qipaq0` el mes pasado, `ntzn66pmxo` la semana pasada | `pos:adverb` + `topic:adv-time-relative-day` (Adverbs → Time) |
| distance phrases | `jlm6vadinl` lejos de un lugar, `4240qxyqxs` cerca de un lugar, `0bxkcfqexz` cerca de un lugar (dup gloss "close to"), `3j18tf1yhr` a casa | `pos:adverb` + `topic:location` (Adverbs → Place); check `4240qxyqxs`/`0bxkcfqexz` for duplication |
| quantity phrases | `37lvgw6mdi` un poco, `4owlerryxw` poco, `efzsdnarz6` menos [N contable], `2yywyl5i44` más de [cantidad], `01... ` | Determiners → quantifier groups (`topic:quant-*`) or trash if compositional |
| comparative-than phrases | `i7kngch29y` más pronto de lo esperado, `w9ufp3bqk0` ya → before | Connectors → Comparison, or Adverbs → Time |
| "forward/ahead" | `nglcabemco`, `i1wqgc6i2p` directamente hacia adelante | `pos:adverb` + `topic:location` |
| duration | `98imhq1xe7` [algo] lleva [tiempo], `8a3s9ew4ih` [período] atrás | Verbs (`pos:verb`) / Adverbs; `atrás` → Adverbs Time |
| grammar-term metadata rows | `qlkvt2tkf2` tiempo pasado→past time, `ucz5g070t5` tiempo presente, `8n1lf1difn` tiempo futuro, `v9yz4wf0xk` tiempo verbal→verb tense, `k70eg8dyji` [adverbio…] frame | **flag** — these are metalinguistic labels, not teachable Spanish→English concepts. Candidate `trash` pending user confirmation. |
| misc | `cqyv9nbo0n` terminado→finished, `uoz9og2i44` un montón de [sustantivo], `k70eg8dyji` | `terminado` → Verb-Forms or Adjectives; `un montón de` → Determiners quantifier |

### Batch 2 applied (2026-09-07)

Homed (19): `la semana/mes/año pasada` → `pos:adverb` + `topic:adv-time-relative-day`;
`cerca/lejos de un lugar`, `a casa` → `pos:adverb` (already had `topic:location`);
`un poco`, `poco`, `más de [cantidad]`, `menos [N contable]`, `un montón de` →
`topic:determiner` (+ quantifier group); `más pronto de lo esperado`, `ya→before`,
`[período] atrás` → `pos:adverb` + a `topic:adv-time-*` group;
`[algo] lleva [tiempo]` → `pos:verb` + `topic:verb-weather-time-duration`;
`directamente hacia adelante` ×2 → `pos:adverb`+`topic:location`+`topic:transformation`;
`terminado→finished` → `topic:transformation` (has `morphology:suffix-ed`).

**Trashed (5, reversible — user review):** `k70eg8dyji`
"[adverbio de frecuencia] [verbo principal]" (template placeholder);
`qlkvt2tkf2`/`ucz5g070t5`/`8n1lf1difn` "tiempo pasado/presente/futuro → past/present/future time";
`v9yz4wf0xk` "tiempo verbal → verb tense" (all metalinguistic grammar terms,
tagged `grammar term`, teach nothing as a Spanish→English mapping). Recover
from `/curriculum?role=trash` if any should stay.

<a id="gaps"></a>
## Small within-topic gaps

- **pronouns (2):** `q9x6f0ze09` lo [adjetivo] → "the [adjective] thing",
  `cwuhjz9zei` qué [sustantivo] exclamativo. Both are determiner/neuter
  constructions — add to a pronoun group or accept as En→Sp mapping rows.
- **determiners (3):** `01slode9o8` mucho [sustantivo] → plenty of; the two
  above also carry `topic:determiner`. Tag into `topic:quant-much-many` /
  a "neuter `lo`" group.
- **nouns (6):** `yt3bjazug3`/`4abmpsiu46` la tarde, `k2k4xsq191` la mañana,
  `rwj2zcgfcm` la noche, `5c41gd4gqg` día, `sfunx9o2ea` espacio exterior —
  missing `topic:noun-time-days-periods` / a places tag. Straight tag add.
- **adjectives (7):** `erzwuc6ywd` ¿No estás listo? (a question sentence
  mistagged `pos:adjective` — untag), `zasp2r8vif` comestible / `ldjf9twfn1`
  bebible / `6rgyh7ngls` laboral (need a `topic:adj-*` suffix group),
  `kfx1lzc2a8` bienvenido, `f2rqqk1bhq` un solo, `4465jxo8rw` ex [cargo].
- **adverbs (5):** `zcsk0uorhv` sentirse bien / `b0zp4e4wz9` sentirse mal /
  `aqt0wb7fmf` irle bien — these are verb phrases mistagged `pos:adverb`
  (check), `seq1qsjokh` de hecho → `grammar:discourse`, `szn7fm8wsx`
  [hacer algo] mucho.
- **connectors (5):** `por si`, `preguntar si` ×2 (verb phrases — check pos),
  `al volver` → `construction:preposition-plus-gerund`, `establecer que`.
- **prepositions (2):** `z1kohrhmbw` ante [una autoridad], `drk12jhvde`
  junto con — genuine one-offs; add "Other" or tag `topic:location`.
- **numbers (1):** `ccrgp9wvgz` tener [número] años — belongs on Verbs/Mappings,
  not Numbers; likely remove `pos:number` or accept it is only a confusion row.
- **verb-patterns (1):** `4sabms9mlz` ¿nunca has …? — negative-question
  sentence; belongs on Questions & Negation, check `topic:verb-pattern` tag.
- **en-mappings (5):** `8ueue3hv8i` me→to me, `ljza4yueup` nos→to us (indirect
  object — add `topic:enmap-*` or an "Object pronouns" confusion group),
  `8errr3uadz`/`9v6o0rhpio`/`j6ba7pl20y` let's-forms (belong on Imperatives —
  check why they carry `topic:en-multi-sense`).
- **phrasal-verbs-by-root (7):** non-verb idioms (`salida` way out,
  `a pesar de`, `ser aficionado a`, `ser el blanco de`, `estar junto a`,
  `estar lleno de`, `ser nuevo en`) — not phrasal verbs; untag
  `topic:phrasal-verb` or move to an idiom group.

<a id="verbs"></a>
## Verbs within-topic gap (301)

`topic:verb-other` no longer exists (0 rows) — the thematic redesign removed
the catch-all. 301 `pos:verb` rows carry the base tag but no `topic:verb-*`
theme. Options (Batch 3):
- (a) re-introduce one themed residual family ("More verbs", sub-grouped
  A–E/F–J/… like the Mappings pages) — fast, restores reachability.
- (b) distribute the 301 across existing verb themes — slower, better browse.
Recommend (a) first for reachability, then (b) opportunistically.
Regenerate the 301 list from `inventory.json` → `topics[slug=verbs]
.withinTopicGapIds`.
