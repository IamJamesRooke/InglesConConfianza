import type {
  ConceptLink,
  Lesson,
  LessonConcept,
  SentenceBlock,
} from "@/lib/lesson-builder/types";
import * as mutations from "@/lib/lesson-builder/mutations";

// The lesson builder's document state is `Lesson[]`. Every editing action is a
// pure transform in mutations.ts; this reducer is the thin dispatch layer over
// them so components can take one `dispatch` prop instead of dozens of
// callbacks. UI state (collapse, drag targets, focus) lives in the component,
// not here.

type SentenceFieldPatch = Partial<
  Pick<
    SentenceBlock,
    "promptLabel" | "promptText" | "helperText" | "answerFeedback"
  >
>;

export type LessonsAction =
  | { type: "SET_LESSONS"; lessons: Lesson[] }
  | { type: "SET_LESSON_ORDER"; lessonIds: string[] }
  | { type: "CREATE_LESSON"; lessonId: string }
  | { type: "RENAME_LESSON"; lessonId: string; name: string }
  | {
      type: "ADD_LESSON_CONCEPT";
      lessonId: string;
      concept: LessonConcept;
    }
  | {
      type: "REMOVE_LESSON_CONCEPT";
      lessonId: string;
      lessonConceptId: string;
    }
  | { type: "DELETE_LESSON"; lessonId: string }
  | {
      type: "MOVE_LESSON";
      draggedId: string;
      targetId: string;
      position: "before" | "after";
    }
  | {
      type: "ADD_EXPLANATION_BLOCK";
      lessonId: string;
      insertionIndex: number;
      blockId: string;
    }
  | {
      type: "ADD_SENTENCE_BLOCK";
      lessonId: string;
      insertionIndex: number;
      blockId: string;
      languageBlockId: string;
      layout?: "sentence" | "vocabulary_table";
    }
  | { type: "DELETE_CONTENT_BLOCK"; lessonId: string; blockId: string }
  | { type: "DUPLICATE_CONTENT_BLOCK"; lessonId: string; blockId: string }
  | {
      type: "MOVE_CONTENT_BLOCK";
      lessonId: string;
      draggedId: string;
      targetId: string;
      position: "before" | "after";
    }
  | {
      type: "UPDATE_EXPLANATION_BLOCK";
      lessonId: string;
      blockId: string;
      contentMarkdown: string;
    }
  | {
      type: "UPDATE_SENTENCE_BLOCK";
      lessonId: string;
      sentenceBlockId: string;
      patch: SentenceFieldPatch;
    }
  | {
      type: "ADD_SENTENCE_CONCEPT_LINK";
      lessonId: string;
      sentenceBlockId: string;
      conceptLink: ConceptLink;
    }
  | {
      type: "UPDATE_SENTENCE_CONCEPT_LINK";
      lessonId: string;
      sentenceBlockId: string;
      conceptLinkId: string;
      updates: Partial<Omit<ConceptLink, "id">>;
    }
  | {
      type: "REMOVE_SENTENCE_CONCEPT_LINK";
      lessonId: string;
      sentenceBlockId: string;
      conceptLinkId: string;
    }
  | {
      type: "ADD_LANGUAGE_BLOCK";
      lessonId: string;
      sentenceBlockId: string;
      languageBlockId: string;
    }
  | {
      type: "DELETE_LANGUAGE_BLOCK";
      lessonId: string;
      sentenceBlockId: string;
      languageBlockId: string;
    }
  | {
      type: "UPDATE_LANGUAGE_BLOCK";
      lessonId: string;
      sentenceBlockId: string;
      languageBlockId: string;
      patch: { spanish?: string; callout?: string | null };
    }
  | {
      type: "MOVE_LANGUAGE_BLOCK";
      lessonId: string;
      sentenceBlockId: string;
      draggedId: string;
      targetId: string;
      position: "before" | "after";
    }
  | {
      type: "UPDATE_ACCEPTED_ANSWER";
      lessonId: string;
      sentenceBlockId: string;
      languageBlockId: string;
      answerIndex: number;
      value: string;
    }
  | {
      type: "ADD_ACCEPTED_ANSWER";
      lessonId: string;
      sentenceBlockId: string;
      languageBlockId: string;
    }
  | {
      type: "REMOVE_ACCEPTED_ANSWER";
      lessonId: string;
      sentenceBlockId: string;
      languageBlockId: string;
      answerIndex: number;
    };

export function lessonsReducer(
  lessons: Lesson[],
  action: LessonsAction,
): Lesson[] {
  switch (action.type) {
    case "SET_LESSONS":
      return action.lessons;
    case "SET_LESSON_ORDER":
      return mutations.setLessonOrder(lessons, action.lessonIds);
    case "CREATE_LESSON":
      return mutations.createLesson(lessons, action.lessonId);
    case "RENAME_LESSON":
      return mutations.renameLesson(lessons, action.lessonId, action.name);
    case "ADD_LESSON_CONCEPT":
      return mutations.addLessonConcept(
        lessons,
        action.lessonId,
        action.concept,
      );
    case "REMOVE_LESSON_CONCEPT":
      return mutations.removeLessonConcept(
        lessons,
        action.lessonId,
        action.lessonConceptId,
      );
    case "DELETE_LESSON":
      return mutations.deleteLesson(lessons, action.lessonId);
    case "MOVE_LESSON":
      return mutations.moveLesson(lessons, {
        draggedId: action.draggedId,
        targetId: action.targetId,
        position: action.position,
      });
    case "ADD_EXPLANATION_BLOCK":
      return mutations.addExplanationBlock(
        lessons,
        action.lessonId,
        action.insertionIndex,
        action.blockId,
      );
    case "ADD_SENTENCE_BLOCK":
      return mutations.addSentenceBlock(
        lessons,
        action.lessonId,
        action.insertionIndex,
        action.blockId,
        action.languageBlockId,
        action.layout,
      );
    case "DELETE_CONTENT_BLOCK":
      return mutations.deleteContentBlock(
        lessons,
        action.lessonId,
        action.blockId,
      );
    case "DUPLICATE_CONTENT_BLOCK":
      return mutations.duplicateContentBlock(
        lessons,
        action.lessonId,
        action.blockId,
      );
    case "MOVE_CONTENT_BLOCK":
      return mutations.moveContentBlock(lessons, action.lessonId, {
        draggedId: action.draggedId,
        targetId: action.targetId,
        position: action.position,
      });
    case "UPDATE_EXPLANATION_BLOCK":
      return mutations.updateExplanationBlock(
        lessons,
        action.lessonId,
        action.blockId,
        action.contentMarkdown,
      );
    case "UPDATE_SENTENCE_BLOCK":
      return mutations.updateSentenceBlock(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.patch,
      );
    case "ADD_SENTENCE_CONCEPT_LINK":
      return mutations.addSentenceConceptLink(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.conceptLink,
      );
    case "UPDATE_SENTENCE_CONCEPT_LINK":
      return mutations.updateSentenceConceptLink(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.conceptLinkId,
        action.updates,
      );
    case "REMOVE_SENTENCE_CONCEPT_LINK":
      return mutations.removeSentenceConceptLink(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.conceptLinkId,
      );
    case "ADD_LANGUAGE_BLOCK":
      return mutations.addLanguageBlock(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.languageBlockId,
      );
    case "DELETE_LANGUAGE_BLOCK":
      return mutations.deleteLanguageBlock(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.languageBlockId,
      );
    case "UPDATE_LANGUAGE_BLOCK":
      return mutations.updateLanguageBlock(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.languageBlockId,
        action.patch,
      );
    case "MOVE_LANGUAGE_BLOCK":
      return mutations.moveLanguageBlock(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        {
          draggedId: action.draggedId,
          targetId: action.targetId,
          position: action.position,
        },
      );
    case "UPDATE_ACCEPTED_ANSWER":
      return mutations.updateAcceptedAnswer(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.languageBlockId,
        action.answerIndex,
        action.value,
      );
    case "ADD_ACCEPTED_ANSWER":
      return mutations.addAcceptedAnswer(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.languageBlockId,
      );
    case "REMOVE_ACCEPTED_ANSWER":
      return mutations.removeAcceptedAnswer(
        lessons,
        action.lessonId,
        action.sentenceBlockId,
        action.languageBlockId,
        action.answerIndex,
      );
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}
