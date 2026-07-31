# Curriculum Inclusion Candidates

This is a decision artifact, not curriculum. Nothing listed here is automatically approved for inclusion.

The audit asked one question:

> Does the existing curriculum appear to omit a frequent meaning, contrast, or construction that a Spanish-speaking learner could not reliably infer?

Direct concrete vocabulary such as **casa = house**, ordinary low-ambiguity nouns and adjectives, transparent cognates, and forms generated predictably by an existing rule were normally excluded.

## Decision key

- [ ] **Include**
- [ ] **Reject**
- [ ] **Investigate further**

Status:

- **Missing** — no focused treatment was found.
- **Partial** — a basic meaning or related lesson exists, but important branches appear absent.
- **Uncertain** — related examples exist, but the distinction may not be taught explicitly enough for mastery.

Priority:

- **Critical** — very frequent, structurally important, highly ambiguous, or strongly affected by Spanish interference.
- **High** — common and meaningfully unpredictable.
- **Review** — lower-frequency, regional, formal, or less certain, but retained under the “when in doubt” instruction.

## Audit basis

The audit used the first 2,000 entries from each downloaded discovery list, then searched the complete Markdown curriculum by lemma, form, translation, construction, and related examples.

- English discovery data: [5,000-word lemma/POS frequency list](https://github.com/filiph/english_words/blob/master/data/word-freq-top5000.csv), cross-checked against the [BNC-derived 2,000-word lemmatized list](https://www.conlang.info/wordfreq.html) and spoken-frequency evidence from [SUBTLEX-US](https://www.npmjs.com/package/subtlex-word-frequencies).
- Spanish discovery data: [Spanish lemma/POS frequency data](https://github.com/doozan/spanish_data), cross-checked against the RAE CREA and Davies corpus descriptions summarized in [Most common words in Spanish](https://en.wikipedia.org/wiki/Most_common_words_in_Spanish) and the downloadable [Corpus del Español lemma lists](https://www.corpusdelespanol.org/web-dial/help/download.asp).

Frequency rank varies by corpus. The bands below are deliberately approximate:

- **E/S 1–500**
- **E/S 501–1,000**
- **E/S 1,001–2,000**
- **Construction** — important phrase or distinction not reliably discoverable through isolated-word ranking

---

# Highest-priority candidates

These candidates have the strongest combination of frequency, ambiguity, productivity, and likely Spanish-to-English transfer errors.

## Spanish **se** and related forms

| Decision | Priority | Candidate | Status | Missing or uncertain distinction | Minimal contrast | Existing evidence |
|---|---|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | **se / sé** | Partial | The pronoun lesson covers reflexive, reciprocal, **se lo**, and pronominal verbs, but not the unrelated accented forms or all impersonal constructions. | **Yo sé** = I know; **Sé bueno** = Be good; **No se puede** = It cannot be done. | [Translations of se](foundations/pronouns/personal/confusion-sets/spanish-to-english/translations-se.md) |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | impersonal **se** | Missing | English normally supplies **people, you, they, one**, or a passive structure. | **Aquí se trabaja mucho.** = People work hard here. | The existing **se** lesson does not isolate this use. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | passive **se** | Missing | Spanish suppresses the agent; English often uses a passive or active restructuring. | **Se venden apartamentos.** = Apartments are sold / Apartments for sale. | No focused passive-**se** lesson found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | accidental **se** | Missing | English changes the perspective and normally names the affected person as subject. | **Se me olvidaron las llaves.** = I forgot my keys. | No focused **se me/se te/se le** lesson found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | pronominal meaning changes | Partial | Some verbs change meaning with **se**, not merely reflexivity. | **ir / irse**, **dormir / dormirse**, **llevar / llevarse**, **quedar / quedarse** | **Llamarse** appears, but no systematic contrast was found. |

## Critical Spanish translation maps

| Decision | Band | Candidate | Status | Why it may deserve a map | Minimal contrast | Existing evidence |
|---|---|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **por** | Missing | Extremely frequent: **by, through, along, because of, for, per**, exchange, duration, cause and agent. It also competes with **para**. | **Lo hice por ti / para ti.** = I did it because of you / for you. | **Para**, **a**, and **de** have maps; no dedicated **por** map was found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **quedar / quedarse** | Partial | **remain, be left, fit, suit, be located, arrange to meet, stay, turn out/look**. | **Quedan dos. / Me queda bien. / Quedamos a las ocho.** | **Be left = quedar** exists, but only scattered additional examples were found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **llevar / llevarse** | Partial | **carry, take, wear, have been doing, take time, get along, take away**. Destination changes **take/bring**. | **Llevo el café a Ana. / Llevo dos años aquí. / Lleva camisa.** | Basic [taking and bringing](foundations/verbs/core-verbs/sending-and-receiving/taking-and-bringing.md) does not appear to cover the full map. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **pasar** | Partial | **pass, happen, spend time, go/come in, hand something, cross, be wrong with**. | **¿Qué pasó? / Pasa. / Lo pasé bien. / Pásame la sal.** | Scattered examples; no complete map found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **hacer** | Partial | Beyond **do/make**: weather, elapsed time, causative **make/have**, effect and fixed combinations. | **Hace frío. / Hace dos años. / Me hizo reír.** | [Do and make](foundations/verbs/core-verbs/doing-and-making/do-and-make.md) covers the core contrast only. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **haber** | Partial | Perfect auxiliary, **hay**, past existence, **hay que**, probability and formal impersonal uses. | **Hay dos. / Hay que salir. / Debe de haber sido difícil.** | Perfect forms and **there + be** exist, but no Spanish-first complete **haber** map was found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **dar / darse** | Partial | **give**, cause a feeling, face a direction, realize, equal/not matter, take a class, turn something on. | **Me da miedo. / Da al norte. / Me di cuenta. / Me da igual.** | Core giving is covered; the other branches appear absent. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **poner / ponerse** | Partial | **put, set, turn on, start doing, become**, clothing and emotional changes. | **Pon la mesa. / Pon la luz. / Se puso triste.** | Basic [take, put and leave](foundations/verbs/core-verbs/taking-and-putting/take-put-and-leave.md) covers placement only. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **salir** | Partial | **leave, go out, come out, turn out, cost, appear, date someone**, succeed/come off. | **Salió bien. / Sale caro. / Salgo con Ana.** | Basic staying/leaving and movement examples exist. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **seguir** | Partial | **follow, continue, keep doing, still be**, directions and social-media following. | **Sigue recto. / Sigue trabajando. / Sigue enfermo.** | A few examples were found, but no full translation map. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **tocar** | Missing | **touch, play an instrument, be someone’s turn, have to/be one’s lot**, knock/ring. | **Me toca trabajar. / Me toca a mí. / Toca piano.** | No curriculum occurrence found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **sacar** | Missing | **take out, remove, get/obtain, take a photo, earn a grade, figure out**, bring out. | **Saqué una foto. / Saqué cinco. / Saca la basura.** | No curriculum occurrence found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **contar / contar con** | Missing | **count, tell, include, rely on**. | **Cuenta el dinero. / Cuéntame. / Cuenta conmigo.** | Only an incidental occurrence was found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **tratar / tratar de / tratarse de** | Missing | **treat, deal with, try to, be about**. | **Trata de dormir. / Se trata de dinero. / Me trató bien.** | Only incidental cognate examples found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–2,000 | **faltar** | Missing | **be missing, lack, be absent, remain until, need**, fail to attend. | **Faltan cinco minutos. / Me falta dinero. / Ana faltó.** | No curriculum occurrence found. |

## Critical English contextual-use maps

| Decision | Band | Candidate | Status | Why it may deserve a map | Minimal contrast | Existing evidence |
|---|---|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **take** | Partial | **tomar, llevar, tardar, aceptar, requerir**, transport, medicine, photos, courses and numerous particles. | **Take this. / Take it to Ana. / It takes an hour. / Take a photo.** | Basic [take/put/leave](foundations/verbs/core-verbs/taking-and-putting/take-put-and-leave.md) and movement contrasts exist. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **go** | Partial | Movement plus **become, function, match, be available, happen**, future and particle constructions. | **Go home. / The milk went bad. / The alarm went off. / This goes with that.** | Core movement, **going to**, **go back**, and particles are distributed across lessons. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **come** | Partial | Movement plus origin, availability, sequence, result and particles: **come from, come first, come true, come off, come across**. | **She came home. / It came true. / I came across it.** | Core movement and several particle examples exist, but no unified map. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **put** | Partial | Placement plus **express, invest, assign, tolerate** and productive particles. | **Put it here. / Put it in writing. / Put up with it. / Put off the meeting.** | Placement and several particle lessons exist, but coverage is scattered. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **turn** | Partial | **girar, voltear, convertirse, cumplir**, switch, sequence and particles. | **Turn left. / Turn it on. / She turned 30. / It turned out well.** | Direction and **turn on/off** occur, but no complete map. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **set** | Partial | **poner, fijar, establecer, ambientar, programar**, become firm and many fixed combinations. | **Set the table. / Set a date. / Set the alarm. / The story is set in Bogotá.** | Mostly irregular-form and incidental examples. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **run** | Partial | **correr, funcionar, administrar, durar, postularse**, flow and become depleted. | **I run daily. / She runs a company. / It runs on batteries. / We ran out.** | Basic running and some particle uses exist. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **work** | Partial | **trabajar, funcionar, servir, dar resultado**, exercise, calculate and particles. | **I work here. / It works. / Work it out. / The plan worked.** | [Working and functioning](foundations/verbs/core-verbs/living-learning-and-working/working-and-functioning.md) covers two core senses. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **call** | Partial | Telephone, name, summon, describe, decide/cancel and particles. | **Call Ana. / Call it a mistake. / Call off the meeting. / It’s called…** | Calling a person and **call off** exist separately. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **play** | Missing/partial | Games, instruments, media, roles, pretending and manipulating. | **Play football. / Play the piano. / Play the video. / Play a role.** | Very limited scattered coverage. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **hold** | Missing/partial | Physically hold, contain, organize an event, keep a position, wait and particles. | **Hold this. / The room holds 20. / Hold a meeting. / Hold on.** | Mostly irregular-form examples. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **pass** | Missing/partial | **pasar, aprobar, adelantar, entregar, morir**, time and opportunity. | **Pass the salt. / Pass the exam. / Time passed. / He passed away.** | Few scattered examples. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **miss** | Missing/partial | **extrañar, perder, no alcanzar, no acertar, no asistir**, fail to notice. | **I miss you. / I missed the bus. / I missed the point.** | No focused contrast found. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **point** | Partial | Physical point, purpose, argument, score, moment and **point out**. | **Point at it. / What’s the point? / She pointed out the error.** | Scattered examples; no unified map. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **deal / deal with** | Missing | Distribute cards, agreement, quantity and handling a situation. | **Deal the cards. / It’s a good deal. / Deal with the problem.** | Only isolated occurrences. |

---

# Spanish-to-English candidates

## High-frequency polysemous verbs

| Decision | Band | Candidate | Status | Translation branches or constructions to review |
|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **dejar** | Partial | **leave, let, allow, stop doing, lend, abandon, leave behind**. Existing [three translations](advanced/english-to-spanish-translations/verbs/leave-and-left/05-three-translations-of-dejar.md) are strong but may not cover **dejar + adjective**, **dejar plantado**, or lending. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **volver / volverse** | Partial | **return, come/go back, do again, become**: **volver a hacer**, **volverse difícil**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **llegar** | Partial | **arrive, reach, get to, manage to, become**, emphatic **llegar a**. Basic arrival is covered. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **sentir / sentirse** | Partial | Physical/emotional **feel**, regret **I’m sorry**, sensing and **feel like** contrasts. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **parecer / parecerse** | Missing/partial | **seem, look, appear, think/opinion**, resemble. **¿Qué te parece?** does not map word-for-word. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **tomar** | Partial | **take, drink, catch transport, make a decision, take time/measurements**, occupy. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **llamar / llamarse** | Partial | **call, phone, name, attract attention, be called**. Basic calling and **llamarse** exist separately. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **acabar / acabar de** | Partial | **finish, end up, have just done, use up**. **Acabar de** is already covered under **de**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **valer** | Missing | **be worth, cost, be valid, be useful**, **vale**, **más vale**, **no vale la pena**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **caer / caerse** | Missing | **fall, drop, land on a date, realize, like/dislike someone**, **caer bien/mal**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **echar** | Missing | **throw, put/add, pour, send away, miss, start doing**, **echar de menos**, **echar a perder**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **meter / meterse** | Missing | **put in, insert, involve, get into, interfere**, fit someone/something in. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **subir / bajar** | Missing/partial | Go/come **up/down**, raise/lower, upload/download, get on/off transport, volume and prices. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **coger** | Missing | Colombian-sensitive map: **take, catch, pick up, grab**, transport; warn about the sexual meaning in some regions. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **mandar** | Missing | **send, order, be in charge**, have something done. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **probar / probarse** | Missing | **try, try on, taste, test, prove**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **soler** | Missing | English restructures it as **usually / tend to / used to**, depending on time. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **recoger** | Missing | **pick up, collect, gather, tidy up**, retrieve. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **quitar / quitarse** | Missing | **remove, take away, turn off, prevent**, take clothing off, get rid of a feeling. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **pegar** | Missing | **stick/glue, hit, infect/catch, suit/match**, **pegarse**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **encargar / encargarse de** | Missing | **order, commission, put in charge, take care of**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **fijar / fijarse** | Missing | **fix/set, establish, notice/pay attention**. **Fíjate** rarely translates as *fix yourself*. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **apuntar / apuntarse** | Missing | **point, write down, aim, sign up**, indicate. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **marcar** | Missing | **mark, dial, score, indicate, set**, make a difference. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **cargar / cargarse** | Missing | **carry, load, charge, burden, blame**, damage/kill informally. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **montar** | Missing/partial | **ride, mount, assemble, set up, stage**, get in/on. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **lucir** | Missing | **shine, look, wear/show off**, **lucirse**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **extrañar** | Missing | Colombian/Latin American **miss**, find strange; contrast with **extraño = strange**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **acordar / acordarse de** | Missing/partial | **agree/decide** versus **remember**. Existing **recordar** material does not appear to give this a full contrast. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **resultar** | Missing | **result, turn out, prove to be, be convenient/strange**, work for someone. |

## Spanish function words and connectors

| Decision | Band | Candidate | Status | Distinctions to review |
|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **ya** | Partial | **already, now, by now, anymore, enough**, emphasis and **ya que = since/because**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **todavía / aún** | Partial | **still, yet, even**, comparative **aún más**; accent-sensitive **aun = even**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 501–1,000 | **apenas** | Partial | **hardly, barely, as soon as, only just**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **luego** | Partial | **then, later, therefore** in some registers; **desde luego**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1,001–2,000 | **recién** | Missing | **just/recently**, Latin American **recién + past**, adjective **recién hecho/nacido**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **hasta** | Partial | **until, up to, as far as, even**, **hasta que**, negative **not until** restructuring. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **según** | Missing | **according to, depending on, as**, **según yo/tú**, and source attribution. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **mientras / mientras que** | Partial | **while, whereas, as long as**. Existing **while** material may not cover every Spanish branch. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **sino / si no** | Partial | **but rather/but**, **except**, **if not**; spelling changes the structure. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **ni** | Partial | **nor, neither, not even, either** after a negative; **ni siquiera**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **bien** | Partial | **well, fine, right, properly, quite**, concession **si bien**, alternative **bien…bien**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **tan / tanto** | Partial | **so, as, such, so much/many**, **tanto…como**, **mientras tanto**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **igual** | Missing/partial | **equal, same, just as, maybe, anyway, it doesn’t matter**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **mismo** | Partial | **same, self, very/exact, right**, **ahora mismo**, **lo mismo**, **por sí mismo**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **pues** | Missing | **well, then, because/since, therefore**, discourse softening and consequence. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **tras** | Missing | **after, behind, in pursuit of**, repeated **tras** and compounds such as **detrás**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **entre** | Partial | **between, among, into**, reciprocal distribution and **entre más…más** in Colombian usage. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | S 1–500 | **hacia** | Partial | **toward, approximately**, attitude **hacia alguien**; contrast with **hasta**. |

---

# English-to-Spanish candidates

## High-frequency contextual verbs

| Decision | Band | Candidate | Status | Meanings or constructions to review |
|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **bring** | Partial | **traer/llevar**, cause, introduce, **bring up, bring back, bring about**. Basic destination contrast exists. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **carry** | Missing/partial | Carry physically, stock/sell, transmit, support, continue and **carry out/on/over**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **move** | Partial | Physical movement, relocate, affect emotionally, make a move, proceed, motion in a meeting. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **stand** | Partial | Stand upright, tolerate, represent, remain valid, be located, **stand for/out/by**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **fall** | Partial | Fall physically, become, occur on a date, decrease, **fall asleep/behind/apart/for**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **break** | Partial | Break an object/rule/record, take a break, reveal news, stop functioning, **break down/up/out**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **matter** | Partial/uncertain | **importar, asunto, materia**, **no matter**, **what matters**. Related material exists under [importar](advanced/spanish-to-english-translations/verbs/importar-y-molestar/README.md). |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **check** | Missing/partial | Verify, inspect, bill, check mark, baggage, restrain and **check in/out/on**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **pick** | Missing | Choose, harvest, remove, criticize and **pick up/out/on**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **wonder** | Missing | Ask oneself, polite request **I was wondering…**, surprise/awe and **no wonder**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **guess** | Missing | Guess an answer, soften an opinion (**I guess**), suppose. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **tend / tend to** | Missing | **tend to = soler/tener tendencia**, tend/care for, move toward. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **roll** | Missing | Roll physically, rotate, list, bread, progress and **roll out/up/over**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **deliver** | Missing/partial | Deliver an item/message, give a speech, produce a result, deliver a baby. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **approach** | Missing/partial | Come near, deal with a problem, method/approach, contact someone. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **engage** | Missing | Engage attention, hire, participate, become engaged, engage with/in. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **dress** | Missing/partial | Get dressed, dress someone, wear formal clothes, dress a wound/salad. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **tie** | Missing | Tie a knot, equal a score, connect, necktie and **tie up/in**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **grab** | Missing/partial | Grab physically, get food, capture attention/opportunity, informal **go grab**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **slip** | Missing | Slide accidentally, make a small mistake, deteriorate, secretly insert and **slip away/up**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **issue** | Missing | Topic/problem, edition, officially give, **take issue with**, **at issue**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **grant** | Missing | Give formally, admit a point (**granted**), funding award. |

## English function words, prepositions and fixed constructions

| Decision | Band | Candidate | Status | Distinctions to review |
|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **still** | Partial | Continuing **todavía**, nevertheless **aun así**, motionless **quieto**, comparative emphasis. [Time lesson](foundations/time/relative-time/just-already-yet-and-still.md) covers the temporal core. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **already** | Partial | **ya**, earlier than expected, impatience (**Enough already!**), perfect/past placement. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **enough** | Partial | **enough + noun**, adjective/adverb + **enough**, **enough of**, **good enough to**, **enough is enough**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–500 | **once** | Partial | One time, formerly, **once + clause**, **once again**, **at once**. Existing lesson focuses on “one time.” |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **against** | Missing/partial | Physical contact, opposition, protection, comparison/background and exchange/odds. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **among / between** | Partial | Two-versus-group shortcut is incomplete; relationships, choices, distribution and **between you and me**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **upon** | Missing | Formal/literary **on**, immediately after (**upon arrival**), dependence (**depend upon**), repeated events. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1–1,000 | **despite / in spite of** | Missing/partial | Noun or **-ing** follows; contrast with **although/even though + clause**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 501–1,000 | **per** | Missing | **por/cada/según**, rates, **per person**, **as per**; distinguish from **for**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **due / due to** | Missing | Expected/scheduled, owed, suitable direction, **because of**, **be due to do**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | E 1,001–2,000 | **aside** | Missing/partial | To one side, **aside from**, **set/put aside**, theatrical aside. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Construction | **in case / in case of** | Missing/uncertain | Precaution, not ordinary **if**: **Take an umbrella in case it rains.** |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Construction | **as soon as / once / when** | Uncertain | Time connectors can require present form for future meaning: **Call me when you arrive.** |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Construction | **no longer / not anymore / still / yet** | Partial | One coherent contrast may be more teachable than scattered time-word entries. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Construction | **end up + -ing** | Missing/uncertain | Common result construction corresponding to **terminar/acabar + gerundio**. |

---

# Construction-level candidates that isolated frequency lists can miss

| Decision | Priority | Candidate | Status | Why it matters |
|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | Spanish **gustar-type** agreement as a family | Partial | **gustar** is covered, but verify **encantar, interesar, faltar, doler, importar, quedar** with indirect-object pronouns and post-verbal subjects. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | redundant Spanish indirect object → one English object | Uncertain | **A Juan le di el libro** becomes **I gave Juan the book / I gave the book to Juan**, not two English objects referring to Juan. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | Spanish subject omission versus required English subject | Uncertain | **Llueve, dicen que…, es importante…** normally require **it/they** or another explicit English subject. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | dummy **it** | Partial | Weather, time, distance and extraposition: **It’s raining; it’s three; it’s far; it’s important to go**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | generic **you/they/people/one** | Missing/uncertain | Frequent English solution for Spanish impersonal constructions, especially impersonal **se**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Critical | **hay que + infinitive** | Missing/uncertain | Depending on context: **you have to, one must, it is necessary to, we need to**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **llevar + duration + gerund** | Missing | **Llevo dos años trabajando aquí** = **I have been working here for two years**, not *I carry two years*. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **seguir + gerund/adjective** | Missing | **Sigue trabajando / enfermo** = **He is still working/sick; he keeps working**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **volver a + infinitive** | Missing/partial | Usually **do again**, not literal *return to do*: **Volvió a llamar** = **She called again**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **dejar de + infinitive** versus **stop to do** | Partial | **Dejó de fumar** = stopped smoking; **stopped to smoke** means paused another activity in order to smoke. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **quedar + quantity/time** | Partial | **Quedan cinco / faltan cinco minutos** require **there are five left / five minutes remain**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **tener** expressions beyond possession | Partial | Age, hunger, fear, heat, success/luck, **tener que**, **tener ganas de**, **tener razón**. Some are distributed across **be** lessons. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **lo + adjective / lo que** | Partial | Neutral abstraction: **lo importante, lo difícil, lo que quiero**; English restructures with **what** or a noun phrase. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **hacer que / dejar que** | Partial | Causative and permission patterns: **make/have/let someone do**, usually without **to** after **make/let**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **would** meaning past habit, conditional result, willingness and politeness | Partial | The modal drill gives form practice; verify explicit meaning contrasts and Spanish mappings. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | English verb + object + particle placement | Partial | **Turn it off**, not *turn off it*; nouns may allow two positions while pronouns normally go in the middle. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | separable versus inseparable phrasal verbs | Uncertain | Compare **pick it up**, **look after it**, **run into it**. Particle lessons may not state the complete placement rule. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | English preposition stranding | Uncertain | **Who are you talking to? What is it made of?** contrasts with Spanish word order. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | motion destination with no preposition | Partial | **go home, come here, arrive home**, but **go to work, arrive at the office**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | verbs of perception + object + base/**-ing** | Missing/uncertain | **I saw her cross the street / crossing the street** changes whole-event versus ongoing perspective. |

---

# False-friend and interference candidates not clearly isolated

The curriculum already has a substantial [verb false-cognate map](foundations/cognates/05-confusion-sets/verb-false-cognates.md). These are retained only where the audited distinction may remain absent or deserves confirmation.

| Decision | Priority | Candidate | Status | Contrast to review |
|---|---|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **actual / actualmente** | Uncertain | **actual = real**, **currently = actualmente**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **eventually / eventualmente** | Uncertain | **eventually = finalmente/con el tiempo**; Spanish **eventualmente** can mean occasionally/possibly depending on region. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **sensible / sensitive** | Uncertain | English **sensible = sensato**; Spanish **sensible = sensitive**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **library / librería** | Uncertain | **library = biblioteca**; **librería = bookstore/bookshop**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **career / carrera** | Uncertain | Career, university degree/major, race and course/path. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | High | **success / succeed / éxito** | Partial | Existing false-cognate material contrasts **suceder/succeed**; verify the productive **éxito/tener éxito/lograr** family. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Review | **compromise / compromiso** | Partial | Existing verb lesson covers **comprometerse**; verify noun meanings: commitment, engagement, compromise. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Review | **constipated / constipado** | Missing | English **constipated = estreñido**; Spanish **constipado** can mean having a cold in some regions. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Review | **argument / argumento** | Uncertain | English **argument** often means dispute; Spanish **argumento** often means reasoning or plot. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | Review | **record / recordar** | Partial | English **record** is not *remember*; distinguish noun/verb pronunciations and **recordar = remember/remind**. |

---

# Lower-confidence candidates retained for review

These are deliberately included because coverage is scattered, frequency is corpus-dependent, or the item may be less central to Colombian learners.

| Decision | Candidate | Why it remains a candidate |
|---|---|---|
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **somehow / somehow or other** | Common discourse word with several Spanish restructurings: **de alguna manera, como sea**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **apparently / seemingly / it seems** | Different confidence levels and Spanish **al parecer, aparentemente, parece que**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **actually / really / currently** | **Actually** often corrects information and is not **actualmente**; related **really** material exists. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **eventually / finally / in the end / at the end** | Common Spanish interference around **eventualmente, finalmente, al final**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **hardly / barely / scarcely** | Negative-like meaning, inversion in formal structures and Spanish **apenas/casi no**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **otherwise** | **de lo contrario, aparte de eso, de otra manera**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **forth** | Mostly fixed expressions: **and so forth, back and forth, set forth**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **beneath** | Physical **debajo de** plus figurative **beneath someone / beneath consideration**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **andar** | **walk, go around, be/function**, ongoing behavior and approximation; absent despite high spoken value. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **bastar** | English restructures **basta con / basta + infinitive** as **it is enough to / all you need is**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **enterarse de** | **find out/hear/learn**, not direct *enter*. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **doler** | **me duele** requires body-part agreement and English possession: **my head hurts / I have a headache**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **caber** | **fit, have room, be possible**, **cabe destacar**; low direct translatability. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **aprovechar** | **take advantage of, make use of, enjoy**, and polite **que aproveche**. |
| - [ ] Include<br>- [ ] Reject<br>- [ ] Investigate | **rendir / rendirse** | **yield, perform, pay off, take an exam, surrender**. |

---

# Owner review summary

No candidate has been added to the curriculum.

Suggested review order:

1. Spanish **se** and the critical Spanish translation maps.
2. Critical English contextual verbs.
3. Construction-level candidates.
4. Spanish function words.
5. Remaining English and Spanish polysemy.
6. False-friend confirmations.
7. Lower-confidence candidates.

When reviewing an item, select exactly one decision:

- **Include** — later create or expand curriculum material.
- **Reject** — deliberately exclude it.
- **Investigate further** — preserve it for a deeper usage or corpus check.
