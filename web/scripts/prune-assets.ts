// Reports (and, with --apply, deletes) orphaned generated audio clips and
// uploaded lesson images that nothing in data/lessons.json references any
// more — content-hash filenames mean every edit leaves the old file behind.
// See docs/engineering/assets.md. Run: `npm run assets:prune` (dry run) or
// `npm run assets:prune -- --apply`.
//
// Pure analysis lives in src/lib/assets/referenced-assets.ts (unit-tested);
// this script is only fs walking + argv + printing.
import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { readLessonFile } from "../src/lib/lesson-builder/server/lesson-file-io";
import {
  analyzeAssets,
  type FileEntry,
  type ManifestShape,
} from "../src/lib/assets/referenced-assets";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const MANIFEST_PATH = path.join(AUDIO_DIR, "manifest.json");
const LESSON_MEDIA_DIR = path.join(process.cwd(), "public", "lesson-media");

async function walkAudioFiles(): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  async function walk(dir: string) {
    let items: string[];
    try {
      items = await readdir(dir);
    } catch {
      return;
    }
    for (const item of items) {
      const full = path.join(dir, item);
      const info = await stat(full);
      if (info.isDirectory()) {
        await walk(full);
        continue;
      }
      const relative = path.posix.relative(
        AUDIO_DIR.split(path.sep).join("/"),
        full.split(path.sep).join("/"),
      );
      // manifest.json itself is not a clip file.
      if (relative === "manifest.json") continue;
      if (!relative.endsWith(".mp3")) continue;
      entries.push({ path: relative, bytes: info.size });
    }
  }
  await walk(AUDIO_DIR);
  return entries;
}

async function listImageFiles(): Promise<FileEntry[]> {
  let items: string[];
  try {
    items = await readdir(LESSON_MEDIA_DIR);
  } catch {
    return [];
  }
  const entries: FileEntry[] = [];
  for (const item of items) {
    const full = path.join(LESSON_MEDIA_DIR, item);
    const info = await stat(full);
    if (!info.isFile()) continue;
    entries.push({ path: item, bytes: info.size });
  }
  return entries;
}

async function readManifest(): Promise<ManifestShape> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    return JSON.parse(raw || "{}") as ManifestShape;
  } catch {
    return {};
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const apply = process.argv.includes("--apply");

  let lessonFile;
  try {
    lessonFile = await readLessonFile();
  } catch (error) {
    console.error("Unable to parse data/lessons.json:", error);
    console.error(apply ? "Refusing --apply." : "Cannot analyze assets without a valid lessons.json.");
    process.exitCode = 1;
    return;
  }

  if (apply && lessonFile.lessons.length === 0) {
    console.error(
      "Refusing --apply: data/lessons.json has zero lessons (safety) — " +
        "this looks like an empty/broken file, not an empty course.",
    );
    process.exitCode = 1;
    return;
  }

  const [audioFiles, imageFiles, manifest] = await Promise.all([
    walkAudioFiles(),
    listImageFiles(),
    readManifest(),
  ]);

  const report = analyzeAssets(lessonFile.lessons, audioFiles, imageFiles, manifest);

  const orphanAudioBytes = report.audio.orphans.reduce((sum, f) => sum + f.bytes, 0);
  const orphanImageBytes = report.images.orphans.reduce((sum, f) => sum + f.bytes, 0);
  const totalReclaimable = orphanAudioBytes + orphanImageBytes;

  console.log(`Referenced audio clips: ${report.audio.referenced.size}`);
  console.log(`Referenced images: ${report.images.referenced.size}`);
  console.log("");

  console.log(`Orphan audio clips: ${report.audio.orphans.length}`);
  for (const file of report.audio.orphans) {
    console.log(`  audio/${file.path}  (${formatBytes(file.bytes)})`);
  }
  console.log(`Orphan images: ${report.images.orphans.length}`);
  for (const file of report.images.orphans) {
    console.log(`  lesson-media/${file.path}  (${formatBytes(file.bytes)})`);
  }
  console.log(`Total reclaimable: ${formatBytes(totalReclaimable)}`);
  console.log("");

  if (report.audio.missing.length > 0) {
    console.log(
      `Missing audio (referenced, no file yet): ${report.audio.missing.length} — run \`npm run audio:generate\`.`,
    );
    for (const relativePath of report.audio.missing) console.log(`  audio/${relativePath}`);
  } else {
    console.log("Missing audio: none.");
  }

  if (report.images.missing.length > 0) {
    console.log(`ERROR: missing images (referenced, no file on disk): ${report.images.missing.length}`);
    for (const file of report.images.missing) console.log(`  lesson-media/${file}`);
  } else {
    console.log("Missing images: none.");
  }
  console.log("");

  console.log(
    `Manifest.json entries that would be pruned: ${report.manifestPrune.removedKeys}`,
  );

  if (!apply) {
    console.log("");
    console.log("Dry run only — pass --apply to delete orphans and prune the manifest.");
    return;
  }

  for (const file of report.audio.orphans) {
    await rm(path.join(AUDIO_DIR, file.path));
  }
  for (const file of report.images.orphans) {
    await rm(path.join(LESSON_MEDIA_DIR, file.path));
  }
  if (report.manifestPrune.removedKeys > 0) {
    await writeFile(MANIFEST_PATH, JSON.stringify(report.manifestPrune.manifest, null, 2));
  }
  console.log("");
  console.log(
    `Applied: deleted ${report.audio.orphans.length} audio clip(s) and ${report.images.orphans.length} image(s), ` +
      `reclaimed ${formatBytes(totalReclaimable)}, pruned ${report.manifestPrune.removedKeys} manifest entr${
        report.manifestPrune.removedKeys === 1 ? "y" : "ies"
      }.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
