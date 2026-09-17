// Module-structure state and handlers (add/delete/move/reorder module, move/create lesson) for the Lesson Builder page.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch } from "react";

import type { SyllabusMarkers } from "@/lib/lesson-builder/builder-context";
import type { UndoableAction } from "@/lib/lesson-builder/history";
import {
  buildCourseTimeline,
  coverageOfItem,
  introducedAndReviewedForLesson,
  knownSetAtLesson,
  moduleStartLesson,
  syllabusOf,
  type LessonReviewSplit,
} from "@/lib/lesson-builder/syllabus";
import type { Lesson, LessonFile, LessonModule } from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

export function useCourseModules(
  dispatch: Dispatch<UndoableAction>,
  lessonsRef: React.RefObject<Lesson[]>,
) {
  const [modules, setModules] = useState<LessonModule[]>([]);
  // Read by getSyllabusMarkers below, the same "stable identity, live data"
  // pattern as lessonsRef — the Covers picker's "in syllabus" / "not
  // introduced yet" markers need the whole course, but must not force every
  // closed lesson row to re-render on every keystroke in the open one.
  const modulesRef = useRef(modules);
  useEffect(() => {
    modulesRef.current = modules;
  }, [modules]);

  const getSyllabusMarkers = useCallback((lessonId: string): SyllabusMarkers => {
    const empty: SyllabusMarkers = {
      known: new Set(),
      mainOfModule: new Set(),
      inSyllabusUncovered: new Set(),
    };
    const currentModules = modulesRef.current;
    const currentLessons = lessonsRef.current;
    const moduleIndex = currentModules.findIndex((module) =>
      module.lessonIds.includes(lessonId),
    );
    if (moduleIndex < 0) return empty;
    const courseModule = currentModules[moduleIndex];
    const syllabus = syllabusOf(courseModule);
    const lessonById = new Map(currentLessons.map((lesson) => [lesson.id, lesson]));
    const moduleLessons = courseModule.lessonIds
      .map((id) => lessonById.get(id))
      .filter((lesson): lesson is (typeof currentLessons)[number] => Boolean(lesson));
    const timeline = buildCourseTimeline(currentModules, currentLessons);
    const lessonPosition = courseModule.lessonIds.indexOf(lessonId);
    const lessonNumber = moduleStartLesson(timeline, moduleIndex) + Math.max(lessonPosition, 0);
    const known = new Set(
      [...knownSetAtLesson(timeline, lessonNumber)]
        .map((key) => timeline.labels.get(key)?.conceptId)
        .filter((id): id is string => Boolean(id)),
    );
    const mainOfModule = new Set(
      syllabus.main.map((item) => item.conceptId).filter((id): id is string => Boolean(id)),
    );
    const inSyllabusUncovered = new Set(
      [...syllabus.main, ...syllabus.review]
        .filter((item) => item.conceptId && !coverageOfItem(item, moduleLessons).covered)
        .map((item) => item.conceptId!),
    );
    return { known, mainOfModule, inSyllabusUncovered };
  }, [lessonsRef]);

  // Introduced/Reviewed split for a lesson's own "Covers" pills (owner,
  // 2026-09-17) — fully derived from course order, same "stable identity,
  // live data" pattern as getSyllabusMarkers above.
  const getLessonReviewSplit = useCallback((lessonId: string): LessonReviewSplit => {
    const empty: LessonReviewSplit = { introduced: [], reviewed: [], priorConceptsExist: false };
    const currentModules = modulesRef.current;
    const currentLessons = lessonsRef.current;
    const lesson = currentLessons.find((candidate) => candidate.id === lessonId);
    if (!lesson) return empty;
    const timeline = buildCourseTimeline(currentModules, currentLessons);
    return introducedAndReviewedForLesson(lesson, lessonId, timeline);
  }, [lessonsRef]);

  const updateModules = useCallback((next: LessonModule[]) => {
    setModules(next);
  }, []);

  const createLesson = useCallback(
    (moduleId: string, insertionIndex?: number) => {
      const lessonId = createId("lesson");
      dispatch({ type: "CREATE_LESSON", lessonId });
      updateModules(
        modules.map((module) => {
          if (module.id !== moduleId) return module;
          const index =
            insertionIndex === undefined
              ? module.lessonIds.length
              : Math.max(0, Math.min(insertionIndex, module.lessonIds.length));
          return {
            ...module,
            lessonIds: module.lessonIds.toSpliced(index, 0, lessonId),
          };
        }),
      );
      return lessonId;
    },
    [dispatch, modules, updateModules],
  );

  const duplicateLesson = useCallback(
    (lessonId: string) => {
      const duplicateId = createId("lesson");
      dispatch({ type: "DUPLICATE_LESSON", lessonId, duplicateId });
      updateModules(
        modules.map((module) => {
          const index = module.lessonIds.indexOf(lessonId);
          return index < 0
            ? module
            : {
                ...module,
                lessonIds: module.lessonIds.toSpliced(
                  index + 1,
                  0,
                  duplicateId,
                ),
              };
        }),
      );
    },
    [dispatch, modules, updateModules],
  );

  // `modules` (unlike `lessons`) only changes on structural moves, never on
  // typing — so wrapping these in useCallback keeps their identity stable
  // across a typing session, which the memoized LessonRow (lesson-library-row.tsx)
  // relies on to skip re-rendering collapsed rows on every keystroke.
  const addModule = useCallback(() => {
    updateModules([
      ...modules,
      {
        id: createId("module"),
        name: `Module ${modules.length + 1}`,
        lessonIds: [],
      },
    ]);
  }, [modules, updateModules]);

  const deleteModule = useCallback(
    (moduleId: string) => {
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
    },
    [modules, updateModules],
  );

  const moveModule = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= modules.length) return;
      const next = [...modules];
      [next[index], next[target]] = [next[target], next[index]];
      updateModules(next);
    },
    [modules, updateModules],
  );

  const reorderModule = useCallback(
    (draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;
      const without = modules.filter((module) => module.id !== draggedId);
      const targetIndex = without.findIndex((module) => module.id === targetId);
      if (targetIndex < 0) return;
      const dragged = modules.find((module) => module.id === draggedId);
      if (!dragged) return;
      updateModules(without.toSpliced(targetIndex, 0, dragged));
    },
    [modules, updateModules],
  );

  const moveLessonToPosition = useCallback(
    (lessonId: string, moduleId: string, insertionIndex: number) => {
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
    },
    [modules, updateModules],
  );

  const moveLessonToModule = useCallback(
    (lessonId: string, moduleId: string) => {
      const destination = modules.find((module) => module.id === moduleId);
      moveLessonToPosition(
        lessonId,
        moduleId,
        destination?.lessonIds.length ?? 0,
      );
    },
    [modules, moveLessonToPosition],
  );

  const patchModule = useCallback(
    (moduleId: string, patch: Partial<LessonModule>) => {
      updateModules(
        modules.map((module) =>
          module.id === moduleId ? { ...module, ...patch } : module,
        ),
      );
    },
    [modules, updateModules],
  );

  const moveLessonKeyboard = useCallback(
    (lessonId: string, direction: -1 | 1): string | null => {
      const homeIndex = modules.findIndex((module) => module.lessonIds.includes(lessonId));
      if (homeIndex < 0) return null;
      const home = modules[homeIndex];
      const position = home.lessonIds.indexOf(lessonId);
      const withinModule = position + direction;
      let destinationModuleId = home.id;
      let insertionIndex: number;
      if (withinModule < 0 || withinModule >= home.lessonIds.length) {
        const adjacentIndex = homeIndex + direction;
        if (adjacentIndex < 0 || adjacentIndex >= modules.length) return null;
        const adjacent = modules[adjacentIndex];
        destinationModuleId = adjacent.id;
        insertionIndex = direction === -1 ? adjacent.lessonIds.length : 0;
      } else {
        insertionIndex = direction > 0 ? withinModule + 1 : withinModule;
      }
      moveLessonToPosition(lessonId, destinationModuleId, insertionIndex);
      return destinationModuleId;
    },
    [modules, moveLessonToPosition],
  );

  const newLessonAfter = useCallback(
    (afterLessonId: string | null, fallbackModuleId: string | null): string | null => {
      if (afterLessonId) {
        const home = modules.find((module) => module.lessonIds.includes(afterLessonId));
        if (home) return createLesson(home.id, home.lessonIds.indexOf(afterLessonId) + 1);
      }
      if (fallbackModuleId) return createLesson(fallbackModuleId);
      return null;
    },
    [modules, createLesson],
  );

  // Backup Import: the server has already validated, normalized, and
  // written the file — replace this session's whole in-memory course with
  // what it echoes back, same as a fresh load.
  const handleImported = useCallback(
    (file: LessonFile) => {
      dispatch({ type: "SET_LESSONS", lessons: file.lessons });
      updateModules(file.modules);
    },
    [dispatch, updateModules],
  );

  return {
    modules,
    modulesRef,
    getSyllabusMarkers,
    getLessonReviewSplit,
    updateModules,
    createLesson,
    duplicateLesson,
    addModule,
    deleteModule,
    moveModule,
    reorderModule,
    moveLessonToPosition,
    moveLessonToModule,
    patchModule,
    moveLessonKeyboard,
    newLessonAfter,
    handleImported,
  };
}
