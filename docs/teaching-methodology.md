# Teaching Methodology

This is the working reference for the teaching principles behind Inglés Con Confianza.

When the owner explains a teaching principle, lesson behavior, or preferred student experience, add it here. Use this document when designing curriculum data, lesson steps, prompts, feedback, and learner-facing UI.

## Audience and language

- The initial learner is a Spanish-speaking adult, with Latin American Spanish as the default context.
- Learner-facing explanations and UI should be in clear, natural Latin American Spanish.
- Use the `tú` form when speaking directly to one learner.
- English remains the target language being produced, so English answers, examples, and target forms should remain visible where they are being taught.
- Do not use grammatical terminology with the student unless it is absolutely necessary for the task. Terms such as “present participle” belong in teacher and course-design documentation, not in the learner-facing lesson.

## Teacher voice

- The teacher explains briefly, then invites the learner to discover or retrieve the answer.
- The tone should feel warm, energetic, encouraging, and immediately useful.
- Lessons should create frequent moments of: “¡Ah, es así de fácil!”
- Use short explanations, visible patterns, quick questions, and immediate positive feedback.
- The learner is an adult. The experience can be playful and visually engaging without becoming childish.
- Emojis and symbols such as `✨`, `🎉`, and `😊` are welcome when they reinforce encouragement or a milestone. Use them intentionally rather than decorating every sentence.

## Live-teaching lesson loop

The core lesson rhythm is:

1. Explain a small idea.
2. Show a clear example or visual pattern.
3. Ask the learner to retrieve the answer.
4. Accept the answer immediately when it is correct.
5. Give short, positive feedback.
6. Build the idea into a larger phrase or sentence.
7. Reuse the idea in a later question.

The application should feel like a patient teacher guiding a live conversation, not like a worksheet full of instructions.

## Flow, challenge, and momentum

One major inspiration is Mihaly Csikszentmihalyi's concept of **flow**: the learner should stay in the sweet spot where the task is not so easy that it becomes boring and not so difficult that it becomes frustrating.

- Lessons should create constant small wins.
- Progress should feel incremental, visible, and earned.
- Each step should ask for one reachable action, then quickly move forward.
- If a learner is getting everything instantly, increase challenge by combining known pieces into larger phrases.
- If a learner stalls, reduce difficulty with hints, smaller blocks, clearer contrast, or a near-identical easier question.
- Avoid long stretches of passive reading before the learner gets to act.
- Do not punish mistakes; use them as signals that the next step needs a smaller bridge.
- The ideal Practice rhythm is rapid but not frantic: glance, understand, answer, win, continue.

This matters especially because the learner experience should compete with modern attention patterns. Practice should feel focused and paced like a short-form interaction without becoming shallow: no distractions, no admin chrome, one clear action, immediate response, and visible movement through the lesson.

## The student is never wrong

The learner may give an answer that does not yet match the target, but the student is never treated as wrong. An unsuccessful attempt is useful evidence about what bridge, hint, or repetition they need next—not a failure and never a source of shame.

- Make every attempt feel safe. Do not scold, subtract points, play a failure sound, or use language and visuals that embarrass the learner.
- Let the learner request help as many times as needed. Hints and revealed answers carry no penalty.
- Treat using help as continued participation and forward movement, not as cheating or a lesser kind of success.
- When an answer does not match, keep the response neutral and useful: preserve the learner's momentum, offer a smaller bridge, or let them try again immediately.
- Design each interaction so it can end in a win. If retrieval does not happen today, repeated supported exposure can make it happen later.
- Future learner analytics may use attempts and help requests to choose better review, but never to shame the learner or portray them as incapable.

The product should communicate patient confidence: **you are not failing; you are still learning, and we will stay with you until this becomes familiar.**

## Discovery over memorization

- Prefer reusable patterns over isolated vocabulary lists.
- Show enough examples for the learner to infer the pattern.
- Bold or highlight the part that changes:

  `visit`**`ando`** ⟶ `visit`**`ing`**

- Keep the explanation close to the examples it explains.
- Avoid burying the important pattern in a paragraph of grammar terminology.
- Name the useful pattern directly instead of naming the grammatical category behind it.

## Questions and answers

- Questions should be short and written in Spanish.
- Highlight the exact Spanish word or phrase the learner needs to translate.
- The learner should be able to type the answer directly.
- Correct answers should be recognized while typing, visibly marked, and move the lesson forward automatically.
- There is no penalty for an incorrect answer.
- A learner can request help as often as needed with a visible help control or the `Alt + H` shortcut, without penalty.
- Help may briefly reveal the answer, then fade away so the learner can try again.
- Accept natural alternatives when the lesson is teaching that variability.
- Contractions are important. For example, accept both `I want to go` and `I wanna go` when the lesson is teaching that conversational contrast.
- Phrase-level answers are appropriate when translating individual blocks would produce a misleading result, such as `para comprar` ⟶ `to buy`.

## Building language from blocks

- Keep reusable curriculum objects atomic when they represent useful language pieces.
- Allow lesson questions to group blocks when the meaning or English translation depends on the phrase as a whole.
- Do not force a one-Spanish-block-to-one-English-word relationship when that teaches the wrong structure.
- Build from small mappings toward complete, meaningful sentences.

## UI principles

- Keep one clear teaching action visible at a time.
- Avoid repeating the same instruction on every question card.
- Use progress indicators to make the learner feel movement.
- Support keyboard-first use, with visible shortcut hints where helpful.
- Allow the learner to move backward and forward between lesson segments.
- Use strong visual hierarchy: large target phrases, bold patterns, clear input fields, and short feedback.
- Prefer a little visual energy over a cold academic interface, while keeping the screen uncluttered.

## Current implementation boundary

- Text interaction comes first.
- Voice input, speech recognition, pronunciation scoring, and audio feedback can come later.
- The first lesson implementation should test the teaching rhythm before we design a generalized lesson authoring system.
- Reusable curriculum data and lesson sequencing are related but separate concerns: curriculum objects describe language; lesson steps describe how the teacher introduces and practices it.
