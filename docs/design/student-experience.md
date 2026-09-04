# Student experience: September 4, 2026

## Direction

The public course is a place to begin and continue real conversations. A bright,
quiet layout uses charcoal type, white surfaces, coral accents, green completion
states, and a locally stored illustration inspired by a conversation in Bogota.
The lesson content, including the James onboarding sequence, is unchanged.

## Student journey

- `/` offers the latest unfinished lesson, module selection, Spanish previews of
  final practiced sentences, approximate durations, and completed lessons.
- Module selection is reflected in `?module=...`. Exiting practice returns to the
  lesson's module. The module tabs support arrows, Home, End, and Tab.
- `/practice?lesson=...` resumes an unfinished lesson at its saved block. It keeps
  a compact header and footer around an independently scrolling teaching area.
- Answers retain immediate recognition, movement to the next answer field,
  temporary hints, authored feedback, and learner-controlled step advancement.
- Completion displays the final practiced English sentence and its Spanish
  source, offers the next lesson, and allows replay. A module-complete message
  requires all available lessons in that module to have been completed.
- Completed lessons reopen from the beginning for review. In-progress text within
  an answer field is not persisted; unfinished lessons resume at the current step.
- Empty courses, unavailable lessons, loading, and read failures have distinct
  student-facing states. Invalid lesson links return to the course home.

## Boundaries

`icc.lessonProgress.v1` stays compatible with existing local completion records.
It adds an optional stable block ID for resume, validates stored entries, listens
for storage updates, and uses session memory when storage is blocked. No accounts
or learner database were introduced. Clearing browser storage clears persistence.

The shared practice component still powers author previews. Preview sessions do
not navigate away from the builder or write student progress. Admin tools remain
under `/admin` and absent from public navigation; this is navigation separation,
not access control. Curriculum and lesson stores were not changed.

## Verification

- Unit coverage includes legacy/malformed progress, stable-ID resume, next-lesson
  selection, completion preservation, blocked storage, outcome extraction, and
  server-rendered public/empty/unavailable course states.
- HTTP checks cover the home page, onboarding route, illustration, admin builder,
  and the redirect in an invalid lesson response.
- Lint passed; all 55 unit tests passed; the production build passed.
- Browser visual and interaction QA remains pending. The requested in-app browser
  reported `Browser is not available: iab`; discovery returned no connections.
  Approval to use standalone headless Chromium was requested, not assumed.
- Responsive CSS targets desktop, tablet, and 320px-and-up phones; it includes
  dynamic viewport sizing, keyboard resize metadata, wrapping text, horizontally
  scrollable module tabs on phones, focus styling, and reduced motion. These are
  implementation details, not a claim of verified browser behavior.

Remaining checks: screenshots at 1440x900, 768x1024, 390x844, and 320x667; complete
the onboarding by typing; request a hint; test keyboard navigation; reload midway
through a lesson; verify completion after returning home; preview a lesson in the
builder; check console errors, touch/keyboard layout, overflow, and contrast.

## Artwork

Asset: `web/public/images/conversation-bogota.webp` (1600x533, about 113 KB).
Generated using the built-in image-generation tool, then encoded as WebP using
the existing Sharp dependency. The original generated PNG was preserved outside
the repository. No external image host is required at runtime.

Generation prompt:

> Use case: illustration-story. Create a polished editorial bitmap illustration
> for an adult language-learning web app in Bogota, Colombia. Wide panoramic
> composition, 3:1 aspect ratio. A friendly everyday conversation between two
> casually dressed adults at a small outdoor cafe in colorful La Candelaria-inspired
> streets, terracotta tiled roofs, green mountains subtly behind, crisp daylight.
> Contemporary sophisticated gouache/cut-paper illustration, refined shapes and
> fine paper texture, natural adult proportions, expressive but understated.
> Palette: clean pale ice blue background, tomato coral, forest green, cornflower
> blue, white, subtle mustard detail. Scene and people concentrated on the RIGHT
> HALF, left half largely clean pale ice blue open sky/wall negative space for UI
> text that will be added in code. Show people and cafe fully, no extreme crops.
> No text, no lettering, no logos, no speech bubbles, no gradients, no floating
> blobs, no border, no UI mockup. This is a quiet course cover illustration, not a
> children's cartoon.
