# Pronoun matrix — the canonical spec for `topic:pronoun`

Every cell below should have at least one `curriculum_concepts` row tagged
`topic:pronoun`; every `topic:pronoun` row should map to a cell. The audit
script (`npm run curriculum:pronouns:audit`) checks both directions.

Conventions: one row per Spanish form (no slashes). English synonyms
(somebody/someone) get one canonical row; Practice accepts the variant as an
alternate answer. `pos:pronoun` for pronouns, `pos:function-word` for the
determiners that pattern with them. Gender split only where the Spanish forms
differ (este/esta); not for invariant forms (me, le).

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
| proximal | este/esta/estos/estas → this/these | este/esta/ese/esa/... "this one" | esto → this |
| distal | ese/esa/esos/esas → that/those | ese/esa "that one" | eso → that |
| far | aquel/aquella/aquellos/aquellas → that/those | aquel/aquella "that one" | aquello → that |

## Interrogative pronouns
quién → who · a quién → whom · de quién → whose · qué → what · cuál → which · cuál → what (before ser)

## Relative pronouns
que (persona) → who/that · que (cosa) → that/which · lo que → what · lo cual → which · quien → who (after prep/comma) · cuyo → whose

## Indefinite pronouns

| | -body/-one | -thing | -where |
|---|---|---|---|
| some- | alguien → somebody | algo → something | en algún lugar → somewhere |
| any- (questions) | alguien → anybody | algo → anything | en algún lugar → anywhere |
| no- | nadie → nobody | nada → nothing | en ningún lugar → nowhere |
| every- | todos → everybody · todo el mundo → everyone | todo → everything | en todas partes → everywhere |

Quantity indefinites: uno → one (impersonal) · ninguno → none · alguno → some · varios → several · cualquiera → anyone · ambos → both · cada uno → each one

## "want X to" — object-control shift

Spanish: `que` + subject pronoun + subjunctive. English: object pronoun + infinitive.
`que yo/tú/él/ella/nosotros/ellos [haga algo]` → me/you/him/her/us/them to [do something].
Tag `grammar:subordinate-subject-pronoun` + `construction:object-control`.

## Contrasts (`contrast:` facet — the teaching payload)

| Facet | The confusion |
|---|---|
| `contrast:lo-vs-le` | direct `lo` (him) vs indirect `le` (to him) |
| `contrast:mi-vs-mi-tilde` | `mi` (my) vs `mí` (me, after preposition) |
| `contrast:tu-vs-tu-tilde` | `tu` (your) vs `tú` (you) |
| `contrast:este-vs-esto` | `este libro` (determiner) but `esto es` (neuter pronoun) — never `esto libro` |
| `contrast:tu-vs-usted` | informal `tú` vs formal `usted`, both → you |
| `contrast:dropped-subject` | Spanish drops the subject (`Hablo` → **I** speak); English requires it |
| `contrast:se-reflexive-vs-reciprocal` | `se lavan` = wash themselves OR each other |
| `contrast:su-ambiguity` | `su` → his / her / its / their / your |
| `contrast:you-collapse` | English "you" = tú / usted / ustedes / te / le / os |
| `contrast:el-vs-lo` | subject `él` (he) vs object `lo` (him); and `que él` → "him to" |
