import assert from "node:assert/strict";
import test from "node:test";

import {
  LessonPersistenceQueue,
  type LessonCourseDraft,
  type LessonPersistenceTransport,
  type LessonSaveState,
} from "../../src/lib/lesson-builder/use-lesson-persistence";
import type { Lesson, LessonModule } from "../../src/lib/lesson-builder/types";

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
  reject: () => void;
};

type TransportCall =
  | { kind: "lesson"; lesson: Lesson; deferred: Deferred }
  | { kind: "modules"; modules: LessonModule[]; deferred: Deferred }
  | { kind: "delete"; lessonId: string; deferred: Deferred };

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = () => rejectPromise(new Error("request failed"));
  });
  return { promise, resolve, reject };
}

function lesson(id: string, name: string): Lesson {
  return { id, name, concepts: [], blocks: [] };
}

function moduleWith(...lessonIds: string[]): LessonModule {
  return {
    id: "module-1",
    name: "Module 1",
    lessonIds,
  };
}

function course(lessons: Lesson[], module: LessonModule): LessonCourseDraft {
  return { lessons, modules: [module] };
}

function harness(initialCourse: LessonCourseDraft) {
  const calls: TransportCall[] = [];
  const states: LessonSaveState[] = [];
  const transport: LessonPersistenceTransport = {
    load: async () => ({ version: 2, lessons: [], modules: [] }),
    saveLesson: async (savedLesson) => {
      const request = deferred();
      calls.push({ kind: "lesson", lesson: savedLesson, deferred: request });
      await request.promise;
    },
    saveModules: async (modules) => {
      const request = deferred();
      calls.push({ kind: "modules", modules, deferred: request });
      await request.promise;
    },
    deleteLesson: async (lessonId) => {
      const request = deferred();
      calls.push({ kind: "delete", lessonId, deferred: request });
      await request.promise;
    },
  };
  const queue = new LessonPersistenceQueue(transport, {
    onAcknowledged() {},
    onSaveState(state) {
      states.push(state);
    },
  });
  queue.acknowledgeInitial(initialCourse);
  return { calls, queue, states };
}

async function requestsAdvance() {
  await Promise.resolve();
  await Promise.resolve();
}

test("saves edits to two lessons in lesson order", async () => {
  const initial = course(
    [lesson("lesson-1", "One"), lesson("lesson-2", "Two")],
    moduleWith("lesson-1", "lesson-2"),
  );
  const edited = course(
    [lesson("lesson-1", "One edited"), lesson("lesson-2", "Two edited")],
    initial.modules[0],
  );
  const { calls, queue } = harness(initial);

  const save = queue.save(edited);
  await requestsAdvance();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].kind, "lesson");
  assert.equal(calls[0].kind === "lesson" && calls[0].lesson.id, "lesson-1");

  calls[0].deferred.resolve();
  await requestsAdvance();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].kind, "lesson");
  assert.equal(calls[1].kind === "lesson" && calls[1].lesson.id, "lesson-2");

  calls[1].deferred.resolve();
  await save;
  assert.equal(queue.isDirty(edited), false);
});

test("an acknowledgement does not hide an edit made during a save", async () => {
  const initial = course([lesson("lesson-1", "Initial")], moduleWith("lesson-1"));
  const firstEdit = course([lesson("lesson-1", "First edit")], initial.modules[0]);
  const newerEdit = course([lesson("lesson-1", "Newer edit")], initial.modules[0]);
  const { calls, queue } = harness(initial);

  const firstSave = queue.save(firstEdit);
  await requestsAdvance();
  const secondSave = queue.save(newerEdit);
  calls[0].deferred.resolve();
  await firstSave;

  assert.equal(queue.isDirty(newerEdit), true);
  await requestsAdvance();
  assert.equal(calls.length, 2);
  assert.equal(
    calls[1].kind === "lesson" && calls[1].lesson.name,
    "Newer edit",
  );

  calls[1].deferred.resolve();
  await secondSave;
  assert.equal(queue.isDirty(newerEdit), false);
});

test("a failed save stays dirty and can be retried", async () => {
  const initial = course([lesson("lesson-1", "Initial")], moduleWith("lesson-1"));
  const edited = course([lesson("lesson-1", "Edited")], initial.modules[0]);
  const { calls, queue, states } = harness(initial);

  const failedSave = queue.save(edited);
  await requestsAdvance();
  calls[0].deferred.reject();
  await failedSave;
  assert.equal(states.at(-1), "error");
  assert.equal(queue.isDirty(edited), true);

  const retry = queue.save(edited);
  await requestsAdvance();
  assert.equal(calls.length, 2);
  calls[1].deferred.resolve();
  await retry;
  assert.equal(states.at(-1), "saved");
  assert.equal(queue.isDirty(edited), false);
});

test("deletion waits for a pending first save and then removes the saved lesson", async () => {
  const initial = course([], moduleWith());
  const withNewLesson = course(
    [lesson("lesson-new", "New lesson")],
    moduleWith("lesson-new"),
  );
  const { calls, queue } = harness(initial);

  const pendingSave = queue.save(withNewLesson);
  await requestsAdvance();
  const deletion = queue.delete(withNewLesson, "lesson-new");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].kind, "lesson");

  calls[0].deferred.resolve();
  await requestsAdvance();
  assert.equal(calls[1].kind, "modules");
  calls[1].deferred.resolve();
  await pendingSave;
  await requestsAdvance();
  assert.equal(calls[2].kind, "delete");
  assert.equal(
    calls[2].kind === "delete" && calls[2].lessonId,
    "lesson-new",
  );

  calls[2].deferred.resolve();
  const result = await deletion;
  assert.ok(result);
  assert.deepEqual(result.modules[0].lessonIds, []);
  assert.equal(queue.isDirty(course([], result.modules[0])), false);
});
