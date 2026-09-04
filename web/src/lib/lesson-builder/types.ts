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
  helperText: string;
  answerFeedback: string | null;
  languageBlocks: LanguageBlock[];
};

export type LanguageBlock = {
  id: string;
  spanish: string;
  callout: string | null;
  acceptedAnswers: string[];
};

export type LessonBlock = ExplanationBlock | SentenceBlock;

// A module groups lessons into one learner-facing unit. `keyConcepts` are the
// curriculum concepts the module intends to teach (authored the same way as a
// lesson's `concepts`); a key concept is "met" when some lesson in the module
// covers it. Modules and lessons both live in data/lessons.json (nothing about
// lessons is in Postgres).
export type LessonModule = {
  id: string;
  name: string | null;
  kind?: "course" | "onboarding";
  keyConcepts: LessonConcept[];
  lessonIds: string[];
};

export type LessonFile = {
  version: 2;
  modules: LessonModule[];
  // Invariant: ordered to match modules.flatMap((m) => m.lessonIds), same id set.
  lessons: Lesson[];
};

// The pre-modules file shape, still read from disk until the first v2 write.
export type LessonFileV1 = {
  version: 1;
  lessons: Lesson[];
};
