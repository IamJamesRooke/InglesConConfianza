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

## Workarounds for features not built yet

- No "Entiendo" checkbox yet: the pre-alpha notice is a plain slide. When the acknowledge
  option exists, switch it on for that slide; the text does not change.
- No name capture yet: the name is a *given* piece ("..."). The learner types the sentence
  and says their own name aloud. When capture exists, a capture slide can precede it.

## Precondition

Lesson 3 tests "I'm". The matcher currently rejects the curly apostrophe that phone
keyboards insert, so **lesson 3 must not go live before that fix lands** — in a flow with no
close button it would trap every iPhone user. "I am" is also accepted as a safety net.

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

Si no recuerdas una palabra, presiona **Pista**. Aquí nadie pierde puntos.

? Prueba el botón Pista, solo para verlo.
> hola / hello | hi

Una frase empieza con mayúscula y termina con punto.

? Tu primera frase.
> Hola. / Hello. | Hi. (MAYÚSCULA al inicio y PUNTO al final.)
```

## Lesson 2

```script
# Hello, my name is ...
@ mi, nombre, ser
Por cierto: esta es una versión de prueba. Tu progreso se guarda solo en este navegador. Si borras sus datos, se pierde.

[[es:mi]] es [[en:my]], pronunciado *mai*.

> mi / my

[[es:nombre]] es [[en:name]], pronunciado *neim*. Una sola sílaba.

> nombre / name

> mi / my
> nombre / name

[[es:es]] se dice [[en:is]].

> es / is

? Repasemos.
| mi / my
| nombre / name
| es / is

Después de [[en:Hello]] va una coma.

? Dilo en voz alta mientras escribes, y termina con tu nombre.
> Hola, / Hello, | Hi, (No olvides la COMA.)
> mi nombre / my name
> es / is
> = ... / ...
```

## Lesson 3

```script
# Hello, I'm ...
@ ser
[[es:soy]] es [[en:I'm]], pronunciado *aim*. Lleva apóstrofo.

> soy / I'm | I am (Con APÓSTROFO: I'm.)

? Dilo en voz alta, con tu nombre.
> Hola, / Hello, | Hi,
> soy / I'm | I am
> = ... / ...

Las lecciones van en orden por una razón. Aunque algo te parezca fácil, no te saltes ninguna.

Eres de las primeras personas en probar esto. Si algo no se entiende o se ve mal, presiona **Comentar**.[[audio: Cada comentario me ayuda muchísimo.]]

Listo. Ya sabes cómo funciona. Ahora sí: tu primera lección.
```

## Curriculum gaps noticed (not fixed — curation is the owner's)

No row exists for **hola → hello** or for **nombre → name**. Both are carried as unlinked
Covers labels until they exist. Logged in `docs/backlog.md`.
