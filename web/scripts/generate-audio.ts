import "dotenv/config";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ExplanationBlock,
  LanguageBlock,
  Lesson,
  SentenceBlock,
} from "../src/lib/lesson-builder/types";
import {
  isMeaningfulLanguageBlock,
  sentenceEnglishText,
} from "../src/lib/lesson-builder/utils";
import type { SpeakerId } from "../src/lib/learner/speech";
import { explanationToSsml } from "../src/lib/learner/explanation-ssml";

// Generates browser-independent audio clips for every piece of English a
// learner will hear, so speak() can prefer a real recording over the
// (voice-availability-dependent) browser synthesizer. See
// docs/design/speech.md "Generating clips". Run: `npm run audio:generate`.
// Without GOOGLE_TTS_API_KEY set, this prints what it would generate and
// exits 0 — the app must work with no key and no clips at all.

const LESSONS_PATH = path.join(process.cwd(), "data", "lessons.json");
const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const MANIFEST_PATH = path.join(AUDIO_DIR, "manifest.json");

const VOICES: Record<SpeakerId, { languageCode: string; name: string }> = {
  "us-man": { languageCode: "en-US", name: "en-US-Neural2-D" },
  "uk-woman": { languageCode: "en-GB", name: "en-GB-Neural2-A" },
};

const SPEAKING_RATE = 0.95;

// The explanation voice track: TWO voices switched inline via SSML
// <voice name="…"> — a Latin American Spanish narrator (es-US-Neural2-B) for
// the explanation prose and Spanish marks, and en-US-Neural2-D for English
// marks — built by explanationToSsml() below. The top-level `voice` field
// here is the request's required default; every part of the body is wrapped
// in its own <voice> element by explanationToSsml, so this default is never
// actually read from. See docs/design/speech.md "Explanation voice track"
// and src/lib/learner/explanation-ssml.ts, which builds the SSML this sends.
const EXPLANATION_VOICE = { languageCode: "es-US", name: "es-US-Neural2-B" };
const EXPLANATIONS_DIR = path.join(AUDIO_DIR, "explanations");

function sha1(text: string): string {
  return createHash("sha1").update(text, "utf8").digest("hex");
}

type LessonsFile = { version: number; modules: unknown[]; lessons: Lesson[] };

/** Every distinct piece of English the learner will hear: each tested
 * (non-"given") language block's first accepted answer, plus each ordinary
 * sentence slide's full joined English. Vocabulary tables never contribute
 * a "full sentence" — see the same guard in sentence-practice-card.tsx. */
function collectTexts(lessons: Lesson[]): Set<string> {
  const texts = new Set<string>();
  for (const lesson of lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "sentence") continue;
      const sentence = block as SentenceBlock;
      const languageBlocks = sentence.languageBlocks.filter(
        isMeaningfulLanguageBlock,
      );
      for (const languageBlock of languageBlocks as LanguageBlock[]) {
        if (languageBlock.given) continue;
        const answer = languageBlock.acceptedAnswers[0]?.trim();
        if (answer) texts.add(answer);
      }
      if (sentence.layout !== "vocabulary_table") {
        const full = sentenceEnglishText(languageBlocks);
        if (full) texts.add(full);
      }
    }
  }
  return texts;
}

/** Every distinct explanation block's markdown source (blank ones skipped —
 * nothing to say). Keyed by the raw markdown itself; sha1(markdown) is the
 * clip filename and manifest key, matching explanationClipUrl() in
 * src/lib/learner/speech.ts. */
function collectExplanations(lessons: Lesson[]): Set<string> {
  const markdowns = new Set<string>();
  for (const lesson of lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "explanation") continue;
      const markdown = (block as ExplanationBlock).contentMarkdown?.trim();
      if (markdown) markdowns.add((block as ExplanationBlock).contentMarkdown);
    }
  }
  return markdowns;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function synthesize(
  text: string,
  speaker: SpeakerId,
  apiKey: string,
): Promise<Buffer> {
  const voice = VOICES[speaker];
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.name },
        audioConfig: { audioEncoding: "MP3", speakingRate: SPEAKING_RATE },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Google TTS request failed (${response.status}): ${await response.text()}`,
    );
  }
  const body = (await response.json()) as { audioContent: string };
  return Buffer.from(body.audioContent, "base64");
}

async function synthesizeSsml(ssml: string, apiKey: string): Promise<Buffer> {
  // No top-level speakingRate here — every voice in explanationToSsml's SSML
  // already carries its own explicit <prosody rate="…">, so an additional
  // multiplier here would silently compound with those and drift from the
  // documented rates (88%/82%/85%).
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { ssml },
        voice: EXPLANATION_VOICE,
        audioConfig: { audioEncoding: "MP3" },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Google TTS request failed (${response.status}): ${await response.text()}`,
    );
  }
  const body = (await response.json()) as { audioContent: string };
  return Buffer.from(body.audioContent, "base64");
}

// Backward-compatible with the existing flat `{ "<sha1>": ["us-man", ...] }`
// shape: the speaker map still lives at the top level, keyed by
// sha1(spoken text); "explanations" is an additional top-level key, keyed
// by sha1(explanation markdown source), so an old manifest (no
// "explanations" key) still parses and just has no explanation clips.
type Manifest = Record<string, SpeakerId[]> & { explanations?: Record<string, true> };

async function main() {
  const raw = await readFile(LESSONS_PATH, "utf8");
  const data = JSON.parse(raw) as LessonsFile;
  const texts = collectTexts(data.lessons);
  const explanations = collectExplanations(data.lessons);
  const speakerIds = Object.keys(VOICES) as SpeakerId[];
  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  console.log(
    `Collected ${texts.size} distinct English text(s) across ${speakerIds.length} speaker(s), ` +
      `and ${explanations.size} distinct explanation block(s).`,
  );

  if (!apiKey) {
    console.log(
      "GOOGLE_TTS_API_KEY is not set — dry run only, nothing will be generated.",
    );
    let wouldGenerate = 0;
    for (const text of texts) {
      const hash = sha1(text);
      for (const speaker of speakerIds) {
        const clipPath = path.join(AUDIO_DIR, speaker, `${hash}.mp3`);
        const exists = await fileExists(clipPath);
        console.log(
          `${exists ? "[exists]" : "[would generate]"} ${speaker}/${hash}.mp3 <- "${text}"`,
        );
        if (!exists) wouldGenerate += 1;
      }
    }
    for (const markdown of explanations) {
      const hash = sha1(markdown);
      const clipPath = path.join(EXPLANATIONS_DIR, `${hash}.mp3`);
      const exists = await fileExists(clipPath);
      console.log(
        `${exists ? "[exists]" : "[would generate]"} explanations/${hash}.mp3 <- "${markdown}"`,
      );
      if (!exists) wouldGenerate += 1;
    }
    console.log(
      `Dry run complete: ${wouldGenerate} clip(s) would be generated. Set GOOGLE_TTS_API_KEY to actually generate audio.`,
    );
    return;
  }

  const manifestRaw = (await fileExists(MANIFEST_PATH))
    ? await readFile(MANIFEST_PATH, "utf8")
    : "{}";
  const manifest: Manifest = JSON.parse(manifestRaw || "{}");

  let generated = 0;
  let skipped = 0;
  for (const text of texts) {
    const hash = sha1(text);
    for (const speaker of speakerIds) {
      const speakerDir = path.join(AUDIO_DIR, speaker);
      const clipPath = path.join(speakerDir, `${hash}.mp3`);
      if (await fileExists(clipPath)) {
        skipped += 1;
      } else {
        await mkdir(speakerDir, { recursive: true });
        const audio = await synthesize(text, speaker, apiKey);
        await writeFile(clipPath, audio);
        generated += 1;
        console.log(`Generated ${speaker}/${hash}.mp3 <- "${text}"`);
      }
      const speakersForHash = manifest[hash] ?? [];
      if (!speakersForHash.includes(speaker)) speakersForHash.push(speaker);
      manifest[hash] = speakersForHash;
    }
  }

  let explanationsGenerated = 0;
  let explanationsSkipped = 0;
  let explanationsBytes = 0;
  const explanationManifest = manifest.explanations ?? {};
  for (const markdown of explanations) {
    const hash = sha1(markdown);
    const clipPath = path.join(EXPLANATIONS_DIR, `${hash}.mp3`);
    if (await fileExists(clipPath)) {
      explanationsSkipped += 1;
    } else {
      await mkdir(EXPLANATIONS_DIR, { recursive: true });
      const ssml = explanationToSsml(markdown);
      const audio = await synthesizeSsml(ssml, apiKey);
      await writeFile(clipPath, audio);
      explanationsGenerated += 1;
      explanationsBytes += audio.byteLength;
      console.log(`Generated explanations/${hash}.mp3 <- "${markdown}"`);
    }
    explanationManifest[hash] = true;
  }
  manifest.explanations = explanationManifest;

  await mkdir(AUDIO_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(
    `Done: ${generated} clip(s) generated, ${skipped} already present. ` +
      `Explanations: ${explanationsGenerated} clip(s) generated (${explanationsBytes} bytes), ` +
      `${explanationsSkipped} already present. Manifest written to ${MANIFEST_PATH}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
