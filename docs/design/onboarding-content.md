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

## Lesson 1

```script
# Hello.
@ hola
Llevo más de 14 años haciendo una sola cosa: llevar a personas desde cero hasta conversar en inglés.[[audio: Y eso es lo que vamos a hacer aquí, paso a paso.]]

[[es:hola]] es [[en:hello]], pronunciado *jelóu*.

? Escribe la respuesta en inglés. Con un teclado es más cómodo.
> hola / hello | hi

En una hora vas a decir [[en:I want you to come here]].
Muchos, después de años de clases, todavía no lo dicen bien.[[audio: Lo traducen palabra por palabra del español, y suena raro.]]

Si no recuerdas una palabra, presiona **Recuérdame**. Aquí nadie pierde puntos.

? Prueba el botón Recuérdame, solo para verlo.
> hola / hello | hi

Una frase empieza con mayúscula y termina con punto.

? Tu primera frase.
> Hola. / Hello. | Hi. (MAYÚSCULA al inicio y PUNTO al final.)
```

## Lesson 2

```script
# My name is ...
@ mi, nombre, ser
Por cierto: esta es una versión de prueba. Tu progreso se guarda solo en este navegador. Si borras sus datos, se pierde.

Ahora te voy a hacer una pregunta: [[en:What is your name?]][[audio: Significa: ¿cuál es tu nombre?]]
Para responder necesitas tres palabras.

[[es:mi]] es [[en:my]], pronunciado *mai*.

> mi / my

[[es:nombre]] es [[en:name]], pronunciado *neim*. Una sola sílaba.

> nombre / name

[[es:es]] se dice [[en:is]].

> es / is

? Repasemos.
| mi / my
| nombre / name
| es / is

[[en:What is your name?]]

? Responde en voz alta mientras escribes, y termina con tu nombre.
> Mi nombre / My name (Empieza con MAYÚSCULA.)
> es / is
> ? tu nombre / {name}.

[[en:Hi, {name}!]]
Mucho gusto.[[audio: Ya te presentaste en inglés.]]
```

## Lesson 3

```script
# What is your name?
@ qué, tu, nombre
Ahora te toca preguntar a ti, {name|amigo}.

[[es:qué]] o [[es:cuál]] es [[en:what]], pronunciado *uat*.

> cuál / what

[[es:tu]] es [[en:your]], pronunciado *yor*.

> tu / your

> mi / my
> tu / your

En inglés la pregunta solo lleva un signo, al final.

? Una pregunta completa. Dila en voz alta.
> ¿Cuál / What (Empieza con MAYÚSCULA.)
> es / is
> tu nombre? / your name? (Termina con el signo: name?)

? Y ahora la conversación entera.
> Hola. / Hello. | Hi.
> ¿Cuál es / What is
> tu nombre? / your name?

Las lecciones van en orden por una razón. Aunque algo te parezca fácil, no te saltes ninguna.

Eres de las primeras personas en probar esto, {name|amigo}. Si algo no se entiende o se ve mal, presiona **Comentar**.[[audio: Cada comentario me ayuda muchísimo.]]

Listo. Ya sabes cómo funciona. Ahora sí: tu primera lección.
```

## Curriculum gaps noticed (not fixed — curation is the owner's)

No row was found for **hola → hello** or for **nombre → name**; *qué/cuál → what* and *tu → your* were not checked (Postgres was down). Both are carried as unlinked
Covers labels until they exist. Logged in `docs/backlog.md`.
