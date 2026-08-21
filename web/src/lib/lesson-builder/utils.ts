import type {
  ConceptLink,
  ConceptRole,
  ConceptType,
  Lesson,
  MappingDirection,
  SentenceBlock,
} from "@/lib/lesson-builder/types";

export const conceptRoleOptions = [
  { value: "primary", label: "Primary" },
  { value: "introduced", label: "Introduced" },
  { value: "reinforced", label: "Reinforced" },
  { value: "required", label: "Required" },
  { value: "incidental", label: "Incidental" },
] satisfies Array<{ value: ConceptRole; label: string }>;

export const conceptTypeOptions = [
  { value: "mapping", label: "Mapping" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "grammar_pattern", label: "Grammar pattern" },
  { value: "morpheme", label: "Morpheme" },
  { value: "concept_group", label: "Concept group" },
] satisfies Array<{ value: ConceptType; label: string }>;

export const mappingDirectionOptions = [
  { value: "es_to_en", label: "Spanish → English" },
  { value: "en_to_es", label: "English → Spanish" },
  { value: "bidirectional", label: "Both directions" },
  { value: "not_directional", label: "Not directional" },
] satisfies Array<{ value: MappingDirection; label: string }>;

export function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ");
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createConceptLink(): ConceptLink {
  return {
    id: createId("concept_link"),
    label: "",
    type: "mapping",
    direction: "es_to_en",
    sourceText: "",
    targetText: "",
    contextLabel: "",
    role: "introduced",
  };
}

export function normalizeConceptLink(
  conceptLink: Partial<ConceptLink>,
): ConceptLink {
  return {
    id: conceptLink.id ?? createId("concept_link"),
    label: conceptLink.label ?? "",
    type: conceptLink.type ?? "mapping",
    direction: conceptLink.direction ?? "es_to_en",
    sourceText: conceptLink.sourceText ?? "",
    targetText: conceptLink.targetText ?? "",
    contextLabel: conceptLink.contextLabel ?? "",
    role: conceptLink.role ?? "introduced",
  };
}

export function normalizeLessons(lessons: Lesson[]) {
  return lessons.map((lesson) => ({
    ...lesson,
    blocks: lesson.blocks.map((block) => {
      if (block.type === "explanation") {
        return block;
      }

      return {
        ...block,
        conceptLinks: (block.conceptLinks ?? []).map(normalizeConceptLink),
        languageBlocks: block.languageBlocks.map((languageBlock) => ({
          ...languageBlock,
          conceptLinks: (languageBlock.conceptLinks ?? []).map(
            normalizeConceptLink,
          ),
        })),
      };
    }),
  }));
}

export function getAnswerValidationMessage(
  answers: string[],
  answerIndex: number,
) {
  const normalizedAnswer = normalizeAnswer(answers[answerIndex] ?? "");

  if (!normalizedAnswer) {
    return answerIndex === 0
      ? "Primary English answer is required."
      : "Complete or remove this alternative.";
  }

  const duplicateCount = answers.filter(
    (answer) => normalizeAnswer(answer) === normalizedAnswer,
  ).length;

  return duplicateCount > 1 ? "This answer is duplicated." : null;
}

export function getSentenceValidationIssueCount(sentence: SentenceBlock) {
  if (sentence.languageBlocks.length === 0) {
    return 1;
  }

  return sentence.languageBlocks.reduce((issueCount, languageBlock) => {
    const spanishIssueCount = languageBlock.spanish.trim() ? 0 : 1;
    const answerIssueCount = languageBlock.acceptedAnswers.reduce(
      (answerIssues, _, answerIndex) =>
        answerIssues +
        (getAnswerValidationMessage(
          languageBlock.acceptedAnswers,
          answerIndex,
        )
          ? 1
          : 0),
      0,
    );

    return issueCount + spanishIssueCount + answerIssueCount;
  }, 0);
}
