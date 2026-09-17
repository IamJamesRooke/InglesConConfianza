# Speech: hearing what you just built

> Owner decision 2026-09-17. MVP uses the browser's built-in speech synthesis (no
> install, no account, no recordings). A generated-audio backend can be added later
> behind the same `speak()` call. Speakers with different accents are part of the
> concept, not a later extra.

## What the learner experiences

- On a sentence slide, each piece is spoken the moment it turns correct: *I want* …
  *to do* … *something* … *with you*. A newly correct piece always interrupts
  whichever piece is still playing rather than queuing behind it — a fast typer just
  hears the latest one, never a stack of overlapping/queued pieces.
- When the last piece lands, it's spoken normally (not cut off): the card waits for
  that piece to finish (or, if the learner's typing had already moved past it, for
  whatever's still playing to be interrupted), pauses briefly (~500ms) so the piece and
  the sentence never blur together, then speaks the whole sentence once, naturally:
  *I want to do something with you.* If the learner advances the slide or the card
  unmounts before the sentence plays, it's cancelled outright — speech never blocks
  progression, and the "Continue" action is enabled as soon as the sentence is correct
  regardless of what's still playing.
- A **speaker** is shown on the slide, persistently: a small cartoon avatar, a country
  label with its flag (**USA** 🇺🇸, **UK** 🇬🇧), and a speech bubble — rendered as soon
  as a speaker is picked (before any answer is typed), staying mounted for the whole
  slide rather than popping in and out on state changes. There is no bubble at rest
  (owner, 2026-09-17): it appears with the first words spoken, shows the text being
  spoken, and keeps showing that text afterward (it doesn't clear); there is no "…"
  placeholder. The speaker is chosen at random per sentence slide (not per piece),
  and the same speaker reads every piece and the full sentence of that slide.
  Vocabulary tables show the same persistent chip.
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

Voice availability differs per device — some report no `speechSynthesis` voices at all
(seen on the owner's Linux desktop Chrome) but still have generated clips. Rules:
1. A speaker is *available* on a device if EITHER the generated-clip manifest lists at
   least one clip for that speaker id, OR a `speechSynthesis` voice matching its `lang`
   exists. If the gender hint cannot be honoured, the accent still wins (the label is
   the accent). Both probes (manifest fetch, voice list) run before the first pick —
   `availableSpeakers()`/`pickSpeaker()` are async and the sentence card awaits them
   before rendering the chip, so a slow manifest fetch never causes a false "no
   speakers" result. If the manifest is absent and no voices exist: no speaker, no
   chip, and `speak()` still resolves silently (never throws, never blocks practice).
2. Randomise only among available speakers. If exactly one is available, always use it.
   Clip playback never depends on `speechSynthesis`: `speak(text, speaker)` plays a
   clip via `new Audio(url)` when the manifest has one for that (speaker, text) pair
   (its `play()` rejection — e.g. autoplay policy — is handled silently, falling back
   to synthesis), else falls back to browser synthesis if a voice exists, else resolves
   with no sound.
3. Rate 0.95, pitch 1.0. Pieces are spoken with `speechSynthesis.speak`; the full
   sentence cancels the queue first so pieces never overlap it. `speakSentence` also
   stops any in-flight clip `Audio` before speaking.
4. iOS/Safari play audio only after a user gesture — the learner has just typed, so this
   holds; still guard `speak()` so it never throws when synthesis is unavailable.

## Avatars

**Owner (2026-09-17):** the avatars must be *attractive, distinct people*, and bigger
(72px at desktop, 48px on phone) — not generic busts. The UK woman and the USA man must
read as two different characters (face shape, hair, skin tone, clothing colour). No
bubble at rest: the bubble appears with the first words and then keeps the last thing
said; never a "…" typing indicator.

`web/public/speakers/<id>.svg`: flat cartoon busts, a handful of palette tones each,
256×256 (redrawn 2026-09-17 for the L2b stage, where they render at 72px), no text
inside the image (the label is HTML so it can be translated/styled).
The MVP avatars are hand-drawn SVGs; they can be replaced by commissioned art later
without touching code (same path, same size).

**Real portraits (owner-supplied, no code change needed):** drop `us-man.png` /
`uk-woman.png` (512×512, square bust) into `web/public/speakers/` — the chip renders
the first candidate file that loads for each speaker (`us-man.png`, then
`us-man.svg`; same for `uk-woman`) via an `<img>` `onError` fallback chain, no
existence probing. The avatar renders in a circular mask (`object-fit: cover`,
`object-position: center top`, so a square portrait crops to the face) with a 2px
ring in the card colour and the chip's existing soft shadow; sizes are unchanged
(72px on the stage, 48px on phone, 40px inline).

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

## Generating clips

`npm run audio:generate` (`web/scripts/generate-audio.ts`) reads `data/lessons.json`,
collects every tested piece's first accepted answer and every ordinary sentence's full
English (vocabulary tables never contribute a "full sentence"), and calls Google Cloud
Text-to-Speech for each speaker (`us-man` → `en-US-Neural2-D`, `uk-woman` →
`en-GB-Neural2-A`, MP3, speaking rate 0.95). Clips are written to
`web/public/audio/<speakerId>/<sha1(text)>.mp3` (only when missing) and
`web/public/audio/manifest.json` is rewritten to `{ "<sha1>": ["us-man", "uk-woman"] }`.
Without `GOOGLE_TTS_API_KEY` set, the script prints what it would generate and exits 0 —
the app works with no key and no clips at all, falling back to browser synthesis.
Generated clips are deploy assets and stay committed (small; not gitignored).

## Not in scope now

Recording, cloud voices, per-piece speaker changes, speed control, Spanish speech,
speaking explanations, pronunciation scoring.
