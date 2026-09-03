# Pronoun matrix — the canonical spec for `topic:pronoun`

Every cell below should have at least one `curriculum_concepts` row tagged
`topic:pronoun`; every `topic:pronoun` row should map to a cell. The audit
script (`npm run curriculum:audit pronouns`) checks both directions.

Conventions: one row per Spanish form (no slashes). English synonyms
(somebody/someone) get one canonical row; Practice accepts the variant as an
alternate answer. `pos:pronoun` for pronouns, `pos:function-word` for the
determiners that pattern with them (`pos:determiner` stays reserved for the
quantifier family — muchos, pocos, ambos, cada). Gender split only where the
Spanish forms differ (este/esta); not for invariant forms (me). An invariant
form with several distinct English senses gets one row per sense —
`le → to him` / `to her` / `to it` / `to you`, `su`/`sus → his` / `her` / `its`
/ `their` / `your` — so the ambiguity is visible and each sense is drillable.

## Personal pronouns

| Person | Subject | Direct object | Indirect object | Prepositional (for/with/to) | Reflexive |
|---|---|---|---|---|---|
| 1sg | yo → I | me → me | me → to me | para/con/a mí → for/with/to me · conmigo → with me | me → myself |
| 2sg informal | tú → you | te → you | te → to you | para/con/a ti → for/with/to you · contigo → with you | te → yourself |
| 2sg formal | usted → you | lo/la → you | le → to you | para/con/a usted → for/with/to you | se → yourself |
| 3sg m | él → he | lo → him | le → to him | para/con/a él → for/with/to him | se → himself |
| 3sg f | ella → she | la → her | le → to her | para/con/a ella → for/with/to her | se → herself |
| 3sg n | ello → it | lo → it | le → to it | — | se → itself |
| 1pl | nosotros/nosotras → we | nos → us | nos → to us | para/con/a nosotros → for/with/to us | nos → ourselves |
| 2pl | ustedes → you | los/las → you | les → to you | para/con/a ustedes → for/with/to you | se → yourselves |
| 3pl m | ellos → they | los → them | les → to them | para/con/a ellos → for/with/to them | se → themselves |
| 3pl f | ellas → they | las → them | les → to them | para/con/a ellas → for/with/to them | se → themselves |

Extra: `se` (reemplaza a le/les ante lo/la/los/las) → to him/her/them — one row + contrast.
Reciprocal: `se` → each other · `nos` → each other.

## Possessives

| | Determiner (before noun) | Pronoun (stands alone) |
|---|---|---|
| 1sg | mi/mis → my | el mío/la mía → mine |
| 2sg | tu/tus → your | el tuyo/la tuya → yours |
| 3sg/3pl/formal | su/sus → his · her · its · their · your | el suyo/la suya → his · hers · theirs |
| 1pl | nuestro/a/os/as → our | el nuestro/la nuestra → ours |

Interrogative possessive: `de quién` → whose.

## Demonstratives

| Distance | Determiner (m/f, sg/pl) | Pronoun "this/that one" | Neuter pronoun |
|---|---|---|---|
| proximal | este/esta/estos/estas → this/these | este/esta → this one | esto → this |
| distal | ese/esa/esos/esas → that/those | ese/esa → that one | eso → that |
| far | aquel/aquella/aquellos/aquellas → that/those | aquel/aquella → that one | aquello → that |

The standalone-pronoun rows carry the English "this one" / "that one" so they
never collide with the determiner rows on the unique `(spanish, english)` key.

## Interrogative pronouns
quién → who · a quién → whom · de quién → whose · qué → what · cuál → which · cuál → what (before ser)

## Relative pronouns
que (persona) → who/that · que (cosa) → that/which · lo que → what · lo cual → which · quien → who (after prep/comma) · cuyo → whose

## Exclamative
`qué (exclamativo)` → what · how — `¡Qué sorpresa!` "What a surprise!", `¡Qué
rápido corres!` "How fast you run!". Tagged `grammar:exclamative`; surfaced by
the **Exclamative** filter on the topic page.

## Indefinite pronouns

| | -body/-one | -thing | -where |
|---|---|---|---|
| some- | alguien → somebody | algo → something | en algún lugar → somewhere |
| any- (questions) | alguien → anybody | algo → anything | en algún lugar → anywhere |
| no- | nadie → nobody | nada → nothing | en ningún lugar → nowhere |
| every- | todos → everybody · todo el mundo → everyone | todo → everything | en todas partes → everywhere |

Every compound indefinite carries its analysable English parts as
`morphology:prefix-{some,any,no,every}` and `morphology:suffix-{body,one,thing,where}`,
so "all the some- words" or "all the -body words" is one filter click.

Quantity indefinites: uno → one (impersonal) · ninguno → none · alguno → some · varios → several · cualquiera → anyone · ambos → both · cada uno → each one

## "want X to" — object-control shift

Spanish: `que` + subject pronoun + subjunctive. English: object pronoun + infinitive.
`que yo/tú/él/ella/nosotros/ellos [haga algo]` → me/you/him/her/us/them to [do something].
Tag `grammar:subordinate-subject-pronoun` + `construction:object-control`.

## Contrasts (`contrast:` facet — the teaching payload)

Each contrast is a tag applied to the real concept rows it links (not a
pseudo-concept). All also carry `contrast:confusable`, which drives the
"Confusions" filter on the page. `contrast:dropped-subject` is the one
standalone anchor, since Spanish has no word there.

| Facet | Applied to | The confusion |
|---|---|---|
| `contrast:lo-vs-le` | `lo → him`, `le → to him` | direct vs indirect object |
| `contrast:mi-vs-mi-tilde` | `mi → my`, `para mí → for me` | `mi` (my) vs `mí` (me, after preposition) |
| `contrast:tu-vs-tu-tilde` | `tu → your`, `tú → you` | the accent flips the word |
| `contrast:este-vs-esto` | `este → this`, `esto → this` | `este libro` but `esto es` — never `esto libro` |
| `contrast:tu-vs-usted` | `tú → you`, `usted → you` | informal vs formal, both → you |
| `contrast:se-reflexive-vs-reciprocal` | `se → himself`, `se → each other` | `se lavan` = themselves OR each other |
| `contrast:su-ambiguity` | the `su` and `sus` rows | his / her / its / their / your |
| `contrast:you-collapse` | `tú`, `usted`, `ustedes`, `te` (all → you) | English "you" swallows the lot |
| `contrast:el-vs-lo` | `él → he`, `lo → him` | subject vs object; and `que él` → "him to" |
| `contrast:dropped-subject` | `hablar sin pronombre de sujeto → to speak (subject dropped)` | Spanish drops the subject; English requires it |
