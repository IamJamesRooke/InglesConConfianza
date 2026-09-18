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

## Explanation voice track

> Owner decision 2026-09-17. Generator half in this section; playback (auto-play on
> slide entry, replay button, the bridge shown small, "listen" in the builder) is now
> built too — see "Playback" below and `docs/design/student-experience.md`
> "Explanation audio" for the learner-facing writeup.

Explanations are read too, but by their own two-voice track rather than the per-slide
speaker roster. **Owner correction 2026-09-17**: the original build used ONE American
voice (`en-US-Neural2-D`) for the whole explanation, Spanish included, on the theory
that a gringo accent on the Spanish was fine. On listening, the owner found this "too
gringo" and the cadence too fast. Replaced with two voices switched inline via Google
Cloud TTS's SSML `<voice name="…">` element — **verified against the live REST API**
(a real synthesize call with `<voice name="es-US-Neural2-A">…</voice><voice
name="en-US-Neural2-D">…</voice>` inside one `<speak>` returned 200 with a
multi-second, two-accent clip), so this uses **voice switching within one request**,
not the separate-requests-concatenated-as-MPEG-frames fallback:

- **Narrator** (plain text, Spanish marks, paragraph/hard breaks): `es-US-Neural2-A`
  (Latin American Spanish, female) at `<prosody rate="88%">`. Wraps the entire
  `<speak>` body.
- **English marks**: `en-US-Neural2-D` (the USA speaker used elsewhere in the app) at
  `<prosody rate="85%">` (see taught-word emphasis below), nested inside the narrator's
  `<voice>` — SSML voices nest, so control reverts to the narrator once the nested
  `<voice>` closes.

**Owner addition, same day**: taught words — both the Spanish mark and the English
mark — get extra emphasis and pause so they stand out ("COSA … es … thing."):

- Every `es` mark (no voice switch, still the narrator voice): `<break
  time="150ms"/><emphasis level="moderate"><prosody
  rate="82%">cosa</prosody></emphasis><break time="350ms"/>`.
- Every `en` mark: `<break time="300ms"/>` then the English voice with `<emphasis
  level="moderate"><prosody rate="85%">thing</prosody></emphasis>` then `<break
  time="300ms"/>`. A bridged mark (below) keeps its existing word + pause +
  syllable-chunk rendering inside that same emphasis/prosody wrapping.
- Plain, unmarked text between them is read at the narrator's base 88%.

Sample — `[[es:cosa]] es [[en:thing]]` — produces:

```
<speak><voice name="es-US-Neural2-A"><prosody rate="88%"><break time="150ms"/><emphasis level="moderate"><prosody rate="82%">cosa</prosody></emphasis><break time="350ms"/> es <voice name="en-US-Neural2-D"><break time="300ms"/><emphasis level="moderate"><prosody rate="85%">thing</prosody></emphasis><break time="300ms"/></voice></prosody></voice></speak>
```

**Pronunciation-bridge notation** — an `[[en:…]]` mark may additionally carry a
respelling for the voice track: `[[en:different|DIFF-rent]]`. The `|bridge` suffix is
data on the mark, not visible text; the learner-facing renderer strips it from what's
displayed (a later session shows it small, per the backlog item). Marks without a
bridge are read plainly, exactly like today.

- `src/lib/lesson-builder/explanation-markdown.ts` parses/serializes the notation: the
  `lang` mark's `attrs` gained an optional `bridge?: string`, set only for an `en` mark
  that has a `|…` suffix immediately before its closing `]]` (nested bold/italic inside
  the marked run still works; the bridge is captured after they close). Round-trips
  byte-identically; unterminated bridges don't throw, matching the dialect's existing
  half-typed-markup tolerance.
- `src/lib/lesson-builder/explanation-schema.ts`: the Tiptap `Lang` mark gained a
  matching `bridge` attribute (`data-bridge` in the DOM) purely so the attribute
  survives `parseExplanation()` → `schema.nodeFromJSON()` → the editor unchanged; no
  other schema behaviour changed.

**SSML rules** (`explanationToSsml(markdown): string` in
`src/lib/learner/explanation-ssml.ts`, a pure string builder — no network call):

- The whole document is wrapped in `<speak><voice name="es-US-Neural2-A"><prosody
  rate="88%">…</prosody></voice></speak>` (the narrator).
- Plain, unmarked text is emitted as-is (escaped), read by the narrator.
- A Spanish (`es`) mark gets the taught-word wrapping: `<break time="150ms"/><emphasis
  level="moderate"><prosody rate="82%">…</prosody></emphasis><break time="350ms"/>` —
  still the narrator voice, no `<voice>` switch.
- An English (`en`) mark — with or without a bridge — is nested in its own `<voice
  name="en-US-Neural2-D">`, itself wrapped `<break time="300ms"/><emphasis
  level="moderate"><prosody rate="85%">…</prosody></emphasis><break time="300ms"/>`.
  Without a bridge, the mark's text is the emphasised content directly. WITH a bridge,
  the emphasised content is: the word, `<break time="350ms"/>`, then each
  hyphen-separated chunk of the bridge joined by `<break time="200ms"/>`. A chunk
  written in ALL CAPS (the stressed syllable) is additionally wrapped in `<emphasis
  level="strong">` and, like every chunk, lowercased first — most TTS voices spell an
  all-caps chunk out letter-by-letter rather than saying it, so the emphasis tag (not
  the casing) is what actually carries the stress.
- Bold/italic marks carry no spoken meaning and are ignored.
- A paragraph break becomes `<break time="600ms"/>`; a hard line break inside one
  paragraph becomes a smaller `<break time="200ms"/>` (both read by the narrator, no
  voice switch).
- `&`, `<`, `>`, `"`, `'` are XML-escaped.

**Generator**: `scripts/generate-audio.ts` also collects every lesson's explanation
blocks (`ExplanationBlock.contentMarkdown`, deduplicated by exact markdown source,
blank ones skipped), builds each one's SSML, and calls Google TTS (`input: { ssml }`,
top-level `voice: es-US-Neural2-A` as the request's required default — every part of
the body is wrapped in its own `<voice>` by `explanationToSsml`, so this default is
never actually read from — MP3, **no top-level `speakingRate`**: the SSML's own
`<prosody rate="…">` on every voice already sets the rate explicitly, and a
top-level multiplier would silently compound with those) into
`public/audio/explanations/<sha1(markdown)>.mp3` — keyed by the **markdown source**,
not the spoken text (unlike the per-speaker clips, which are keyed by spoken text, and
still use `speakingRate: 0.95` with no per-segment prosody). Only generates when the
file is missing. The manifest gained an `explanations` map, `{ "<sha1>": true }`,
alongside the existing per-speaker map — old manifests without that key still parse
fine (no explanation clips, nothing else affected). Dry run (no `GOOGLE_TTS_API_KEY`)
reports what it would generate for explanations exactly like it already does for
speaker clips.

`src/lib/learner/speech.ts` gained `explanationClipUrl(markdown): Promise<string|null>`
— manifest-aware, resolves `/audio/explanations/<sha1>.mp3` when listed, else `null`.
Never throws.

**Playback** (`src/components/practice/explanation-step.tsx`): on mount, if
`explanationClipUrl(markdown)` resolves a URL and speech isn't muted, a fresh
`Audio(url)` plays once automatically — the learner has already interacted with the
app to get here, so autoplay is allowed; a rejected `play()` is swallowed like every
other speech path. A 40px "Escuchar" control (`Volume2`, top-right inside the card's
own padding) replays it — always a new `Audio` instance per play, never reused, so a
replay is a real new request and a subtle pulsing ring (reduced motion: none) can key
off that instance's own `onplay`/`onended`. Leaving the slide (markdown changes, or
the component unmounts) pauses whatever's currently playing. No clip → no control at
all; this never falls back to browser synthesis, since a mixed-language explanation
read by the wrong voice would be actively wrong, not lower quality. The mute toggle
applies both to autoplay and, via `subscribeMuted`, stops a clip already playing the
moment the learner mutes mid-explanation.

The bridge itself is shown to the learner, small: `PracticeMarkdown`
(`src/components/practice/practice-markdown.tsx`) splits an `en` mark's content on its
last `|` (the bridge is always appended last, after any nested bold/italic closes) and
renders the respelling in a `.practice-language-bridge` span — `--ink-muted`,
`--t-eyebrow` size, not uppercase, no tracking — directly after the word, e.g.
"different ·DIFF-rent". `es` marks are never split this way (a stray `|` there is just
text).

**Builder** (`src/components/lesson-builder/explanation-editor.tsx`,
`explanation-commands.ts`): the mark popover gains a "Pronunciation" text field
whenever the caret sits inside an `en` mark (selection or not); it reads/writes the
`bridge` attribute via `setExplanationBridge`, which extends a collapsed caret to the
whole marked word first. `lesson-document.tsx`'s per-slide hover icon cluster gains a
"Listen" button (explanation slides only) that plays the clip if one exists, else
shows a "Generate audio first (npm run audio:generate)" tooltip and stays disabled.

## Not in scope now

Recording, per-piece speaker changes, speed control, and Spanish speech for the
per-slide speakers (unlike explanations, which do speak Spanish now, via the
`es-US-Neural2-A` narrator — see "Explanation voice track" above), and pronunciation
scoring.
