// Core of clip generation, importable from both the CLI wrapper
// (scripts/generate-audio.ts) and the admin API
// (src/app/api/admin/audio/generate/route.ts) and the Lesson Builder's own
// "generate audio" actions. See docs/design/speech.md "Generating clips".
//
// Reads lessons through the shared, guard-free lesson-file-io module (not a
// hardcoded path) rather than lesson-store.ts's "server-only"-marked
// re-export — that marker throws unconditionally when the module is loaded
// by a plain Node/tsx process outside Next's webpack (which is the only
// place that aliases "server-only" to a no-op), which the CLI wrapper is.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { readLessonFile } from "@/lib/lesson-builder/server/lesson-file-io";
import type {
  ExplanationBlock,
  LanguageBlock,
  Lesson,
  SentenceBlock,
} from "@/lib/lesson-builder/types";
import {
  isMeaningfulLanguageBlock,
  sentenceEnglishText,
} from "@/lib/lesson-builder/utils";
import type { SpeakerId } from "@/lib/learner/speech";
import { explanationToSsml } from "@/lib/learner/explanation-ssml";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const MANIFEST_PATH = path.join(AUDIO_DIR, "manifest.json");
const EXPLANATIONS_DIR = path.join(AUDIO_DIR, "explanations");
const INSTRUCTIONS_DIR = path.join(AUDIO_DIR, "instructions");

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

// Spoken instruction lines (owner, 2026-09-17): a sentence/vocabulary
// slide's `promptText` ("Veamos la diferencia.") is read by the same
// narrator on slide open. One voice, no inline switching and no taught-word
// emphasis — it is direction, not content — so the SSML is just the
// narrator's rate around the escaped line. See docs/design/speech.md
// "Spoken instruction lines".
const INSTRUCTION_RATE = "88%";

function escapeXml(text: string): string {
  return text
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&apos;");
}

export function instructionToSsml(text: string): string {
  return `<speak><prosody rate="${INSTRUCTION_RATE}">${escapeXml(text)}</prosody></speak>`;
}

function sha1(text: string): string {
  return createHash("sha1").update(text, "utf8").digest("hex");
}

export type GenerateOptions = {
  /** Only lessons with one of these ids are considered. Omit for every lesson. */
  lessonIds?: string[];
  /** Only blocks with one of these ids are considered. Omit for every block. */
  blockIds?: string[];
};

export type GenerateResult = {
  generated: number;
  skipped: number;
  bytes: number;
  /** True when GOOGLE_TTS_API_KEY isn't set — nothing was generated. */
  missingKey: boolean;
};

function selectLessons(lessons: Lesson[], options: GenerateOptions): Lesson[] {
  let selected = lessons;
  if (options.lessonIds) {
    const lessonIdSet = new Set(options.lessonIds);
    selected = selected.filter((lesson) => lessonIdSet.has(lesson.id));
  }
  if (options.blockIds) {
    const blockIdSet = new Set(options.blockIds);
    selected = selected
      .map((lesson) => ({
        ...lesson,
        blocks: lesson.blocks.filter((block) => blockIdSet.has(block.id)),
      }))
      .filter((lesson) => lesson.blocks.length > 0);
  }
  return selected;
}

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

/** Every distinct instruction line (`promptText`) across sentence and
 * vocabulary slides, trimmed, blanks skipped. sha1(trimmed text) is the clip
 * filename and manifest key, matching instructionClipUrl() in
 * src/lib/learner/speech.ts. */
function collectInstructions(lessons: Lesson[]): Set<string> {
  const instructions = new Set<string>();
  for (const lesson of lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "sentence") continue;
      const text = (block as SentenceBlock).promptText?.trim();
      if (text) instructions.add(text);
    }
  }
  return instructions;
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
type Manifest = Record<string, SpeakerId[]> & {
  explanations?: Record<string, true>;
  instructions?: Record<string, true>;
};

/**
 * Generates every missing clip (per-speaker sentence/vocabulary audio, plus
 * the two-voice explanation track) for the lessons/blocks selected by
 * `options` (everything, when omitted), writing the same files and manifest
 * shape as always to `public/audio/`. Never throws on a missing
 * `GOOGLE_TTS_API_KEY` — resolves `{ missingKey: true }` and generates
 * nothing, matching the CLI script's long-standing "dry run" behaviour so
 * the app keeps working with no key and no clips at all.
 */
export async function generateMissingClips(
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const lessonFile = await readLessonFile();
  const lessons = selectLessons(lessonFile.lessons, options);
  const texts = collectTexts(lessons);
  const explanations = collectExplanations(lessons);
  const instructions = collectInstructions(lessons);
  const speakerIds = Object.keys(VOICES) as SpeakerId[];
  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  console.log(
    `Collected ${texts.size} distinct English text(s) across ${speakerIds.length} speaker(s), ` +
      `${explanations.size} distinct explanation block(s), and ` +
      `${instructions.size} distinct instruction line(s).`,
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
    for (const text of instructions) {
      const hash = sha1(text);
      const clipPath = path.join(INSTRUCTIONS_DIR, `${hash}.mp3`);
      const exists = await fileExists(clipPath);
      console.log(
        `${exists ? "[exists]" : "[would generate]"} instructions/${hash}.mp3 <- "${text}"`,
      );
      if (!exists) wouldGenerate += 1;
    }
    console.log(
      `Dry run complete: ${wouldGenerate} clip(s) would be generated. Set GOOGLE_TTS_API_KEY to actually generate audio.`,
    );
    return { generated: 0, skipped: 0, bytes: 0, missingKey: true };
  }

  const manifestRaw = (await fileExists(MANIFEST_PATH))
    ? await readFile(MANIFEST_PATH, "utf8")
    : "{}";
  const manifest: Manifest = JSON.parse(manifestRaw || "{}");

  let generated = 0;
  let skipped = 0;
  let bytes = 0;
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
        bytes += audio.byteLength;
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

  let instructionsGenerated = 0;
  let instructionsSkipped = 0;
  let instructionsBytes = 0;
  const instructionManifest = manifest.instructions ?? {};
  for (const text of instructions) {
    const hash = sha1(text);
    const clipPath = path.join(INSTRUCTIONS_DIR, `${hash}.mp3`);
    if (await fileExists(clipPath)) {
      instructionsSkipped += 1;
    } else {
      await mkdir(INSTRUCTIONS_DIR, { recursive: true });
      const audio = await synthesizeSsml(instructionToSsml(text), apiKey);
      await writeFile(clipPath, audio);
      instructionsGenerated += 1;
      instructionsBytes += audio.byteLength;
      console.log(`Generated instructions/${hash}.mp3 <- "${text}"`);
    }
    instructionManifest[hash] = true;
  }
  manifest.instructions = instructionManifest;

  await mkdir(AUDIO_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(
    `Done: ${generated} clip(s) generated, ${skipped} already present. ` +
      `Explanations: ${explanationsGenerated} clip(s) generated (${explanationsBytes} bytes), ` +
      `${explanationsSkipped} already present. ` +
      `Instructions: ${instructionsGenerated} clip(s) generated (${instructionsBytes} bytes), ` +
      `${instructionsSkipped} already present. Manifest written to ${MANIFEST_PATH}.`,
  );

  return {
    generated: generated + explanationsGenerated + instructionsGenerated,
    skipped: skipped + explanationsSkipped + instructionsSkipped,
    bytes: bytes + explanationsBytes + instructionsBytes,
    missingKey: false,
  };
}
