export type DropTarget = {
  lessonId: string;
  position: "before" | "after";
};

export type Lesson = {
  id: string;
  name: string | null;
  blocks: LessonBlock[];
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
  conceptLinks: ConceptLink[];
  languageBlocks: LanguageBlock[];
};

export type LanguageBlock = {
  id: string;
  spanish: string;
  callout: string | null;
  acceptedAnswers: string[];
  conceptLinks: ConceptLink[];
};

export type LessonBlock = ExplanationBlock | SentenceBlock;

export type LessonFile = {
  version: 1;
  lessons: Lesson[];
};

export type ConceptRole =
  | "primary"
  | "introduced"
  | "reinforced"
  | "required"
  | "incidental";

export type ConceptType =
  | "mapping"
  | "vocabulary"
  | "grammar_pattern"
  | "morpheme"
  | "concept_group";

export type MappingDirection =
  | "es_to_en"
  | "en_to_es"
  | "bidirectional"
  | "not_directional";

export type ConceptLink = {
  id: string;
  label: string;
  type: ConceptType;
  direction: MappingDirection;
  sourceText: string;
  targetText: string;
  contextLabel: string;
  role: ConceptRole;
};
