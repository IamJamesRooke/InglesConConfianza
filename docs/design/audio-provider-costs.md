# Audio provider costs: ElevenLabs vs. Google Cloud TTS (current)

Research only, 2026-09-17. Volume is measured from `web/data/lessons.json`
as it exists today; pricing is from vendor pages/search as cited. Everything
past today's measured data is marked **(estimate)**.

## 1. Actual volume, measured

Counted with `generateMissingClips()`'s selection rules
(`web/src/lib/audio/generate-clips.ts`): distinct tested-piece first accepted
answers + full sentences (×2 speakers), distinct explanation markdown
(`[[es:]]/[[en:]]/[[audio:]]`/bold/italic stripped, spoken text kept),
distinct instruction lines. `lessons.json` has 5 lessons; one is an empty stub.

| lesson | blocks | EN texts | explanations | instructions | **chars** |
|---|---|---|---|---|---|
| lesson_37a0… | 14 | 9 | 5 | 1 | 417 |
| lesson_5550… | 11 | 11 | 4 | 1 | 323 |
| lesson_fdff… | 17 | 20 | 5 | 2 | 732 |
| lesson_941c… | 12 | 16 | 4 | 2 | 559 |
| **avg (4 non-empty)** | | | | | **~508** |

Total across `lessons.json` today: **2,031 characters**. These are
early/seed lessons — if finished lessons end up bigger, scale linearly.

### Extrapolations (estimate, linear from ~508 chars/lesson)

| scope | one-time full generation | steady state (20%/mo re-edited) |
|---|---|---|
| 1 lesson | ~508 | ~102/mo |
| Level 1 (~30 lessons) | ~15,240 | ~3,050/mo |
| 100-lesson course | ~50,800 | ~10,160/mo |

Headline: all of this is **very small** next to any provider's free tier.

## 2. ElevenLabs pricing

Source: [elevenlabs.io/pricing](https://elevenlabs.io/pricing), fetched 2026-09-17.

| plan | price/mo | credits/mo | commercial use | API |
|---|---|---|---|---|
| Free | $0 | 10,000 | **no** | most endpoints, no commercial rights |
| Starter | ~$5–6 | 30,000 | yes | yes |
| Creator | ~$11 (1st mo ~$22) | ~100k–121k | yes | yes |
| Pro | $99 | 600,000 | yes | yes |

(Starter's list price varied $5 vs $6 across sources — confirm live.)
**Credits ≠ characters, model-dependent:** Multilingual v2 (best quality,
29 languages) = 1 credit/char; Flash/Turbo v2.5 (lower latency) = ~0.5
credit/char, roughly half the cost. No published flat overage rate —
overage is pay-as-you-go top-ups at a blended rate.

**Mid-clip voice switching:** the TTS **API** does not support an
SSML-style inline voice switch in one request — assigning multiple voices
per paragraph is a Studio-UI-only feature, not markup you send to the API.
For our two-voice explanation track this means **synthesizing each voice's
segments separately and concatenating audio** (~2–4 requests/explanation),
plus a stitching step we lack today (Google's SSML `<voice>` already does
this server-side in one call). Sources: [multi-voice support](https://elevenlabs.io/docs/eleven-agents/customization/voice/multi-voice-support), [Studio per-paragraph voices](https://help.elevenlabs.io/hc/en-us/articles/30097496876561-Can-I-assign-more-than-one-voice-to-a-paragraph-in-Studio).

**Latin American Spanish voices:** available in the library (e.g. "Wendy",
"Eleguar"), searchable by accent — [latin-american-accent](https://elevenlabs.io/text-to-speech/latin-american-accent), [voice-library/latin](https://elevenlabs.io/voice-library/latin).
Multilingual v2's premise is one voice across 29 languages, and third-party
listings describe specific voices as staying natural in both Spanish and
English — but we'd likely still want a distinct voice for English marks as
today, so segment-and-concatenate still applies either way.

## 3. Google Cloud TTS (current, for comparison)

WebFetch couldn't render the live pricing page; figures below are from
search/aggregators, **unverified against the live page**:

| voice tier | free/month | paid rate |
|---|---|---|
| Standard | 4,000,000 chars | ~$4/1M chars |
| WaveNet | 1,000,000 chars | ~$4/1M chars |
| Neural2 (**what we use**) | 1,000,000 chars | ~$16/1M chars |
| Studio | much smaller/no free tier | ~$160/1M chars |

We use Neural2 for both learner voices and the narrator (`VOICES` +
`EXPLANATION_VOICE` in `generate-clips.ts`). At 1M free Neural2 chars/month,
even the 100-lesson extrapolation (~50,800 one-time, ~10,160/mo steady
state) is ~5% of one month's free allowance, and Google already does inline
SSML `<voice>` switching in one request — no concatenation workaround needed.

## 4. Cost table

| scope | Google (current) | ElevenLabs Starter | ElevenLabs Creator |
|---|---|---|---|
| 1 lesson (~508 chars) | $0 (free tier) | $0 marginal, $5–6/mo floor | $0 marginal, $11/mo floor |
| Level 1 (~15,240 chars) | $0 (free tier) | fits 30k credits → **$5–6** | fits easily → **$11** |
| 100 lessons (~50,800 chars) | $0 (free tier) | exceeds 30k → needs Creator | fits ~100–121k → **$11** |
| Steady state (20%/mo) | $0, forever | Level 1 fits Free's 10k; 100-lesson (~10,160/mo) is right at that edge → Starter **$5–6/mo** to be safe | **$11/mo** if already on Creator |

## Recommendation

Google's free tier already covers everything indefinitely at $0 — even a
100-lesson course is ~5% of one month's free Neural2 allowance, and
steady-state edits are a rounding error. ElevenLabs would cost a real but
small $5–22/month, plus new engineering cost: no single-request multi-voice
API, so the explanation track becomes segment-per-voice + concatenate
(~2–4 requests/explanation) and needs an audio-stitching step we lack today.

**Switch only for voice quality/naturalness, not cost** — e.g. if Google's
Neural2 accent-switch reads as jarring and ElevenLabs sounds meaningfully
better for this bilingual format; cost stays $5–22/month even fully scaled
to 100 lessons, so it isn't a driver either way.

**Migration would touch:** only `synthesize()`/`synthesizeSsml()` in
`web/src/lib/audio/generate-clips.ts` are Google-specific. The manifest/hash
scheme (sha1 of spoken text → filename, top-level `Manifest` shape) is
already provider-agnostic. Clean shape: one `synthesizeWithGoogle()` /
`synthesizeWithElevenLabs()` pair behind a shared interface picked by
config, plus (ElevenLabs-only) an MP3-concat helper for the two-voice track.

## Sources

- [ElevenLabs Pricing](https://elevenlabs.io/pricing) · [Multi-voice support](https://elevenlabs.io/docs/eleven-agents/customization/voice/multi-voice-support) · [Studio multi-voice per paragraph](https://help.elevenlabs.io/hc/en-us/articles/30097496876561-Can-I-assign-more-than-one-voice-to-a-paragraph-in-Studio)
- [Latin American accent voices](https://elevenlabs.io/text-to-speech/latin-american-accent) · [Voice Library — Latin](https://elevenlabs.io/voice-library/latin) · [API cost FAQ](https://help.elevenlabs.io/hc/en-us/articles/28184926326033-How-much-does-it-cost-to-use-the-API)
- Google Cloud TTS pricing — live page didn't render for this task; cross-checked via [costbench.com](https://costbench.com/software/ai-voice-tools/google-cloud-text-to-speech/) and its [free-plan page](https://costbench.com/software/ai-voice-tools/google-cloud-text-to-speech/free-plan/) — **verify against [cloud.google.com/text-to-speech/pricing](https://cloud.google.com/text-to-speech/pricing) before budgeting.**
- Repo: `web/src/lib/audio/generate-clips.ts`, `web/data/lessons.json`, `web/src/lib/learner/explanation-ssml.ts`
