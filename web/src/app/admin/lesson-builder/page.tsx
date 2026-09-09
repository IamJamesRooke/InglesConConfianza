"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import type { DocumentBlockType } from "@/components/lesson-builder/lesson-document";
import { LessonLibrary } from "@/components/lesson-builder/lesson-library";
import { LessonSelector } from "@/components/practice/lesson-selector";
import {
  initialUndoableLessons,
  undoableLessonsReducer,
} from "@/lib/lesson-builder/history";
import type {
  LanguageBlock,
  LessonBlock,
  LessonConcept,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { useLessonPersistence } from "@/lib/lesson-builder/use-lesson-persistence";
import { useLessonPreview } from "@/lib/lesson-builder/use-lesson-preview";
import { createId } from "@/lib/lesson-builder/utils";

type Deletion =
  | { kind: "slide"; lessonId: string; block: LessonBlock; index: number }
  | {
      kind: "piece";
      lessonId: string;
      blockId: string;
      piece: LanguageBlock;
      index: number;
    };
function isTextEditingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, [contenteditable='true']"))
  );
}

export default function LessonBuilderPage() {
  const [history, dispatch] = useReducer(
    undoableLessonsReducer,
    initialUndoableLessons,
  );
  const lessons = history.present;
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [deletionUndo, setDeletionUndo] = useState<{
    lessonId: string;
    label: string;
  } | null>(null);
  const deletionRef = useRef<Deletion | null>(null);
  const modulesRef = useRef<LessonModule[]>([]);

  modulesRef.current = modules;
  const currentCourse = useMemo(
    () => ({ lessons, modules }),
    [lessons, modules],
  );
  const onInitialLoad = useCallback((course: typeof currentCourse) => {
    dispatch({ type: "SET_LESSONS", lessons: course.lessons });
    modulesRef.current = course.modules;
    setModules(course.modules);
  }, []);
  const {
    saveState,
    isDirty,
    conceptDisplays,
    save,
    retrySave,
    deleteLesson: deletePersistedLesson,
  } = useLessonPersistence({ currentCourse, onInitialLoad });
  const { preview, openPreview, closePreview } = useLessonPreview(lessons);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const cmd = event.ctrlKey || event.metaKey;
      const alt = event.altKey && !event.ctrlKey && !event.metaKey;
      if (cmd && !event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      } else if (alt && !event.shiftKey && event.code === "KeyK") {
        event.preventDefault();
        document.getElementById("lesson-library-search-input")?.focus();
      } else if (
        cmd &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "z" &&
        !isTextEditingTarget(event.target)
      ) {
        event.preventDefault();
        dispatch({ type: "UNDO" });
      } else if (
        cmd &&
        !event.altKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "z" &&
        !isTextEditingTarget(event.target)
      ) {
        event.preventDefault();
        dispatch({ type: "REDO" });
      } else if (alt && event.shiftKey && event.code === "KeyL") {
        event.preventDefault();
        const target = modulesRef.current.at(-1);
        if (!target) return;
        const lessonId = createId("lesson");
        dispatch({ type: "CREATE_LESSON", lessonId });
        updateModules(
          modulesRef.current.map((module) =>
            module.id === target.id
              ? { ...module, lessonIds: [...module.lessonIds, lessonId] }
              : module,
          ),
        );
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLInputElement>(
              `[data-lesson-title="${lessonId}"]`,
            )
            ?.focus(),
        );
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  function updateModules(next: LessonModule[]) {
    modulesRef.current = next;
    setModules(next);
  }

  function createLesson(moduleId: string) {
    const lessonId = createId("lesson");
    dispatch({ type: "CREATE_LESSON", lessonId });
    updateModules(
      modules.map((module) =>
        module.id === moduleId
          ? { ...module, lessonIds: [...module.lessonIds, lessonId] }
          : module,
      ),
    );
    return lessonId;
  }

  function duplicateLesson(lessonId: string) {
    const duplicateId = createId("lesson");
    dispatch({ type: "DUPLICATE_LESSON", lessonId, duplicateId });
    updateModules(
      modules.map((module) => {
        const index = module.lessonIds.indexOf(lessonId);
        return index < 0
          ? module
          : {
              ...module,
              lessonIds: module.lessonIds.toSpliced(index + 1, 0, duplicateId),
            };
      }),
    );
  }

  async function deleteLesson(lessonId: string) {
    const result = await deletePersistedLesson(lessonId);
    if (!result) return;
    dispatch({ type: "DELETE_LESSON", lessonId });
    updateModules(result.modules);
  }

  function addModule() {
    updateModules([
      ...modules,
      {
        id: createId("module"),
        name: `Module ${modules.length + 1}`,
        keyConcepts: [],
        lessonIds: [],
      },
    ]);
  }

  function deleteModule(moduleId: string) {
    if (modules.length === 1) return;
    const index = modules.findIndex((module) => module.id === moduleId);
    const removed = modules[index];
    const destination = modules[index > 0 ? index - 1 : 1];
    if (!removed || !destination) return;
    updateModules(
      modules
        .filter((module) => module.id !== moduleId)
        .map((module) =>
          module.id === destination.id
            ? {
                ...module,
                lessonIds: [...module.lessonIds, ...removed.lessonIds],
              }
            : module,
        ),
    );
  }

  function moveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    [next[index], next[target]] = [next[target], next[index]];
    updateModules(next);
  }

  function moveLessonWithinModule(
    moduleId: string,
    index: number,
    direction: -1 | 1,
  ) {
    const target = index + direction;
    updateModules(
      modules.map((module) => {
        if (
          module.id !== moduleId ||
          target < 0 ||
          target >= module.lessonIds.length
        )
          return module;
        const lessonIds = [...module.lessonIds];
        [lessonIds[index], lessonIds[target]] = [
          lessonIds[target],
          lessonIds[index],
        ];
        return { ...module, lessonIds };
      }),
    );
  }

  function moveLessonToPosition(
    lessonId: string,
    moduleId: string,
    insertionIndex: number,
  ) {
    const source = modules.find((module) =>
      module.lessonIds.includes(lessonId),
    );
    const sourceIndex = source?.lessonIds.indexOf(lessonId) ?? -1;
    updateModules(
      modules.map((module) => {
        const without = module.lessonIds.filter((id) => id !== lessonId);
        if (module.id !== moduleId) return { ...module, lessonIds: without };
        const at =
          source?.id === moduleId && sourceIndex < insertionIndex
            ? insertionIndex - 1
            : insertionIndex;
        return {
          ...module,
          lessonIds: without.toSpliced(
            Math.max(0, Math.min(at, without.length)),
            0,
            lessonId,
          ),
        };
      }),
    );
  }

  function moveLessonToModule(lessonId: string, moduleId: string) {
    const destination = modules.find((module) => module.id === moduleId);
    moveLessonToPosition(
      lessonId,
      moduleId,
      destination?.lessonIds.length ?? 0,
    );
  }

  function patchModule(moduleId: string, patch: Partial<LessonModule>) {
    updateModules(
      modules.map((module) =>
        module.id === moduleId ? { ...module, ...patch } : module,
      ),
    );
  }

  function addBlock(
    lessonId: string,
    type: DocumentBlockType,
    insertionIndex: number,
  ) {
    const blockId = createId("block");
    if (type === "explanation") {
      dispatch({
        type: "ADD_EXPLANATION_BLOCK",
        lessonId,
        insertionIndex,
        blockId,
      });
      return blockId;
    }
    dispatch({
      type: "ADD_SENTENCE_BLOCK",
      lessonId,
      insertionIndex,
      blockId,
      languageBlockId: createId("lang"),
      ...(type === "vocabulary" ? { layout: "vocabulary_table" as const } : {}),
    });
    return blockId;
  }

  function addPiece(lessonId: string, blockId: string) {
    const languageBlockId = createId("lang");
    dispatch({
      type: "ADD_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId: blockId,
      languageBlockId,
    });
    return languageBlockId;
  }

  function deleteBlock(lessonId: string, blockId: string) {
    const lesson = lessons.find((candidate) => candidate.id === lessonId);
    const index =
      lesson?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    const block = lesson?.blocks[index];
    if (!block) return;
    deletionRef.current = { kind: "slide", lessonId, block, index };
    setDeletionUndo({ lessonId, label: "Slide deleted" });
    dispatch({ type: "DELETE_CONTENT_BLOCK", lessonId, blockId });
  }

  function deletePiece(lessonId: string, blockId: string, pieceId: string) {
    const block = lessons
      .find((lesson) => lesson.id === lessonId)
      ?.blocks.find((candidate) => candidate.id === blockId);
    if (!block || block.type !== "sentence") return;
    const index = block.languageBlocks.findIndex(
      (piece) => piece.id === pieceId,
    );
    const piece = block.languageBlocks[index];
    if (!piece) return;
    deletionRef.current = { kind: "piece", lessonId, blockId, piece, index };
    setDeletionUndo({ lessonId, label: "Sentence piece deleted" });
    dispatch({
      type: "DELETE_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId: blockId,
      languageBlockId: pieceId,
    });
  }

  function undoDeletion() {
    const deleted = deletionRef.current;
    if (!deleted) return;
    if (deleted.kind === "slide")
      dispatch({
        type: "RESTORE_CONTENT_BLOCK",
        lessonId: deleted.lessonId,
        block: deleted.block,
        insertionIndex: deleted.index,
      });
    else
      dispatch({
        type: "RESTORE_LANGUAGE_BLOCK",
        lessonId: deleted.lessonId,
        sentenceBlockId: deleted.blockId,
        languageBlock: deleted.piece,
        insertionIndex: deleted.index,
      });
    deletionRef.current = null;
    setDeletionUndo(null);
  }

  function moveBlock(lessonId: string, blockId: string, direction: -1 | 1) {
    const lesson = lessons.find((candidate) => candidate.id === lessonId);
    const index =
      lesson?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    const target = lesson?.blocks[index + direction];
    if (!target) return;
    dispatch({
      type: "MOVE_CONTENT_BLOCK",
      lessonId,
      draggedId: blockId,
      targetId: target.id,
      position: direction < 0 ? "before" : "after",
    });
  }

  const saveLabel =
    saveState === "loading"
      ? "Loading…"
      : saveState === "saving"
        ? "Saving…"
        : saveState === "error"
          ? "Save failed"
          : isDirty
            ? "Unsaved changes"
            : "All changes saved";

  return (
    <main className="lesson-builder-page flex-1 bg-background px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto w-full max-w-[1180px]">
        <LessonLibrary
          modules={modules}
          lessons={lessons}
          conceptDisplays={conceptDisplays}
          saveLabel={saveLabel}
          saveFailed={saveState === "error"}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          onUndo={() => dispatch({ type: "UNDO" })}
          onRedo={() => dispatch({ type: "REDO" })}
          onRetrySave={() => void retrySave()}
          onNewLesson={createLesson}
          onPreviewLesson={openPreview}
          onDuplicateLesson={duplicateLesson}
          onDeleteLesson={(id) => void deleteLesson(id)}
          onAddModule={addModule}
          onDeleteModule={deleteModule}
          onMoveModule={moveModule}
          onMoveLesson={moveLessonWithinModule}
          onDropLesson={moveLessonToPosition}
          onMoveLessonToModule={moveLessonToModule}
          onChangeModule={patchModule}
          onRenameLesson={(lessonId, name) =>
            dispatch({ type: "RENAME_LESSON", lessonId, name })
          }
          onAddLessonConcept={(lessonId, concept: LessonConcept) =>
            dispatch({ type: "ADD_LESSON_CONCEPT", lessonId, concept })
          }
          onRemoveLessonConcept={(lessonId, lessonConceptId) =>
            dispatch({
              type: "REMOVE_LESSON_CONCEPT",
              lessonId,
              lessonConceptId,
            })
          }
          onRelabelLessonConcept={(lessonId, lessonConceptId, label) =>
            dispatch({
              type: "RELABEL_LESSON_CONCEPT",
              lessonId,
              lessonConceptId,
              label,
            })
          }
          onUpdateExplanation={(lessonId, blockId, contentMarkdown) =>
            dispatch({
              type: "UPDATE_EXPLANATION_BLOCK",
              lessonId,
              blockId,
              contentMarkdown,
            })
          }
          onUpdateSentence={(lessonId, sentenceBlockId, field, value) =>
            dispatch({
              type: "UPDATE_SENTENCE_BLOCK",
              lessonId,
              sentenceBlockId,
              patch: { [field]: value },
            })
          }
          onUpdateSpanish={(
            lessonId,
            sentenceBlockId,
            languageBlockId,
            spanish,
          ) =>
            dispatch({
              type: "UPDATE_LANGUAGE_BLOCK",
              lessonId,
              sentenceBlockId,
              languageBlockId,
              patch: { spanish },
            })
          }
          onUpdateAnswer={(
            lessonId,
            sentenceBlockId,
            languageBlockId,
            answerIndex,
            value,
          ) =>
            dispatch({
              type: "UPDATE_ACCEPTED_ANSWER",
              lessonId,
              sentenceBlockId,
              languageBlockId,
              answerIndex,
              value,
            })
          }
          onUpdateCallout={(
            lessonId,
            sentenceBlockId,
            languageBlockId,
            callout,
          ) =>
            dispatch({
              type: "UPDATE_LANGUAGE_BLOCK",
              lessonId,
              sentenceBlockId,
              languageBlockId,
              patch: { callout },
            })
          }
          onAddAnswer={(lessonId, sentenceBlockId, languageBlockId) =>
            dispatch({
              type: "ADD_ACCEPTED_ANSWER",
              lessonId,
              sentenceBlockId,
              languageBlockId,
            })
          }
          onRemoveAnswer={(
            lessonId,
            sentenceBlockId,
            languageBlockId,
            answerIndex,
          ) =>
            dispatch({
              type: "REMOVE_ACCEPTED_ANSWER",
              lessonId,
              sentenceBlockId,
              languageBlockId,
              answerIndex,
            })
          }
          onAddPiece={addPiece}
          onDeletePiece={deletePiece}
          onAddBlock={addBlock}
          onDeleteBlock={deleteBlock}
          onDuplicateBlock={(lessonId, blockId) =>
            dispatch({ type: "DUPLICATE_CONTENT_BLOCK", lessonId, blockId })
          }
          onMoveBlock={moveBlock}
          onReorderBlock={(lessonId, draggedId, targetId, position) =>
            dispatch({
              type: "MOVE_CONTENT_BLOCK",
              lessonId,
              draggedId,
              targetId,
              position,
            })
          }
          deletionUndo={deletionUndo}
          onUndoDeletion={undoDeletion}
          onEndHistoryGroup={() => dispatch({ type: "END_HISTORY_GROUP" })}
        />
      </div>
      {preview && (
        <LessonSelector
          lessons={[preview]}
          initialLessonId={preview.id}
          onCloseLesson={closePreview}
        />
      )}
    </main>
  );
}
