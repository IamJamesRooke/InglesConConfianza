// Pure core for `npm run assets:prune` (web/scripts/prune-assets.ts). No fs
// here — the script reads the filesystem and lessons.json and hands the
// results to these functions, which is what makes this unit-testable
// without touching disk. See docs/engineering/assets.md.
//
// "Referenced audio" reuses the generator's own key derivation
// (`listWantedClips` in src/lib/audio/generate-clips.ts) rather than
// re-deriving sha1 hashes here — the two must never drift apart, or a
// dry run would report clips as orphaned that the generator would
// immediately re-want.

import type { Lesson } from "@/lib/lesson-builder/types";
import { listWantedClips, type WantedClip } from "@/lib/audio/generate-clips";

export type FileEntry = { path: string; bytes: number };

export type ManifestShape = Record<string, string[]> & {
  explanations?: Record<string, true>;
  instructions?: Record<string, true>;
};

/** Every clip file the current lessons.json wants, relative to
 * `public/audio/` — e.g. "us-man/<hash>.mp3", "explanations/<hash>.mp3",
 * "instructions/<hash>.mp3". Draft modules/lessons count (the owner may be
 * mid-edit): `lessons` should be the WHOLE file's lessons, unfiltered. */
export function referencedAudioPaths(lessons: Lesson[]): Set<string> {
  return new Set(listWantedClips(lessons).map((clip) => clip.relativePath));
}

/** Every `image.file` named by an explanation block, across every lesson
 * (draft included) — a bare filename under `public/lesson-media/`. */
export function referencedImageFiles(lessons: Lesson[]): Set<string> {
  const files = new Set<string>();
  for (const lesson of lessons) {
    for (const block of lesson.blocks) {
      if (block.type === "explanation" && block.image?.file) {
        files.add(block.image.file);
      }
    }
  }
  return files;
}

/** Files that exist on disk but nothing in lessons.json wants — orphans,
 * safe to delete. `referenced` holds relative paths in the same shape as
 * `existing[].path`. */
export function computeOrphans(
  existing: FileEntry[],
  referenced: Set<string>,
): FileEntry[] {
  return existing.filter((entry) => !referenced.has(entry.path));
}

/** Referenced paths with no file on disk — reported, never deleted. */
export function computeMissing(
  referenced: Set<string>,
  existing: FileEntry[],
): string[] {
  const existingPaths = new Set(existing.map((entry) => entry.path));
  return [...referenced].filter((path) => !existingPaths.has(path)).sort();
}

export type PruneManifestResult = { manifest: ManifestShape; removedKeys: number };

/** Removes manifest entries for clips nothing in `wanted` asks for any more
 * — the top-level speaker map (keyed by hash) and the `explanations`/
 * `instructions` sub-maps alike. Never touches `public/speakers`; this is
 * `manifest.json` content only, the caller decides whether/where to write
 * it. */
export function pruneManifest(
  manifest: ManifestShape,
  wanted: WantedClip[],
): PruneManifestResult {
  const wantedTopHashes = new Set(
    wanted.filter((clip) => clip.kind === "speaker").map((clip) => clip.hash),
  );
  const wantedExplanationHashes = new Set(
    wanted.filter((clip) => clip.kind === "explanation").map((clip) => clip.hash),
  );
  const wantedInstructionHashes = new Set(
    wanted.filter((clip) => clip.kind === "instruction").map((clip) => clip.hash),
  );

  let removedKeys = 0;
  const next: ManifestShape = {};

  // Object.entries(manifest) would type `value` as the union of every
  // property's value type (including `explanations`/`instructions`, handled
  // separately below) — filter those keys out first so the remaining
  // entries are unambiguously the top-level speaker map.
  const speakerEntries = Object.entries(manifest).filter(
    ([key]) => key !== "explanations" && key !== "instructions",
  ) as [string, string[]][];
  for (const [key, value] of speakerEntries) {
    if (wantedTopHashes.has(key)) {
      next[key] = value;
    } else {
      removedKeys += 1;
    }
  }

  if (manifest.explanations) {
    const kept: Record<string, true> = {};
    for (const key of Object.keys(manifest.explanations)) {
      if (wantedExplanationHashes.has(key)) kept[key] = true;
      else removedKeys += 1;
    }
    next.explanations = kept;
  }

  if (manifest.instructions) {
    const kept: Record<string, true> = {};
    for (const key of Object.keys(manifest.instructions)) {
      if (wantedInstructionHashes.has(key)) kept[key] = true;
      else removedKeys += 1;
    }
    next.instructions = kept;
  }

  return { manifest: next, removedKeys };
}

export type AssetsReport = {
  audio: {
    referenced: Set<string>;
    orphans: FileEntry[];
    missing: string[];
  };
  images: {
    referenced: Set<string>;
    orphans: FileEntry[];
    missing: string[];
  };
  manifestPrune: PruneManifestResult;
};

/** The whole dry-run analysis in one pure call — everything the script needs
 * to print or, with `--apply`, act on. `audioFiles`/`imageFiles` are what's
 * actually on disk under `public/audio/**\/*.mp3` and
 * `public/lesson-media/*`. */
export function analyzeAssets(
  lessons: Lesson[],
  audioFiles: FileEntry[],
  imageFiles: FileEntry[],
  manifest: ManifestShape,
): AssetsReport {
  const wanted = listWantedClips(lessons);
  const referencedAudio = new Set(wanted.map((clip) => clip.relativePath));
  const referencedImages = referencedImageFiles(lessons);

  return {
    audio: {
      referenced: referencedAudio,
      orphans: computeOrphans(audioFiles, referencedAudio),
      missing: computeMissing(referencedAudio, audioFiles),
    },
    images: {
      referenced: referencedImages,
      orphans: computeOrphans(imageFiles, referencedImages),
      missing: computeMissing(referencedImages, imageFiles),
    },
    manifestPrune: pruneManifest(manifest, wanted),
  };
}
