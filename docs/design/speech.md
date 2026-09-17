# Speech: hearing what you just built

> Owner decision 2026-09-17. MVP uses the browser's built-in speech synthesis (no
> install, no account, no recordings). A generated-audio backend can be added later
> behind the same `speak()` call. Speakers with different accents are part of the
> concept, not a later extra.

## What the learner experiences

- On a sentence slide, each piece is spoken the moment it turns correct: *I want* …
  *to do* … *something* … *with you*.
- When the last piece lands, the queue is cleared and the whole sentence is spoken once,
  naturally: *I want to do something with you.*
- A **speaker** is shown on the slide: a small cartoon avatar, a country label with its
  flag (**USA** 🇺🇸, **UK** 🇬🇧), and a speech bubble that shows the text being spoken.
  The speaker is chosen at random per sentence slide (not per piece), and the same
  speaker reads every piece and the full sentence of that slide.
- The completion screen shows the lesson's final sentence with a replay button, read by
  the speaker of that last slide.
- A mute toggle lives in the practice header; the choice is remembered on the device.
- Vocabulary tables speak each row's English on correct; explanations are not read.

## Speakers (roster, extensible)

| id | label | flag | lang | gender hint | preferred voice names (first match wins) |
|---|---|---|---|---|---|
| `us-man` | USA | 🇺🇸 | en-US | male | Google US English (male variants), Microsoft Guy/Christopher, Alex, Fred |
| `uk-woman` | UK | 🇬🇧 | en-GB | female | Google UK English Female, Microsoft Sonia/Libby, Kate, Serena, Daniel's female siblings |

Later: Australia, Ireland, Canada, plus a Colombian-English learner voice is *not* a
goal. Adding a speaker = one roster entry + one avatar file.

Voice availability differs per device. Rules:
1. A speaker is *available* on a device only if a voice matching its `lang` exists.
   If the gender hint cannot be honoured, the accent still wins (the label is the accent).
2. Randomise only among available speakers. If exactly one is available, always use it.
   If none, use any `en-*` voice and show no speaker chip (bubble still shows the text).
3. Rate 0.95, pitch 1.0. Pieces are spoken with `speechSynthesis.speak`; the full
   sentence cancels the queue first so pieces never overlap it.
4. iOS/Safari play audio only after a user gesture — the learner has just typed, so this
   holds; still guard `speak()` so it never throws when synthesis is unavailable.

## Avatars

`web/public/speakers/<id>.svg`: flat cartoon busts, two or three palette tones each,
128×128, no text inside the image (the label is HTML so it can be translated/styled).
The MVP avatars are hand-drawn SVGs; they can be replaced by commissioned art later
without touching code (same path, same size).

## Code shape

- `web/src/lib/learner/speech.ts`: `listSpeakers()`, `pickSpeaker(seed)`, `speak(text, speaker)`,
  `speakSentence(text, speaker)` (cancels queue), `isSpeechAvailable()`, mute state in
  `localStorage` (`icc.speech.muted`). Pure roster + a thin `window.speechSynthesis` layer
  so unit tests can stub it.
- `web/src/components/practice/speaker-chip.tsx`: avatar + label + flag + bubble.
- Sentence card: on piece correct → `speak(piece)`; on all correct → `speakSentence(full)`.
- Completion: replay button.
- Later backend: `speak()` first checks `/audio/<hash>.mp3` (generated at build); absent →
  browser synthesis. Not built now.

## Not in scope now

Recording, cloud voices, per-piece speaker changes, speed control, Spanish speech,
speaking explanations, pronunciation scoring.
