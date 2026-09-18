import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { listWantedClips } from "../../src/lib/audio/generate-clips";
import {
  analyzeAssets,
  computeMissing,
  computeOrphans,
  pruneManifest,
  referencedAudioPaths,
  referencedImageFiles,
  type FileEntry,
  type ManifestShape,
} from "../../src/lib/assets/referenced-assets";
import type { Lesson, SentenceBlock } from "../../src/lib/lesson-builder/types";

function sha1(text: string): string {
  return createHash("sha1").update(text, "utf8").digest("hex");
}

function sentenceLesson(id: string, spanish: string, english: string): Lesson {
  const block: SentenceBlock = {
    id: `${id}_block`,
    type: "sentence",
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: [
      {
        id: `${id}_piece`,
        spanish,
        callout: null,
        acceptedAnswers: [english],
      },
    ],
  };
  return { id, name: null, concepts: [], blocks: [block] };
}

function explanationLesson(
  id: string,
  contentMarkdown: string,
  image?: { file: string; alt: string },
): Lesson {
  return {
    id,
    name: null,
    concepts: [],
    blocks: [{ id: `${id}_block`, type: "explanation", contentMarkdown, ...(image ? { image } : {}) }],
  };
}

// ---------------------------------------------------------------------
// referencedAudioPaths / referencedImageFiles
// ---------------------------------------------------------------------

test("referencedAudioPaths reuses listWantedClips's own relative paths", () => {
  const lessons = [sentenceLesson("l1", "hola", "hello")];
  const wanted = listWantedClips(lessons);
  const referenced = referencedAudioPaths(lessons);
  assert.equal(referenced.size, wanted.length);
  for (const clip of wanted) assert.ok(referenced.has(clip.relativePath));
});

test("referencedImageFiles collects every explanation's image.file, drafts included", () => {
  const lessons: Lesson[] = [
    explanationLesson("l1", "Texto.", { file: "a-0123456789.png", alt: "a" }),
    { ...explanationLesson("l2", "Sin imagen."), status: undefined },
    { ...explanationLesson("l3", "Draft.", { file: "b-0123456789.svg", alt: "b" }), status: "draft" },
  ];
  const referenced = referencedImageFiles(lessons);
  assert.deepEqual([...referenced].sort(), ["a-0123456789.png", "b-0123456789.svg"]);
});

// ---------------------------------------------------------------------
// computeOrphans / computeMissing
// ---------------------------------------------------------------------

test("computeOrphans returns files on disk that nothing references", () => {
  const existing: FileEntry[] = [
    { path: "us-man/aaa.mp3", bytes: 100 },
    { path: "us-man/bbb.mp3", bytes: 200 },
  ];
  const referenced = new Set(["us-man/aaa.mp3"]);
  assert.deepEqual(computeOrphans(existing, referenced), [{ path: "us-man/bbb.mp3", bytes: 200 }]);
});

test("computeMissing returns referenced paths with no file on disk, sorted", () => {
  const existing: FileEntry[] = [{ path: "us-man/aaa.mp3", bytes: 100 }];
  const referenced = new Set(["us-man/aaa.mp3", "us-man/zzz.mp3", "us-man/mmm.mp3"]);
  assert.deepEqual(computeMissing(referenced, existing), ["us-man/mmm.mp3", "us-man/zzz.mp3"]);
});

// ---------------------------------------------------------------------
// pruneManifest
// ---------------------------------------------------------------------

test("pruneManifest drops stale top-level, explanations, and instructions keys", () => {
  const lessons = [sentenceLesson("l1", "hola", "hello")];
  const wanted = listWantedClips(lessons);
  const wantedHash = wanted.find((c) => c.kind === "speaker")!.hash;
  const staleHash = sha1("nothing wants this anymore");

  const manifest: ManifestShape = {};
  manifest[wantedHash] = ["us-man", "uk-woman"];
  manifest[staleHash] = ["us-man"];
  manifest.explanations = { [sha1("stale explanation")]: true };
  manifest.instructions = { [sha1("stale instruction")]: true };

  const { manifest: pruned, removedKeys } = pruneManifest(manifest, wanted);
  assert.ok(wantedHash in pruned);
  assert.ok(!(staleHash in pruned));
  assert.deepEqual(pruned.explanations, {});
  assert.deepEqual(pruned.instructions, {});
  assert.equal(removedKeys, 3);
});

test("pruneManifest keeps everything when nothing is stale", () => {
  const lessons = [sentenceLesson("l1", "hola", "hello")];
  const wanted = listWantedClips(lessons);
  const wantedHash = wanted.find((c) => c.kind === "speaker")!.hash;
  const manifest = { [wantedHash]: ["us-man", "uk-woman"] };
  const { removedKeys } = pruneManifest(manifest, wanted);
  assert.equal(removedKeys, 0);
});

// ---------------------------------------------------------------------
// analyzeAssets — the whole dry-run analysis
// ---------------------------------------------------------------------

test("analyzeAssets reports orphan and missing audio/images together", () => {
  const lessons = [
    sentenceLesson("l1", "hola", "hello"),
    explanationLesson("l2", "Mira.", { file: "wanted-0123456789.png", alt: "" }),
  ];
  const wanted = listWantedClips(lessons);
  const wantedSpeakerClip = wanted.find((c) => c.kind === "speaker")!;

  const audioFiles: FileEntry[] = [
    { path: wantedSpeakerClip.relativePath, bytes: 50 },
    { path: "us-man/orphan.mp3", bytes: 75 },
  ];
  const imageFiles: FileEntry[] = [
    { path: "wanted-0123456789.png", bytes: 10 },
    { path: "orphan-9999999999.png", bytes: 20 },
  ];

  const report = analyzeAssets(lessons, audioFiles, imageFiles, {});

  assert.deepEqual(report.audio.orphans, [{ path: "us-man/orphan.mp3", bytes: 75 }]);
  assert.deepEqual(report.images.orphans, [{ path: "orphan-9999999999.png", bytes: 20 }]);
  // Every other wanted clip (the other speaker, the full-sentence clip) has
  // no file on disk yet — reported as missing, not an error for audio.
  assert.ok(report.audio.missing.length > 0);
  assert.deepEqual(report.images.missing, []);
});

test("analyzeAssets reports a referenced image with no file on disk as missing", () => {
  const lessons = [explanationLesson("l1", "Mira.", { file: "gone-0123456789.png", alt: "" })];
  const report = analyzeAssets(lessons, [], [], {});
  assert.deepEqual(report.images.missing, ["gone-0123456789.png"]);
});

test("analyzeAssets is a pure function: it never reads files itself, only what it's handed", () => {
  // No fs access in this module at all (docs/engineering/assets.md) — the
  // caller (scripts/prune-assets.ts) decides what's on disk, including
  // never walking public/speakers. Draft lessons count as references too:
  // a lesson with no explicit `status` (published, the default) and one
  // marked "draft" are treated identically here.
  const draftLesson = explanationLesson("l1", "Draft.", { file: "draft-0123456789.png", alt: "" });
  (draftLesson as Lesson).status = "draft";
  const report = analyzeAssets([draftLesson], [], [{ path: "draft-0123456789.png", bytes: 5 }], {});
  assert.deepEqual(report.images.orphans, []);
  assert.deepEqual(report.images.missing, []);
});
