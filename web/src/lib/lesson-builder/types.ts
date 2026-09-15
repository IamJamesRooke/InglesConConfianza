export type DropTarget = {
  lessonId: string;
  position: "before" | "after";
};

export type Lesson = {
  id: string;
  name: string | null;
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
};

export type LessonBlock = ExplanationBlock | SentenceBlock;

// A module groups lessons into one learner-facing unit. Modules and lessons
// both live in data/lessons.json (nothing about lessons is in Postgres).
export type LessonModule = {
  id: string;
  name: string | null;
  kind?: "course" | "onboarding";
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

export type ConceptDisplayLookup = Record<
  string,
  { spanish: string; english: string; role?: string }
>;

// The pre-modules file shape, still read from disk until the first v2 write.
export type LessonFileV1 = {
  version: 1;
  lessons: Lesson[];
};
