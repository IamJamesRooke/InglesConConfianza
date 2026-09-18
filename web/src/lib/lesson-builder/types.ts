export type Lesson = {
  id: string;
  name: string | null;
  // Absent (or "published") means visible to learners — the default for
  // every existing lesson. "draft" hides the lesson from `/` and `/practice`
  // server-side (course-summary.ts) while it stays fully visible/editable
  // in the builder.
  status?: "draft" | "published";
  // Teacher-only free text (why this lesson exists, what to fix, what a
  // friend said) — never read by any learner-facing surface. No UI for it
  // yet; the field only needs to survive load/save/import/export.
  notes?: string;
  concepts: LessonConcept[];
  blocks: LessonBlock[];
};

// A curriculum concept this whole lesson teaches, added from the quick field
// under the lesson title. `conceptId` points at a curriculum_concepts row when
// the entry was picked from search; it is null for a free-typed entry that has
// no catalog match yet.
export type LessonConcept = {
  id: string;
  conceptId: string | null;
  label: string;
};

export type ExplanationBlock = {
  id: string;
  type: "explanation";
  contentMarkdown: string;
  // An optional single image shown ABOVE the explanation text on the
  // learner side (owner, 2026-09-18). `file` is a bare filename (no path) living in
  // `web/public/lesson-media/`, uploaded through
  // `POST /api/admin/lesson-builder/media`; `alt` is the Spanish alt text.
  // See docs/design/lesson-builder.md and docs/design/lesson-script-grammar.md
  // (`[[img: file | alt]]`).
  image?: { file: string; alt: string };
};

export type SentenceBlock = {
  id: string;
  type: "sentence";
  layout?: "sentence" | "vocabulary_table";
  promptLabel: string;
  promptText: string;
  /** @deprecated Retained for lesson-file compatibility; intentionally inert in authoring and practice UI. */
  helperText: string;
  /** @deprecated Retained for lesson-file compatibility; normal success UI replaces authored feedback. */
  answerFeedback: string | null;
  languageBlocks: LanguageBlock[];
};

export type LanguageBlock = {
  id: string;
  spanish: string;
  callout: string | null;
  acceptedAnswers: string[];
  // A "given" piece is shown to the learner (both languages) but never
  // tested and never counted toward completion — an ellipsis, a name, a
  // number the sentence needs but the lesson isn't teaching. Absent (or
  // false) means tested, the default for every existing lesson file.
  given?: true;
  // A "capture" piece asks the learner for something about themselves — the
  // last piece of "My name is ___" — and stores what they type under `key`
  // (localStorage `icc.learner.v1`), for later lessons to speak back with a
  // `{key}` token. It has a Spanish prompt like any other piece but NO fixed
  // English answer: `acceptedAnswers` is empty and nothing is matched, so it
  // can never be wrong. `suffix` is literal text appended after the stored
  // value when the piece is displayed — the full stop in "My name is James."
  // — so the learner doesn't have to type punctuation.
  // See docs/design/onboarding.md "The capture piece".
  capture?: { key: string; suffix?: string };
};

export type LessonBlock = ExplanationBlock | SentenceBlock;

// A module groups lessons into one learner-facing unit. Modules and lessons
// both live in data/lessons.json (nothing about lessons is in Postgres).
export type LessonModule = {
  id: string;
  name: string | null;
  kind?: "course" | "onboarding";
  // Learner-facing Spanish promise ("what will the learner be able to
  // say?"), shown under the module name on the learner home. Absent or
  // empty means no description.
  description?: string;
  // Absent (or "published") means visible to learners — the default for
  // every existing module. "draft" hides the whole module (and its
  // lessons) from `/` and `/practice` server-side.
  status?: "draft" | "published";
  // Stored, not enforced yet (see docs/design/product-vision.md §4/§6):
  // absent (or "free") means free. Nothing reads this outside the builder.
  access?: "free" | "premium";
  lessonIds: string[];
  // The module's mandatory teaching list — see docs/design/module-syllabus.md.
  // Coverage, "also taught", "reviewed", the known set, review priority,
  // warnings, and "done" are all derived from this (syllabus.ts); nothing
  // else about the syllabus is stored. Absent on modules written before this
  // feature; treat as `{ main: [], review: [] }`.
  syllabus?: {
    main: LessonConcept[];
    review: LessonConcept[];
  };
};

export type LessonFile = {
  version: 2;
  modules: LessonModule[];
  // Invariant: ordered to match modules.flatMap((m) => m.lessonIds), same id set.
  lessons: Lesson[];
};

// `collections` is the concept's `pos:*`/`grammar:*`/`construction:*`
// collection names (e.g. `["pos:pronoun", "grammar:prepositional-pronoun"]`),
// absent when it has none — the module syllabus card groups its pills by
// them (syllabus-groups.ts).
export type ConceptDisplayLookup = Record<
  string,
  { spanish: string; english: string; role?: string; collections?: string[] }
>;

// The pre-modules file shape, still read from disk until the first v2 write.
export type LessonFileV1 = {
  version: 1;
  lessons: Lesson[];
};
