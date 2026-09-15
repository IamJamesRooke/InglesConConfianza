# Foundations — the minimal set (DRAFT for owner approval, 2026-09-15)

Status: **proposal, nothing applied.** No database writes, no schema change. This is the
answer to "what are all the Layer 1 concepts?" — the minimum a student must have before
we can say *the foundation is down*. Once approved it becomes one small manifest
(~440 existing rows get one facet, tentatively `course:foundations`; every id below was checked against the snapshot); the other ~3,950 rows are
untouched and get looked at only when we plan the next level.

## The criterion (owner's words, 2026-09-15)

- **Structural = must teach.** Pronouns, the verb spine, the machinery for negation /
  questions / tense, the glue words. "I, you, he, she, it, we, they" are absolutely
  critical.
- **Content vocabulary = incidental filler.** *To eat*, *to drink* are common but they
  exist to make a sentence natural; the student constructs them when a sentence wants
  them. They are never a Foundations *target*, so they are **not tagged** — the lesson's
  *Covers* list records whichever ones got used.
- **Few exceptions.** Foundations teaches the constructible form first; the surprise
  (*puedo* = *I can*, not *I be able*) comes right after it, as its own piece. Long tails
  of exceptions (irregular pasts, phrasal verbs, `-er/-est`) are for later.
- **Contrasts are taught as pairs**, base first, then the contrast, then combined:
  *so* → *not that*; *this* → *that*; *some* → *no*; *always* → *never*.
- **Official contractions from the start** (*don't, can't, isn't, I'm, won't*);
  unofficial ones (*wanna, gonna, gotta*) later.
- **Cognate rules are pulled in when a target sentence needs them**, not scheduled.

## How to read this

Each **piece** is one teaching focus (one explanation-and-retrieval cycle). Under it,
the database rows to use, as `id · spanish → english`. Marks:

- **F** — Foundations. Must be taught.
- **F?** — I'd put it in Foundations; **you decide** (listed together at the end).
- **L** — Later. Assumes Foundations; not in this pass.
- **I** — Incidental. Available filler; never a target.
- **GAP** — needed for Foundations but **no row exists yet** (listed at the end).

Rows not mentioned under a piece are its long tail → **L** or **I**.

---

## A. People — subject pronouns (F)

- `o25n43wg3o` yo → I · `608c3yq7i6` tú → you · `d6oilpcif8` usted → you
- `hdl7zq5rij` él → he · `2x4a9n68ud` ella → she · `laabqgv17t` ello → it
- `6bfxprlzrk` nosotros → we · `hh4dfyokmh` ellos → they · `vl5s55aiq3` ellas → they
- `em3gcm8fcl` ustedes → you
- `hh9lhwdnn0` (subject dropped in Spanish, never in English) → F, taught with *yo*

Contrast piece: tú / usted / ustedes all → *you* (one English word, three Spanish).

## B. The verb spine — infinitive frames (F)

Each verb is a piece; the frames under it are sub-steps in order.

**querer** — `w7bu9jslac` querer [algo] → want · `df1fa2p3xy` querer [hacer algo] → want to ·
`z3i6f8s1or` querer que [alguien] [haga algo] → want [somebody] to (needs D-object pronouns first) ·
`lr3gy47etf` querer saber si → want to know if (already taught in lesson 2)

**poder** — `mxguwwzrxk` poder → to be able to (constructible form first) ·
`0zuw37lnfv` puedo → can (the exception, taught right after) · `jwk81y46bp` no poder → can't ·
`r30tfgius4` ¿puedes…? → can you…? · `jdd2lebx6x` ¿puedo…? → can I…? ·
`nk4hb2zaok` poder (permiso) → can (same word, second job)

**necesitar** — `wyhk5xpxou` necesitar [algo] → need · `1eotkqfnjg` necesitar [hacer algo] → need to ·
`qvltvv56qd` necesitar que [alguien] → need [somebody] to

**tener que** — `7s7vnrgxud` tener que → have to · `22pjks5vmh` no tener que → don't have to ·
`8aej7jfu2y` ¿tienes que…? → do you have to…? · `4pgifzt26u` hay que → you have to (impersonal) F?

**ir a** — `38d1kfif1b` ir a [hacer algo] → be going to (needs C-*estar/am-is-are* first) ·
`ihsw7a0ggn` ¿vas a…? → are you going to…? · `2iiyjrogmc` ir a [un lugar] → go to

**deber** — `yrb2jzggm4` debería → should · `shtk95phvk` / `7uxwcm2q2o` no debería → shouldn't ·
`uekbgu9nsq` deber → must (F? — *must* vs *have to* is a nuance; I'd teach *should* in F and leave *must* for L)

**saber** — `3wtzllym25` saber [algo] → know · `manx93glfl` saber que → know that ·
`ahq54carab` saber si → know if/whether · `z5glfbp5sq` saber [qué/dónde…] → know what/where… ·
`kwh31erumh` saber [hacer algo] → know how to · `g4s8ww83pl` no sé → I don't know

**hacer** — `1qz4qeh9oi` hacer → do · `m9dfm9pbq2` hacer → make (contrast pair do/make) ·
`qt9aqatj4f` / `v6srxq2n55` hacer → to do / do (full vs bare infinitive after *can*)

**gustar** — `1uo0obtd8h` me gusta → I like (the flip) · `mowb8a6hvx` me gusta [hacer] → I like to ·
`9jt3xxrxse` me gustaría → I would like to · `fr2zv8cgr5` me gustaría [algo] → I would like ·
`miud8kxiic` me encanta → I love (F?)

**decir / hablar / pensar / creer** (the "say-think" spine) — `d587f3ftw9` decir → say ·
`y2jk0txcur` decirle a → tell · `4c0v1mewmv` hablar → speak · `b7q2nz5b40` hablar → talk ·
`xnti52ho63` hablar con → talk to · `9jo5861xgs` pensar que → think (that) ·
`wd6uku1ojd` creer que → think (that) · `k29o9xq2bp` creer que sí → think so ·
`592w2y5gz1` querer decir → mean · `okgrw0eqjz` quiero decir → I mean

**ver / dar / venir** — `xm8mzt42ci` ver → see · `2qfu76z9es` darle [algo] a → give [somebody] [something] ·
`xha8i0ahr5` venir → come · `b97077wlu1` venir a [hacer] → come to

**will / would** (Spanish future/conditional endings → one English word) —
`ywf23kyjgw` [hará] → will · `di2yhfha43` no [haré] → won't · `m2op0ycc10` ¿[harás]? → will you? ·
`39u2srbvlk` [haría] → would · `yjkuu2ysaa` no [haría] → wouldn't · `qoxz39dr3t` ¿[harías]? → would you?

Verb-pattern rule pieces (the "to" question, taught once each):
- after *want / need / have / going / would like* → **to** + verb (`form:full-infinitive`)
- after *can / will / would / should / must / don't* → **bare** verb (`form:bare-infinitive`)
- `zxp06uqig0` para [hacer algo] → to [do something] (purpose) F

## C. To be — ser / estar / hay / tener (F)

**ser** — `b5c13zo3bg` soy → I am · `0rv1zmpu5c` eres → you are · `rf1kaz8lmr` es → is ·
`d3s5uo0ahx` somos → we are · `0kqlhwpi3i` son → they are ·
`46elg5u15i` [ser] [adjetivo] → be [adjective] · `2z3yhpg9ve` ser de → be from ·
`othawv9u0f` ser [identidad] → be [a teacher] · `cbhs0k69zd` es [adjetivo] [hacer] → it is [adjective] to
Contractions (F): I'm / you're / it's / we're / they're — use with `9hsbrn2qzb` isn't, `6a2v9efdpz` aren't, `9814unz0vu` is she…?, `i53efix8bb` isn't it…?

**estar** — `93wmoiwink` estoy → I am · `0k44vohfn6` estás → you are · `zs2vl4oxdq` está → is ·
`kaq1f0slza` estamos → we are · `widbvn1zzj` están → they are ·
`nqyror4j5f` estar [estado] → be [tired] · `obf74hel79` estar [lugar] → be [at home] ·
`dnm638drfa` ¿cómo estás? → how are you? · `yet9gjs718` ¿están listos? → are they ready? · `erzwuc6ywd` aren't you…?
Contrast piece: ser vs estar → one English *be* (this is a Spanish-side distinction; the English collapses it — good "¡Ah, es así de fácil!").

**hay** — `nuo847x66j` hay → there is · `54mbh87vk1` hay → there are · `cp5hmttaq2` there's ·
`qhznzi6ug8` no hay → there isn't · `ker7jy3lyb` no hay → there aren't · `esf7i85ozv` ¿hay…? → is there…? ·
`g7zuuumnig` ¿hay…? → are there…? · `b1nubjxiqh` no hay problema → no problem

**tener** — `wwwc8jugby` tener → have · `p1ga7e8bhn`…`rkkkgau83q` tengo/tienes/tiene/tenemos/tienen ·
`0qlz0zv1z5` tiene → has (3rd-person rule) · `ccrgp9wvgz` tener [n] años → be [n] years old (the "tener → be" surprise) ·
`3l1rvkd3vh` tener hambre → be hungry · `3bdg1oyv39` sed → thirsty · `pvwpfoq4zb` frío → cold ·
`izmas5gq0m` calor → hot · `pe1f869we7` sueño → sleepy · `76ls07neza` razón → right · `3t5jjwz0t5` miedo → afraid (pattern: 2–3 exemplars, rest I)

## D. Objects and the words that stand for them (F)

**Placeholders** — `nqv2w27jgr` algo → something · `5xzf7m11n9` algo → anything (in questions) ·
`s0u2t5y194` nada → nothing · `hsqb5yui5l` alguien → somebody · `jidk0m8x2v` alguien → anybody ·
`rd3a1m9q85` nadie → nobody · `sacq7sy6j6` todo → everything · `6nqb18txzu` todos → everybody ·
`tzymzgnepe` cosa → thing · `z2a8m7lmkv` en algún lugar → somewhere (F?)

**Object pronouns (direct)** — `9rsyb41dmz` me → me · `5ajqekseb3` te → you · `mbu3bynmc3` lo → him ·
`7poocn5na8` la → her · `xd9c671eit` lo → it · `m3zbdhcenj` la → it · `96zmjpedzq` nos → us ·
`5cest1aute` los → them · `zf3sq9mld5` las → them · `a29elmu22c` lo → you (usted)
Piece: Spanish puts them before the verb, English after — *Lo quiero* → *I want it*.

**Indirect (le/les)** — `qtybwfahhd` le → to him · `xin4wk0lik` le → to her · `tne070no4d` les → to them ·
`8ueue3hv8i` me → to me · `a1dht71g4o` te → to you  (F? — needed for *give me / tell me*; I'd include)
`fz385c053c` se lo → it to him etc. → **L**

**After a preposition** — `lse8dx7tet` conmigo → with me · `rnldlhmpop` contigo → with you ·
`sxxbfgvhfa` con él · `0h11x77lat` con ella · `0wjnsjpf8s` con nosotros · `k71aaprkfg` con ellos ·
`dyi2yg06hb` para mí → for me · `sqd8xxfwmx` para ti → for you · `bfer5mn6yu` a mí → to me
Piece: after *with / for / to* the object pronoun is the same word as after a verb (me, you, him…) — one rule covers all the rows.

**Reflexive** — `6fweu4sgdj` me → myself · `f6ie78gefk` te → yourself · `w8wzsxl8uq` se → himself ·
`ifurkwv06w` me llamo → my name is · `e4wn19bujr` levantarse → get up → **F?** (Spanish uses *se* constantly; English mostly drops it. I'd teach "se usually disappears in English" as one piece, with *me llamo* and *levantarse*, and leave the rest L.)

**Possessive pronouns** (el mío → mine) → **L**. **Demonstrative pronouns** (este → this one) → **L**.

## E. Determiners (F)

- **the / a** — `foy4696l7r` el → the · `qdyg6idr5p` la → the · `u7zp2lujp0` los → the · `4j1nc0c9o9` las → the ·
  `8jv3otkqa7` un → a · `zravwibucz` una → a · `8xn53vk9eu` unos → some · `mcumr0ly9e` al → to the · `nlbaeg9xqs` del → of the
  Piece: four Spanish words → one *the*; two → one *a*.
- **some / any / no** — `7rngt9gu3p` algún → some · `1gq5hjnrzn` alguna → some · `ob5wvw1ip2` algunos → some ·
  `ghg76g1yom` ningún → no · `7h9okypmsz` ninguna → no · `ub1kh284v7` cualquier → any
- **this / that** — `0tty2mfina` este → this · `7hfg12h8br` esta → this · `dt2cwfu58n` ese → that · `19ebbd6l4z` esa → that ·
  `b1tz89cfx9` estos → these · `ovsfppuo3l` esos → those · `6cnielk682` esto → this · `tvm9cf1n1l` eso → that
  (aquel/aquella/aquellos → **L**)
- **my / your / his…** — `i5ji4776n8` mi → my · `ozvruwn0tu` mis → my · `63ojew9r4f` tu → your · `7gl5vz7uo4` tus → your ·
  `7fi9enfd3m` su → his · `s1bonkmflq` su → her · `ibkymsd9ln` su → its · `29p1fsasc0` su → their · `yfn0j25sta` su → your (usted) ·
  `x3zp11ybbf` nuestro → our · `11uupaj41k` nuestra → our
  Piece: *su* is five English words — pick by who owns it.
- **other / another** — `p3iz88j7nj` otro → another · `q4y77eka9u` el otro → the other · `93l4fxk5nx` otros → other
- **quantity** — `v3kumwf8dl` mucho → a lot of · `w317yrkvug` muchos → a lot of · `opdrjw467t` mucho (neg/q) → much ·
  `oedeaeps1f` muchos → many · `37lvgw6mdi` un poco → a little · `4owlerryxw` poco → little ·
  `m7x949wtjj` más → more · `tm1trc4gs0` menos → less · `f7psdobzu1` suficiente → enough ·
  `mmo03wwxvu` demasiado → too much · `z2ew7nxy61` demasiados → too many ·
  `s66xi2kamk` todo el → the whole · `6gvvc02efk` todos los → all the · `852d6mdyn0` cada → every
  (fewer / a few / plenty of / several / both / either / neither / such → **L**)
- **question determiners** — `65xbrzcund` qué [sustantivo] → what [noun] · `fwytkxeon9` cuál → which ·
  `jwh08a61ig` cuánto → how much · `ynlc19lduf` cuántos → how many

## F. Negation, questions, and the *do* machinery (F)

- **not / don't** — GAP: bare `no → not` (only `xypn65k1sg` no → no exists) ·
  `2uzud05u1l` no [hago] → I don't · `mrssm64iu9` [alguien] no [hace] → doesn't · `rz2ue36k0f` no [hizo] → didn't ·
  `p3fuo2folk` No como carne → I don't eat meat · `4e8vpd4tbg` Ella no come → She doesn't eat
  Piece: Spanish *no* + verb → English *don't* + verb; *doesn't* for he/she/it (the `-s` moves onto *does*).
- **questions with do** — `8hhxabswez` ¿[haces]? → do you…? · `jgfakbesvj` ¿[alguien] [hace]? → does…? ·
  `zctehn9sxz` ¿[hizo]? → did…? · `l0ff67q199` ¿Comes carne? → Do you eat meat? · `7zuboxokm5` ¿Ella come? → Does she…?
  Piece: Spanish asks with tone; English asks with *do*. Statement order is kept inside *I want to know if…* (`grammar:statement-order`) — already in lesson 2.
- **negative questions** — `t1monumdj4` ¿No comes…? → Don't you…? · `aq0gtmpie2` Doesn't he…? (F?)
- **emphatic do** — `c4ekkqs73f` sí lo hago → I do do it → **L**
- **question words** — `hnd0boisxm` qué → what · `d11xp5btf2` quién → who · `0t9g2lohg7` dónde → where ·
  `3ov21pqb58` cuándo → when · `ljpcmany1y` por qué → why · `7lxhk2vc3g` cómo → how ·
  `ci48dn458g` cuánto → how much · `3015o113yw` cuál → which · `g585r84tc1` cuál → what (*what is your name*) ·
  `1x0l3hgmx7` de dónde → where from · `erzbzs0gzc` a qué hora → what time · `17mqfzfrq1` ¿cuál es…? → what is…?
  (whom, whose, what for → **L**)
- **yes / no / please / thanks** — `vk5arw3nk6` sí → yes · `xypn65k1sg` no → no · `0wx9x5ccnb` por favor → please ·
  `tbbig44xx6` gracias → thank you · `hb47hyqftz` gracias por → thank you for
- **either / neither / also** — `gjot4oxazn` también → also/too · `avsnfusolj` tampoco → (not) either
- **never / nothing / nobody double-negative rule** — *No tengo nada* → *I don't have anything* / *I have nothing*: one piece using `s0u2t5y194`, `rd3a1m9q85`, `d7uycdog37` nunca → never

## G. Connectors (F)

`qxku96zu9e` y → and · `eiiegq2s5o` o → or · `s08z927piv` pero → but · `wjbh6m5ek1` porque → because ·
`v3wnwpk0qj` si → if · `9qaylitnlb` que → that · `71u0miv5rm` cuando → when · `u109gx9ehn` así que → so ·
`rakstubyz7` entonces → then · `2i2eb7xpzj` luego → then · `ke36yx8rke` que (comparación) → than ·
`elawsjkdck` aunque → although (F?) · `o25cdyanrl` mientras → while (F?)
Discourse connectors (es decir, de hecho, por cierto, a pesar de…) → **L**.

## H. Prepositions (F) — three frames, the rest is obvious

Owner (2026-09-15): the minimal examples are **for somebody, with somebody, to somebody**
(*I sent it to him*). Once those are mastered the other prepositions are obvious, so the
bare rows (a, de, en, por, sobre…) are **not** gaps — they are **I**, pulled in when a
sentence wants them.

- **with** — `ovnw5edm1p` con → with · `nrb0thfnst` con [alguien] → with [somebody] · then the D-pronoun forms (conmigo, contigo, con él…)
- **for** — `ez2lt2jbq7` para [alguien] → for [somebody] · then para mí / para ti / para él…
- **to** — `ej7gnt7lbx` a [alguien] → to [somebody] · then a mí / a ti / a él… (*Se lo mandé a él → I sent it to him*, pairs with `zui5vgopk6` sent)
- `8xgp5lhz06` después de → after · `v30numtk7s` antes de → before · `wmzhjqoerd` sin [algo] → without (I) ·
  `1x5p74ftvn` durante → during (I) · `ik8hj882al` entre → between (I)
- Place: `gdwcgcevlo` aquí → here · `wyrj7k8thq` allí → there · `3j18tf1yhr` a casa → home (no *to*!) ·
  `4240qxyqxs` cerca de → near · `jlm6vadinl` lejos de → far from (F?)

## I. Time and frequency (F)

`rf7wttxz5x` hoy → today · `uklvuftocv` mañana → tomorrow · `ozs312yyzn` ayer → yesterday · `44tis0284q` ahora → now ·
`v2bifwqn7l` esta noche → tonight · `yk8mablp0c` anoche → last night · `fv4tu6n5s9` más tarde → later ·
`1vi4oe10ip` después → then/after · `v5g3ptkmgk` pronto → soon · `v103p7ixjh` temprano → early · `840s7ssrox` tarde → late ·
`8rgf1v3z6t` ya → already · `2b50xdv2ra` todavía → still · `bluzvvve73` todavía no → not yet · `cecjai7o3s` ya no → not anymore ·
`8aag559cpt` siempre → always · `d7uycdog37` nunca → never · `fkw0rhnl5g` a veces → sometimes ·
`ulnbxqnhk3` todos los días → every day · `4xvfonkewz` otra vez → again · `v2n44iz4vk` una vez → once ·
`ntzn66pmxo` la semana pasada → last week · `5c41gd4gqg` día → day
Piece: frequency word goes *before* the verb in English (*I always arrive*) — one rule.
(pasado mañana, anteayer, a menudo, casi nunca, el mes/año pasado → **I**)

## J. Degree (F)

`neo7bdruvy` muy → very · `11lmznqkb7` tan → so · `57a72p21zi` no tan → not that (contrast pair) ·
`ix24rna8om` demasiado → too · `sk6v1ievgl` bastante → quite · `szn7fm8wsx` mucho → a lot ·
`r3d6k4jrrn` bien → well · `5ai1ief8xm` bien → okay · `lslyoa2sdp` casi → almost · `4f77g5k631` solo → alone (I) ·
GAP: `solo / solamente → only`

## K. Doing it now — progressive (F)

`f2zryn85p8` estar [haciendo] → be [doing] · `4uptsafx20`…`bb48xm25wt` estoy/estás/está/estamos/están haciendo ·
`rnbqgo3fk9` ¿estás haciendo? → are you doing? · `3jt1svnphb` hacer ==> haciendo → doing (the `-ing` rule) ·
GAP: an explicit `-ando/-iendo → -ing` rule row (the ==> rows are per-verb)
Past progressive (was doing) → **L**.

## L. Past (F — the *pattern*, not the tail)

- **did** — `sgum9oyi5l` hizo → did · `rz2ue36k0f` didn't · `zctehn9sxz` ¿hizo? → did…? · `zkkcxirv4g` No fui → I didn't go · `1m68s37p22` Did they go?
- **was / were** — `srl7scbt4x` [pasado] be → was · `gtp0cakjyi` → were · `waj96uzzcf` No estaba listo → I wasn't ready · `5tbq59flnh` weren't ·
  `zqul6ydgwq` había → there was · `ok7p2o1dce` → there were
- **regular -ed** — GAP: one rule row (*-é/-ó/-í past → -ed*, and the participle is the same word). The regular verbs in the course (*work, want, need, help, call, wait, use, open, close, start, finish, try, remember, look, live, talk, arrive, learn*) have no past rows and need none — the rule covers them.
- **irregular past + past participle of every verb already in the course** (owner, 2026-09-15). All exist as English-headed rows; Foundations takes exactly these pairs:
  be `srl7scbt4x` was `gtp0cakjyi` were `sia3vl9zuh` been · have `dyfhan9nwo` `rv6qhto601` had · do `9nyqu8uehx` did `m2led45ghj` done · make `lmc3z7ehft` `pekpg8dy8k` made · go `l3jqtqp7we` went `j75hzql7s8` gone · come `lbukbw3o1p` came `xdkhmkos1t` come · say `cij7k51kqk` `12lrm1b61l` said · tell `hwmvhbt7if` `radt5ut6yj` told · know `8w2jqzvm13` knew `m31kpazbri` known · see `6xhxr8sb7k` saw `fu4c8t7dei` seen · give `62spkcg55w` gave `iblqv731gx` given · get `e61dms0hq3` got `8k1ayyt6pc` got · take `s0htompife` took `bn0ps9sz3h` taken · think `vxo4j1a99j` `gryg1an0ql` thought · buy `rugw6w9oay` `0j5tjt1o7j` bought · pay `rpgb8mpa5f` `mrzig8vrnw` paid · read `59yagpqbix` `ror87had0q` read · sleep `nntgjqr7v0` `gv0nkhlrgg` slept · understand `vjcpdhjlly` `2xxvvzpd57` understood · begin `j6uswnegvw` began `vlkscuc232` begun · forget `ahyyzzzoq4` forgot `5jivy1ob66` forgotten · leave `hrbq6s2j6w` `ypd727s6hq` left · speak `m1vp7bjw6g` spoke `p4y3ag42a9` spoken · eat `nds3rzq7f8` ate `l6tfbrakge` eaten · drink `r2gyv054my` drank `hx302e3tcv` drunk · find `zmnamkbq3b` `nl08qe1e3q` found · put `vd3nut7nkt` `smpiiw148l` put · meet `ddtalrf2sa` `7j4xptyx41` met · feel `x1nx1z1a1p` `20ehjgbq4l` felt · bring `45hq45uq4y` `yktvtrhk80` brought · mean `op7475igzu` `gwo4msr8kw` meant · send `zui5vgopk6` `mon6vzw35r` sent · keep `96jj8crcsn` `rn03b9v8rd` kept · lose `e2vj5fksnk` `jx4ejh8c5y` lost · win `9p16t4wp8z` `a0584flbmr` won · write `k7qkmwozei` wrote `nf5qq29oke` written · hear `9dwskqsjd0` `51u4l72zq4` heard · let `92ealprsbd` `dxb9jzinrq` let · sit `nesbuszvq7` `ijdt2nva2a` sat · run `oiferzi4zi` ran `ur7p71snqp` run
  plus `cl4hfx7beh` podía → could · `v2jinicnwh` no pudo → couldn't. The other ~180 `[pasado]/[participio]` rows and the **sound-pattern families** (`sound:`) → **L** (owner: the sound technique is for the advanced portion).
- **present perfect** — **F** (follows from teaching the participles): `rvo8g5gv94` haber [hecho] → have [done] · `b6v2qryb2d`…`uwzxgiv5od` he/has/ha/hemos/han · `2pvko71bzc` no he → haven't · `v7y40xtgb3` ¿has…? → have you…? · `sqk4k5as8g` hecho → done
- past perfect, past progressive, *used to*, *would* (habitual) → **L**

## M. Commands (F)

`e3tv0u3qze` hazlo → do it · `aojc7un24g` no lo hagas → don't do it · `9v6o0rhpio` vamos → let's go ·
`8errr3uadz` hagámoslo → let's do it · `j6ba7pl20y` no lo hagamos → let's not · `do26qqvb93` Cierra la puerta → Close the door ·
`q98pxxzqf3` No cierres → Don't close · `9gmo1aoike` Veamos → Let's see
Piece: tú/usted/ustedes commands → one English form; *let's* = *vamos a / -mos*.

## N. Comparing (F)

`m7x949wtjj` más → more · `ke36yx8rke` que → than · `fyshadppn5` más importante → more important ·
`2fyfjvb91s` el más importante → the most important · `f62p62zg7o` mejor → better · `89nkgjqxfi` el mejor → the best ·
`r4n8t7puv8` peor → worse · `8wgwtlo4yb` el peor → the worst · `r9zf5ny811` tan … como → as … as ·
`5i08zx64uf` igual de → just as (F?) · `ifdijt1kj7` poco [adjetivo] → not very
`-er / -est` for short adjectives (`ntdw54v6qp` bigger, `wtxe2yjp1j` easier…) → **L** (the exception after the rule)

## O. Clauses (F)

`9qaylitnlb` que → that (*I think that…*) · `manx93glfl` saber que → know that · `juf9q9vio8` que (persona) → who ·
`waj2eefdj7` que (cosa) → that · `jyx1d6zq9f` lo que → what (*I don't understand what she said*) ·
`ufc23a1m04`…`s0tvpozw7u` que yo/tú/él/ella/nosotros/ellos [haga] → me/you/him/her/us/them to (*want me to*) — the object-control piece; it needs D first ·
`cbhs0k69zd` es [adjetivo] [hacer algo] → it is [adjective] to
Relative *which / whose / whom*, *lo cual* → **L**.

## P. Small rules that unlock many rows (F)

- **3rd-person -s** — `sfknobofbx` hace → does · `0qlz0zv1z5` tiene → has · `wlbaxqy8wx` va → goes · `w7w8ly9haz` es → is · `an6awlzdv1` termina → finishes
- **-mente → -ly** — `hcgacqlfv9` rápidamente → quickly · `a1lq9l1vf6` normalmente → normally (one piece, rest I)
- **cognate rules** — incidental (owner): pulled in when a target sentence needs the word. Candidates when they come up: `ivgg9evica` importante → important (*-ante → -ant*), `muzi1uasqh` posible → possible (*-ible → -ible*), `47i1df0k0i` necesario → necessary, `c3t870d60r` diferente → different. The 1,188 `cognate:` rows are **I**.
- **phrasal-verb pattern** — one piece with two exemplars: `vzbnervzfr` buscar → look for vs. GAP `mirar → look at`. The other 321 `grammar:phrasal-verb` rows → **L**.
- **numbers** — `b1u0tt59t0`…`g04obyf6c6` uno…doce → one…twelve (F); 13–1,000,000 and ordinals → **I** (ordinals 1st–3rd `9o6a4s1b8r` `b873sqi6dn` `tjcqfkkqiu` F?)
- **telling time / dates** — `ojgir22avr` ¿qué hora es? · `05558aoht5` son las → it's → **F?**

## Q. Starter vocabulary (I — not tagged; here so the drafter has an approved pool)

Verbs: hacer, hablar `4c0v1mewmv`, trabajar `s2wih9tkp4`, vivir `aawalesw7o`, comer `blyn87wx6n`, tomar `uidyeso1gn`, comprar `y4njcsmrzn`, pagar `8i7uc2z97a`, ayudar `zg737wtrp2`, llamar `vnowmg0rlw`, esperar `0b3lh44wbd`, entender `rfz1qo5i8n`, leer `z5hsuuicna`, usar `svksm10h8x`, empezar `ooo5pxwt1y`, terminar `1nm2wdol3n`, intentar `uu4qjzuter`, preferir `krnfpdxa43`, olvidar `93aj677j3n`, recordar `n2cao0hxwp`, buscar `vzbnervzfr`, abrir `9dbk50wj9u`, cerrar `qtbz9cya2h`, dormir `b29ry1lt3n`, ir a casa `k9y5vq9p06`, salir `3q9231a8nt`, llegar `bioalll4vj`, volver `q9clnuhnis`, conocer `lu5wncr0kf`, aprender — GAP (only the `==>` transformation row exists).
Nouns: día, cosa, inglés `9rswx58qx1`, español `0r3hwsp9ge`; GAP: *la casa, el trabajo, el tiempo, la gente / la persona, el amigo, el problema, la pregunta*.
Adjectives: `ivgg9evica` importante, `zogyll26ke` fácil, `ksmdrxloop` difícil, `zgccmkmabz` listo, `61km55vsoh` ocupado, `sjrhmb2fr3` grande, `eqr05lh2tu` pequeño, `x3v3e10qch` perfecto.

---

## Explicitly NOT Foundations (so nobody re-litigates it)

Phrasal verbs (323, minus the one pattern lesson) · cognate families (1,188) · the ser/estar + adjective tail (~230) · irregular past/participle tail (267) · perfect/progressive combinations, past perfect, future perfect · 2nd/3rd conditionals, *if I were you* · subjunctive (except *want him to*) · passive, causative (*have it done, make him do*) · reflexive/reciprocal beyond *me llamo / get up* · *se lo* double pronouns · possessive & demonstrative pronouns · *may / might / ought to / had better / supposed to / must* · *used to*, habitual *would* · quantifier nuances (few/a few/fewer/less/plenty/several/both/either/neither/such) · ordinals ≥ 4th, numbers ≥ 13 · discourse connectors · register variants (*wanna, gonna, gotta, could've*) · *-er/-est* · *whom / whose / which / what for* · transformations (`==>` rows, 253).

## Decisions for the owner (the F? items)

1. `must` (deber → must) — F or L? (I say L; *should* + *have to* cover it.)
2. `hay que → you have to` — F or L?
3. `me encanta → I love` — F alongside *me gusta*?
4. Indirect *le/les → to him/her/them* (and *me → to me*) — F?
5. Reflexive *se* piece (*me llamo, levantarse*, "se disappears") — F or L?
6. ~~Present perfect~~ — settled: **F**, since the participles of the course's verbs are taught.
7. *aunque → although*, *mientras → while*, *durante → during* — F or L?
8. Negative questions (*Don't you…?*) — F or L?
9. Ordinals 1st–3rd and telling time — F or I?
10. *cerca de / lejos de* — F or I?
11. *usted / ustedes* — treat as F pieces (Colombian default) — yes?

## GAPS — rows that must be added before Foundations is complete

**no → not** · **solo → only** · **mirar → look at** · **aprender → learn** ·
the regular **-ed** rule and the **-ing** rule as rule rows ·
starter nouns: **la casa, el trabajo, el tiempo, la gente, la persona, el amigo, el problema, la pregunta**.
(~14 rows, one `curriculum:concepts:add` manifest. Bare prepositions and Spanish-first
pasts were on this list until the owner's 2026-09-15 answers removed them: the three
preposition frames already exist, and every irregular past/participle in the course
already exists as an English-headed row.)

## What this means for cost

Foundations ≈ 440 existing rows (F? items and the 84 past/participle rows included) + ~14 new ones. One facet on ~440 rows, one add-manifest,
no remodel, no touching the other 3,900. The star-map / dependency idea can wait until
Foundations has been drafted into lessons and we see which "what can I teach next"
questions the drafter actually asks.
