"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ConceptDisplayLookup,
  Lesson,
  LessonFile,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { normalizeLessons } from "@/lib/lesson-builder/utils";

export type LessonCourseDraft = {
  lessons: Lesson[];
  modules: LessonModule[];
};

export type LessonSaveState = "loading" | "idle" | "saving" | "saved" | "error";

type LoadedLessonFile = LessonFile & {
  conceptDisplays?: ConceptDisplayLookup;
};

export type LessonPersistenceTransport = {
  load: () => Promise<LoadedLessonFile>;
  saveLesson: (
    lesson: Lesson,
    placement: { moduleId: string | undefined; insertionIndex: number },
  ) => Promise<void>;
  saveModules: (modules: LessonModule[]) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
};

type PersistenceObserver = {
  onAcknowledged: () => void;
  onSaveState: (state: Exclude<LessonSaveState, "loading" | "idle">) => void;
};

type DeleteLessonResult = {
  modules: LessonModule[];
};

const browserTransport: LessonPersistenceTransport = {
  async load() {
    const response = await fetch("/api/admin/lesson-builder/lessons");
    if (!response.ok) throw new Error("load failed");
    return response.json() as Promise<LoadedLessonFile>;
  },

  async saveLesson(lesson, placement) {
    const response = await fetch(
      `/api/admin/lesson-builder/lessons/${encodeURIComponent(lesson.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson, ...placement }),
      },
    );
    if (!response.ok) throw new Error("lesson save failed");
  },

  async saveModules(modules) {
    const response = await fetch("/api/admin/lesson-builder/course", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules }),
    });
    if (!response.ok) throw new Error("course save failed");
  },

  async deleteLesson(lessonId) {
    const response = await fetch(
      `/api/admin/lesson-builder/lessons/${encodeURIComponent(lessonId)}`,
      { method: "DELETE" },
    );
    if (!response.ok) throw new Error("delete failed");
  },
};

export class LessonPersistenceQueue {
  private readonly transport: LessonPersistenceTransport;
  private readonly observer: PersistenceObserver;
  private acknowledgedLessons = new Map<string, string>();
  private acknowledgedModules = "[]";
  private pendingDeletionIds = new Set<string>();
  private requestChain: Promise<void> = Promise.resolve();

  constructor(transport: LessonPersistenceTransport, observer: PersistenceObserver) {
    this.transport = transport;
    this.observer = observer;
  }

  load() {
    return this.transport.load();
  }

  acknowledgeInitial(course: LessonCourseDraft) {
    this.acknowledgedLessons = new Map(
      course.lessons.map((lesson) => [lesson.id, JSON.stringify(lesson)]),
    );
    this.acknowledgedModules = JSON.stringify(course.modules);
    this.observer.onAcknowledged();
  }

  isDirty(course: LessonCourseDraft) {
    return (
      course.lessons.some(
        (lesson) =>
          this.acknowledgedLessons.get(lesson.id) !== JSON.stringify(lesson),
      ) || JSON.stringify(course.modules) !== this.acknowledgedModules
    );
  }

  hasDirtyLessons(lessons: Lesson[]) {
    return lessons.some(
      (lesson) =>
        !this.pendingDeletionIds.has(lesson.id) &&
        this.acknowledgedLessons.get(lesson.id) !== JSON.stringify(lesson),
    );
  }

  hasUnsavedNewLesson(lessons: Lesson[]) {
    return lessons.some(
      (lesson) =>
        !this.pendingDeletionIds.has(lesson.id) &&
        !this.acknowledgedLessons.has(lesson.id),
    );
  }

  areModulesDirty(modules: LessonModule[]) {
    return JSON.stringify(modules) !== this.acknowledgedModules;
  }

  save(course: LessonCourseDraft) {
    const deletionIds = new Set(this.pendingDeletionIds);
    const lessonSnapshot = course.lessons.filter(
      (lesson) => !deletionIds.has(lesson.id),
    );
    const moduleSnapshot = course.modules.map((module) => ({
      ...module,
      lessonIds: module.lessonIds.filter((id) => !deletionIds.has(id)),
    }));

    this.requestChain = this.requestChain.then(async () => {
      this.observer.onSaveState("saving");
      try {
        for (const lesson of lessonSnapshot) {
          await this.saveLesson(lesson, moduleSnapshot);
        }
        await this.saveModules(moduleSnapshot);
        this.observer.onSaveState("saved");
      } catch {
        this.observer.onSaveState("error");
      }
    });
    return this.requestChain;
  }

  delete(course: LessonCourseDraft, lessonId: string) {
    this.pendingDeletionIds.add(lessonId);
    const moduleSnapshot = course.modules.map((module) => ({
      ...module,
      lessonIds: module.lessonIds.filter((id) => id !== lessonId),
    }));

    let result: DeleteLessonResult | null = null;
    const operation = this.requestChain.then(async () => {
      this.observer.onSaveState("saving");
      try {
        if (this.acknowledgedLessons.has(lessonId)) {
          await this.transport.deleteLesson(lessonId);
        }
        this.acknowledgedLessons.delete(lessonId);
        this.acknowledgedModules = JSON.stringify(moduleSnapshot);
        this.pendingDeletionIds.delete(lessonId);
        this.observer.onAcknowledged();
        this.observer.onSaveState("saved");
        result = { modules: moduleSnapshot };
      } catch {
        this.pendingDeletionIds.delete(lessonId);
        this.observer.onSaveState("error");
      }
    });
    this.requestChain = operation;
    return operation.then(() => result);
  }

  private async saveLesson(lesson: Lesson, modules: LessonModule[]) {
    const lessonJson = JSON.stringify(lesson);
    if (this.acknowledgedLessons.get(lesson.id) === lessonJson) return;
    const owner = modules.find((module) => module.lessonIds.includes(lesson.id));
    await this.transport.saveLesson(lesson, {
      moduleId: owner?.id,
      insertionIndex: owner?.lessonIds.indexOf(lesson.id) ?? 0,
    });
    this.acknowledgedLessons.set(lesson.id, lessonJson);
    this.observer.onAcknowledged();
  }

  private async saveModules(modules: LessonModule[]) {
    const modulesJson = JSON.stringify(modules);
    if (modulesJson === this.acknowledgedModules) return;
    await this.transport.saveModules(modules);
    this.acknowledgedModules = modulesJson;
    this.observer.onAcknowledged();
  }
}

export function useLessonPersistence({
  currentCourse,
  onInitialLoad,
  transport = browserTransport,
}: {
  currentCourse: LessonCourseDraft;
  onInitialLoad: (course: LessonCourseDraft) => void;
  transport?: LessonPersistenceTransport;
}) {
  const [saveState, setSaveState] = useState<LessonSaveState>("loading");
  const [conceptDisplays, setConceptDisplays] = useState<ConceptDisplayLookup>({});
  const [acknowledgementVersion, setAcknowledgementVersion] = useState(0);
  const courseRef = useRef(currentCourse);
  const onInitialLoadRef = useRef(onInitialLoad);
  const lessonSaveTimer = useRef<number | undefined>(undefined);
  const courseSaveTimer = useRef<number | undefined>(undefined);
  const [queue] = useState(
    () => new LessonPersistenceQueue(transport, {
      onAcknowledged: () => setAcknowledgementVersion((version) => version + 1),
      onSaveState: setSaveState,
    }),
  );

  useEffect(() => {
    courseRef.current = currentCourse;
    onInitialLoadRef.current = onInitialLoad;
  }, [currentCourse, onInitialLoad]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const file = await queue.load();
        if (!mounted) return;
        const course = {
          lessons: normalizeLessons(file.lessons),
          modules: file.modules,
        };
        queue.acknowledgeInitial(course);
        setConceptDisplays(file.conceptDisplays ?? {});
        onInitialLoadRef.current(course);
        setSaveState("idle");
      } catch {
        if (mounted) setSaveState("error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [queue]);

  const dirtyState = useMemo(
    () => {
      void acknowledgementVersion;
      return {
        dirtyLessons: queue.hasDirtyLessons(currentCourse.lessons),
        hasUnsavedNewLesson: queue.hasUnsavedNewLesson(currentCourse.lessons),
        modulesDirty: queue.areModulesDirty(currentCourse.modules),
        isDirty: queue.isDirty(currentCourse),
      };
    },
    [acknowledgementVersion, currentCourse, queue],
  );

  const save = useCallback(
    () => queue.save(courseRef.current),
    [queue],
  );

  // Flushes any pending debounce and saves immediately if there's anything
  // to save — used for the explicit "don't wait" moments (collapsing a
  // lesson, leaving its row, Ctrl/⌘ S, unload, opening preview) so a save
  // never silently waits out the idle window past one of those points.
  // Reads dirtiness straight off the queue/ref (both stable identities) so
  // this callback itself never goes stale.
  const flush = useCallback(() => {
    window.clearTimeout(lessonSaveTimer.current);
    window.clearTimeout(courseSaveTimer.current);
    if (queue.isDirty(courseRef.current)) void save();
  }, [queue, save]);

  // Idle debounce, not a throttle: every edit (a new `currentCourse.lessons`
  // identity from the reducer) restarts the 2000ms window, so the save only
  // fires once the teacher has actually paused — never mid-word. The
  // explicit flush points above are what keep that from ever meaning "my
  // work sat unsaved for a while."
  useEffect(() => {
    if (
      saveState === "loading" ||
      saveState === "error" ||
      !dirtyState.dirtyLessons
    ) {
      window.clearTimeout(lessonSaveTimer.current);
      return;
    }
    window.clearTimeout(lessonSaveTimer.current);
    lessonSaveTimer.current = window.setTimeout(() => {
      void save();
    }, 2000);
    return () => window.clearTimeout(lessonSaveTimer.current);
  }, [currentCourse.lessons, dirtyState.dirtyLessons, save, saveState]);

  useEffect(() => {
    if (
      saveState === "loading" ||
      saveState === "error" ||
      !dirtyState.modulesDirty ||
      dirtyState.hasUnsavedNewLesson
    ) {
      return;
    }
    window.clearTimeout(courseSaveTimer.current);
    courseSaveTimer.current = window.setTimeout(() => {
      void save();
    }, 500);
    return () => window.clearTimeout(courseSaveTimer.current);
  }, [
    dirtyState.hasUnsavedNewLesson,
    dirtyState.modulesDirty,
    save,
    saveState,
  ]);

  useEffect(() => {
    if (!dirtyState.isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      flush();
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyState.isDirty, flush]);

  const deleteLesson = useCallback(
    (lessonId: string) => queue.delete(courseRef.current, lessonId),
    [queue],
  );

  // A concept picked or edited during the session (typeahead, quick edit)
  // joins the lookup so every chip for it — lesson Covers and the syllabus
  // card alike — shows its English target without a reload.
  const recordConceptDisplay = useCallback(
    (conceptId: string, display: ConceptDisplayLookup[string]) => {
      setConceptDisplays((current) =>
        current[conceptId]?.spanish === display.spanish &&
        current[conceptId]?.english === display.english &&
        current[conceptId]?.role === display.role
          ? current
          : { ...current, [conceptId]: display },
      );
    },
    [],
  );

  return {
    saveState,
    isDirty: dirtyState.isDirty,
    conceptDisplays,
    recordConceptDisplay,
    save,
    retrySave: save,
    flush,
    deleteLesson,
  };
}
