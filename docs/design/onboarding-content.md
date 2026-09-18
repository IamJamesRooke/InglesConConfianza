# Onboarding — first draft of the content (for the owner to edit)

> 2026-09-18. Drafted by the coordinator at the owner's request ("as best as you can, I can
> edit it later"). Three short lessons, about five minutes in total, written in the owner's
> own lesson style and delivered as lesson scripts. Every script below has been run through
> the real `parseScript`. Grounded in `onboarding-research.md` (read its "Confidence and
> gaps" first: only two sources were read directly, the rest are search summaries), the
> owner's notes in `backlog.md`, `teaching-methodology.md`, and the owner's existing
> lessons as the style reference.

## The decisions behind the draft

1. **It looks like the owner's lessons, not like a slideshow.** One-line explanations
   ("X es Y, pronunciado *z*"), an immediate single-piece retrieval after every new word,
   then a cumulative sentence; short Spanish instructions; rules taught through hints with
   CAPS; punctuation attached to the piece; the lesson title is its final English sentence.
2. **Typing starts in the first half minute.** The one primary source read directly (NN/g)
   says upfront tutorials get skipped. So only the promise is *told* before the first typed
   answer, about seventeen words. Everything else arrives as one short slide placed where it
   becomes relevant, followed straight away by doing.
3. **The first answer cannot fail.** *hola → hello*: nearly every Spanish speaker already
   knows it, and "hi" is accepted too. The early win matters more than novelty.
4. **Why not the research's "I want to go".** "I want" opens Confianza I, which is written
   assuming zero; teaching it here would hollow out lesson 1. A greeting and a name is also
   the owner's own idea, and the most natural first thing anyone says. It still uses real
   spine items (*mi → my*, *ser → is / I'm*).
5. **Punctuation is taught because the app requires it.** Verified against the matcher:
   capitals are forgiven, but a missing full stop or comma is rejected silently. So the full
   stop is taught before "Hello." and the comma before "Hello, my name is …".
6. **The wrong sentence is never shown or spoken.** The owner's hook contrasts "I want you
   to come here" with the literal mistranslation. The draft shows only the correct form; the
   narrator describes the mistake in Spanish. Voicing the wrong form with the taught-word
   emphasis would present it as something to learn. The owner can add it back if they want.
7. **Where each of the owner's wishes went.** Promise: slide 1. Keyboard: the instruction on
   the first typing slide. Say it aloud: the instruction on the first full sentence. Pre-alpha
   notice: opens lesson 2, just after the learner has made some progress worth protecting.
   Punctuation: by doing, with hints. Follow the order, feedback: one line each at the very
   end. The research would cut the feedback slide in favour of the always-visible button; it
   is kept because pre-alpha testers are the one audience for whom that message is the point.
8. **`[[audio:…]]` keeps slides terse and the voice warm.** A few slides say a little more
   than they show.

## Second draft (2026-09-18, later): the name conversation

The owner's idea replaces the first draft's lessons 2 and 3: the app asks "What is your
name?", the learner answers "My name is James", and the app greets them by name. The name
is a **capture piece** (`> ? tu nombre / {name}.`): the last piece of an ordinary sentence,
which accepts whatever the learner types and stores it as `name`. `{name}` then works in any
text. The voice cannot say a captured name (clips are pre-generated), so "Hi, {name}!"
shows the name and speaks "Hi!". The "I'm" lesson is dropped; a favourite-colour capture
can be added later with the same piece and a different key.

Still a workaround: no "Entiendo" checkbox, so the pre-alpha notice is a plain slide.

## Third draft (2026-09-18, evening): written for a Colombian beginner to low-intermediate

Owner: "think from the perspective of a Colombian Spanish speaker… What will make them
stay? What will make them leave?" The reasoning behind this version:

**Who they are.** Years of English at school, maybe an academy or an app, and still "entiendo
pero no hablo". They feel *pena* speaking, believe they are "malos para el inglés", and have
been sold to before (contracts, registrations, gamified apps that never got them talking).
Most will open this on a phone.

**What makes them stay.** A win in the first half minute. Being treated as an adult. A promise
aimed at their real pain (speaking, not studying). Proof that mistakes cost nothing. Seeing
early that the method is different: one word, use it, build a sentence. Being called by their
name. A teacher who is a person ("lo leo yo mismo"). For the low-intermediate learner: one
sentence they *think* they know and do not ("I want you to come here"), so they see there is
something here for them too.

**What makes them leave.** Reading before doing. Being asked for an account or an e-mail (so
the notice says we do not). Feeling stupid: the app rejects "hello" without its full stop and
says nothing, so the rule is taught with a diagram, the phone trick for typing a full stop is
given, and Recuérdame is practised on purpose with a wrong answer so they see it marks the
error. Being told a phone is second best (it now says the phone works fine). Childishness,
hype, and Spanish from Spain.

**Voice.** *Tú*, warm and direct, neutral Latin American with a light Colombian touch where it
is natural ("te provoca", "¿cierto?", "listo", "celular", "computador"). Nothing forced.

**Images.** Four diagrams drawn for this, in the owner's Excalidraw spirit and the app's
colours (Spanish red, English blue, purple for what is being pointed at), stored in
`web/public/lesson-media/`. No stock photos: generic photos read as advertising. The one photo
worth adding is the owner's own face on the first slide — "Llevo más de 14 años…" lands harder
with a person attached. Left for the owner.

## Lesson 1

```script
# Hello.
@ hola
Aquí no vienes a estudiar inglés. Vienes a **hablarlo**.
Llevo más de 14 años llevando a personas desde cero hasta conversar. Este es mi método.

Empecemos por lo más fácil, para que veas cómo funciona.
[[es:hola]] es [[en:hello]], pronunciado *jelóu*.

? Escribe en inglés. En el celular funciona bien; con computador es más cómodo.
> hola / hello | hi

Así es todo el curso: aprendes una palabra, la usas, y seguimos.
Aquí nadie pierde puntos ni vidas.

Si algo se te olvida, toca **Recuérdame**. Para eso está.

? Pruébalo: escribe helo, con un error, y toca Recuérdame.
> hola / hello | hi

[[img: frase-mayuscula-punto.svg | Hello con mayúscula inicial y punto final]]
Una frase empieza con mayúscula y termina con punto.
En el celular, dos toques a la barra espaciadora ponen el punto.

? Tu primera frase.
> Hola. / Hello. | Hi. (MAYÚSCULA al inicio y PUNTO al final.)

[[img: quiero-que-vengas.svg | quiero que vengas se dice I want you to come: el que no se traduce]]
¿Ya sabes algo de inglés? Mejor. Pronto vas a decir [[en:I want you to come here]].
Si ahí te provoca meter un *that*, tranquilo: aquí se te quita.[[audio: Le pasa a casi todo el mundo.]]
```

## Lesson 2

```script
# My name is ...
@ mi, nombre, ser
Una cosa antes de seguir: esta es una versión de prueba.
No te pedimos cuenta ni correo. Tu progreso se guarda solo en este celular o computador.

Ahora te voy a hacer una pregunta: [[en:What is your name?]][[audio: Significa: ¿cuál es tu nombre?]]
Para responder necesitas tres palabras.

[[es:mi]] es [[en:my]], pronunciado *mai*.

> mi / my

[[es:nombre]] es [[en:name]], pronunciado *neim*. Una sola sílaba: no digas *na-me*.

> nombre / name

[[es:es]] se dice [[en:is]].

> es / is

? Repasemos.
| mi / my
| nombre / name
| es / is

[[img: mi-nombre-es.svg | mi es my, nombre es name, es es is: palabra por palabra]]
Esta vez el inglés va igual que el español, palabra por palabra.
No siempre es así, pero hoy sí.

[[en:What is your name?]]

? Responde en voz alta mientras escribes. Nadie te está oyendo.
> Mi nombre / My name (Empieza con MAYÚSCULA.)
> es / is
> ? tu nombre / {name}.

[[en:Hi, {name}!]]
Mucho gusto. Ya te presentaste en inglés.[[audio: Y lo dijiste en voz alta, ¿cierto?]]
```

## Lesson 3

```script
# What is your name?
@ qué, tu, nombre
Ahora te toca preguntar a ti, {name}.

En español preguntamos *cuál*. En inglés, para el nombre se usa [[en:what]], pronunciado *uat*.

> cuál / what

[[es:tu]] es [[en:your]], pronunciado *yor*.

> tu / your

? No los confundas.
> mi / my
> tu / your

[[img: pregunta-un-signo.svg | En español la pregunta lleva dos signos; en inglés, uno solo al final]]
En inglés la pregunta lleva un solo signo, al final.
En el celular está en el teclado de símbolos.

? Una pregunta completa. Dila en voz alta.
> ¿Cuál / What (Empieza con MAYÚSCULA.)
> es / is
> tu nombre? / your name? (Termina con el signo: name?)

? Y ahora la conversación entera.
> Hola. / Hello. | Hi.
> ¿Cuál es / What is
> tu nombre? / your name?

Las lecciones van en orden por una razón: cada una usa lo de la anterior.
Aunque algo te parezca fácil, no te saltes ninguna.

Eres de las primeras personas en probar esto, {name}.
Si algo no se entiende, se ve raro o te gustó, toca **Comentar**. Lo leo yo mismo.

Listo, {name}. Ya sabes cómo funciona.
Ahora sí: tu primera lección.
```

## Curriculum gaps noticed (not fixed — curation is the owner's)

No row was found for **hola → hello** or for **nombre → name**; *qué/cuál → what* and *tu → your* were not checked (Postgres was down). Both are carried as unlinked
Covers labels until they exist. Logged in `docs/backlog.md`.
