import "dotenv/config";

// Generates browser-independent audio clips for every piece of English a
// learner will hear, so speak() can prefer a real recording over the
// (voice-availability-dependent) browser synthesizer. See
// docs/design/speech.md "Generating clips". Run: `npm run audio:generate`.
// Without GOOGLE_TTS_API_KEY set, this prints what it would generate and
// exits 0 — the app must work with no key and no clips at all.
//
// Thin wrapper: the actual work (reading lessons, collecting texts, calling
// Google TTS, writing clips + manifest) lives in
// src/lib/audio/generate-clips.ts, which is also called from the admin API
// (POST /api/admin/audio/generate) and the Lesson Builder's own "generate
// audio" actions — this script and those callers share one implementation.
import { generateMissingClips } from "../src/lib/audio/generate-clips";

async function main() {
  await generateMissingClips();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
