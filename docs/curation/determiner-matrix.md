# Determiner matrix — the canonical spec for `topic:determiner`

Everything that can stand where **the** does in front of a noun: articles,
demonstratives, possessives, quantifiers, and numbers. *the dog, a dog, this
dog, that dog, a few dogs, three dogs, my dog, each dog, no dog, which dog.*

Every cell below should have at least one `curriculum_concepts` row tagged
`topic:determiner`; every `topic:determiner` row should map to a cell. The audit
script (`npm run curriculum:determiners:audit`) checks both directions.

**Conventions** (same as [pronoun-matrix.md](pronoun-matrix.md)):
- One row per Spanish form, no slashes. Gender/number split only where the
  Spanish forms differ (`este`/`esta`), not for invariant forms (`cada`).
- `pos:function-word` for articles and the pronoun-family determiners
  (demonstrative, possessive); `pos:determiner` for the quantifier family;
  `pos:number` for numerals. Each row also carries one `grammar:` subcategory
  from the list below.
- An invariant form with several English senses gets one row per sense
  (`su → his / her / its / their / your`), so the ambiguity is drillable.
- Demonstrative and possessive determiners are **dual-tagged**
  `topic:pronoun` + `topic:determiner` — `mi`, `este` etc. already exist under
  the pronoun topic; this topic adds the second tag, it does not re-create them.
- Rows that only pattern *with* a noun and cannot stand alone as a pronoun
  (`el`, `un`, `cada`, `cualquier`, `qué libro`) are determiner-only.

## `grammar:` subcategories

| facet | covers |
|---|---|
| `grammar:definite-article` | el, la, los, las |
| `grammar:indefinite-article` | un, una, unos, unas |
| `grammar:neuter-article` | lo (+ adjective) |
| `grammar:contraction` | al, del |
| `grammar:demonstrative-determiner` | este, ese, aquel … (exists) |
| `grammar:possessive-determiner` | mi, tu, su, nuestro … (exists) |
| `grammar:quantifier` | todo, mucho, poco, algún, ningún, otro, cada … (exists) |
| `grammar:cardinal-number` | uno, dos, tres … (exists) |
| `grammar:interrogative-determiner` | qué + N, cuánto + N |
| `grammar:relative-determiner` | cuyo + N |
| `grammar:exclamative` | ¡qué + N! (exists) |

Existing modifier facets stay: `grammar:masculine`/`feminine`,
`grammar:singular`/`plural`, `grammar:countable`/`uncountable`,
`grammar:proximal`/`distal`, `grammar:negative`.

---

## 1. Articles

| | Spanish | English | status |
|---|---|---|---|
| definite m sg | el | the | ✅ exists — add `topic:determiner` |
| definite f sg | la | the | ✅ exists — add tag |
| definite m pl | los | the | ✅ exists — add tag |
| definite f pl | las | the | ✅ exists — add tag |
| indefinite m sg | un | a / an | ➕ new |
| indefinite f sg | una | a / an | ➕ new |
| indefinite m pl | unos | some / a few | ➕ new |
| indefinite f pl | unas | some / a few | ➕ new |
| neuter | lo (+ adjetivo) | the … thing / what is … | ➕ new (`lo bueno` → "the good thing") |
| contraction | al (a + el) | to the | ➕ new |
| contraction | del (de + el) | of the / from the | ➕ new |

Spain's *vosotros* possessive `vuestro` is out of scope (Latin-American focus);
add later as `reference` if wanted.

## 2. Demonstrative determiners — ✅ all exist, add `topic:determiner`

| distance | m sg | f sg | m pl | f pl | English |
|---|---|---|---|---|---|
| proximal | este | esta | estos | estas | this / these |
| distal | ese | esa | esos | esas | that / those |
| far | aquel | aquella | aquellos | aquellas | that / those |

## 3. Possessive determiners — ✅ all exist, add `topic:determiner`

| | before noun | English |
|---|---|---|
| 1sg | mi / mis | my |
| 2sg | tu / tus | your |
| 3sg·3pl·formal | su / sus | his · her · its · their · your |
| 1pl | nuestro / nuestra / nuestros / nuestras | our |

## 4. Quantifiers (indefinite determiners)

| Spanish (forms) | English | status |
|---|---|---|
| todo / toda / todos / todas | all / every / the whole | ➕ new (as determiner; `todo/todos` exist only as pronouns) |
| mucho / mucha / muchos / muchas | a lot of / much / many | ✅ exists — add tag |
| poco / poca / pocos / pocas · un poco de | little / few / a little | ✅ mostly exists — add tag, add `poco/poca` sg |
| bastante / bastantes | enough / quite a lot of | ➕ new |
| demasiado / -a / -os / -as | too much / too many | ✅ exists — add tag |
| suficiente / suficientes | enough | ✅ exists — add tag |
| tanto / -a / -os / -as | so much / so many | ✅ exists — add tag |
| algún / alguna / algunos / algunas | some / any | ➕ new |
| ningún / ninguna | no / not any | ➕ new |
| otro / -a / -os / -as | another / other | ✅ exists — add tag |
| cierto / -a / -os / -as | (a) certain | ✅ `cierto` exists — add tag + f/pl |
| varios / varias | several | ➕ new (as determiner; `varios` exists as pronoun) |
| cualquier | any (whichever) | ➕ new |
| cada | each / every | ✅ exists — add tag |
| ambos / ambas | both | ✅ exists — add tag |
| tal / tales | such (a) | ➕ new |
| más | more | ➕ new (as determiner) |
| menos | less / fewer | ✅ exists — add tag |
| medio / media | half a | ➕ new |

Phrasal quantifiers already in the catalog (`un montón de`, `mucha gente`,
`más que suficiente`, `muchos de`, `todos menos`) stay `grammar:quantifier` and
get `topic:determiner` only if they head a noun directly — `un montón de libros`
yes, `muchos de ellos` no (that's pronominal).

## 5. Numerals as determiners

All cardinal numbers are determiners (*three dogs* = `tres perros`). Tag every
existing `grammar:cardinal-number` row with `topic:determiner`.

- **core:** uno, dos, tres
- **supporting:** cuatro … noventa, cien, mil (taught as needed)
- **reference:** un millón, mil millones, un billón

Ordinals (`primero`, `segundo` …) are **not** included — Spanish ordinals take
an article (`el tercer libro`) so they modify like adjectives, they don't
replace *the*. They stay `grammar:ordinal-number`.

## 6. Interrogative & exclamative determiners

| Spanish | English | facet | status |
|---|---|---|---|
| qué (+ sustantivo) | what / which | `grammar:interrogative-determiner` | ➕ new — `¿Qué libro quieres?` |
| cuánto / cuánta (+ N no contable) | how much | `grammar:interrogative-determiner` | ➕ new |
| cuántos / cuántas (+ N contable) | how many | `grammar:interrogative-determiner` | ✅ exists — **retag** from `interrogative-pronoun` |
| qué (+ sustantivo, exclamativo) | what (a) | `grammar:exclamative` | ➕ new — `¡Qué día!` "What a day!" |

## 7. Relative determiner

| Spanish | English | status |
|---|---|---|
| cuyo / cuya / cuyos / cuyas (+ N) | whose | ➕ new determiner rows — `cuyo` currently exists only as `relative-pronoun` → whose; add the agreeing determiner set |

---

## Contrasts (`contrast:` facet)

| facet | applied to | the confusion |
|---|---|---|
| `contrast:un-vs-uno` | `un → a`, `uno → one` | `un libro` (a book) vs `uno` standalone (one) — `un` drops the `-o` before a noun |
| `contrast:el-articulo-vs-el-pronombre` | `el → the`, `él → he` | the accent is the only difference |
| `contrast:algun-vs-alguno` | `algún → some`, `alguno → some (one)` | `algún libro` but `alguno` alone |
| `contrast:spanish-article-no-english` | `los → the` and the generic-statement rows | `Me gustan los gatos` → "I like cats" — Spanish keeps the article, English drops it |
| `contrast:este-det-vs-pron` | `este → this` (det), `esto → this` (pron) | `este libro` but `esto es` — extends the existing `contrast:este-vs-esto` |
| `contrast:tanto-vs-tan` | `tanto → so much` (det), `tan → so` (adv) | `tanto` before a noun, `tan` before an adjective |
| `contrast:mucho-agreement` | the `mucho` determiner rows | `mucho` agrees as a determiner (`muchas casas`) but is invariable as an adverb (`trabajo mucho`) |
| `contrast:su-ambiguity` | the `su` / `sus` rows | agrees with the thing owned, not the owner (shared with pronoun topic) |

---

## Topic page

`topics.ts` entry `slug: "determiners"`, `baseCollection: "topic:determiner"`,
facet buttons: Definite article · Indefinite article · Demonstrative ·
Possessive · Quantifier · Number · Interrogative · Relative (cuyo) ·
Negative (ningún) · Confusions.

## Status — DONE 2026-09-04 (commits `57d80529`..`71c8b694`)

**137 `topic:determiner` concepts.** `npm run curriculum:determiners:audit`
and the `db:test` "determiner topic is complete and clean" test both pass.

- **A** (`57d80529`): 69 existing rows tagged — articles, demonstrative &
  possessive determiners (now dual-tagged `topic:pronoun` + `topic:determiner`),
  `pos:determiner` quantifiers, `cuántos/cuántas` (+`grammar:interrogative-determiner`).
- **B** (`7de1d7de`): 32 cardinal numbers tagged; `uno/dos/tres` → core.
- **C** (`57236155`): 37 new rows (indefinite articles, `lo`, `al`/`del`,
  `todo`/`algún`/`ningún`/`cualquier`/`varios`/`poco`/`más`/`medio`/`bastante`/`tal`,
  `qué`/`cuánto` + N, exclamative `qué` + N, `cuyo` set).
- **D** (`71c8b694`): `topics.ts` entry, audit script, test; audit-driven fixes
  (`pos:function-word` on articles, `grammar:quantifier` on `cierto/a` and the
  "the other" rows, `cada [sustantivo] → every [noun]` added,
  `topic:determiner` pulled off two article-*usage* construction rows).

**Deviations from the spec above:**
- `cierto/a [sustantivo]` kept its existing `X/a` agreement notation rather than
  splitting; the audit tolerates the `/a` `/os` suffix on quantifier rows.
- Cardinal-number **example sentences** still share the bulk-import placeholder
  (`Compré dos libros…`); the audit skips the example check for
  `grammar:cardinal-number`. Authoring per-number examples is a separate task.
- Contrasts applied in **G** (`af920218`): `contrast:un-vs-uno`,
  `contrast:el-articulo-vs-el-pronombre`, `contrast:algun-vs-alguno`
  (+ `contrast:confusable`). `contrast:tanto-vs-tan` skipped — no `tan` row yet.
- `vuestro`, ordinals: out, as agreed.

**Follow-ups done 2026-09-04** (curation pass batches 1–4): per-number example
sentences (all 64); `grammar:quantifier` stripped from the numbers;
`contrast:tanto-vs-tan` and `contrast:spanish-article-no-english` applied.

## Rough counts

~55 existing rows get `topic:determiner` added (articles 4, demonstratives 14,
possessives ~15, quantifiers ~15, `cuántos/cuántas` retag). ~40 new rows
(indefinite + neuter articles 6, contractions 2, `todo` set 4, `algún` 4,
`ningún` 2, `cualquier` 1, `varios/varias` 2, `bastante(s)` 2, `tal(es)` 2,
`más` 1, `medio/media` 2, `cierto` f/pl 3, `qué`+N 2, `cuánto/cuánta` 2,
`cuyo` set 4). Plus ~55 cardinal numbers retagged.
