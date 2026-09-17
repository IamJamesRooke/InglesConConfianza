import assert from "node:assert/strict";
import test from "node:test";
import {
  lessonProgressStorageKey,
  nextLessonToStudy,
  parseProgress,
  readProgress,
  resetLessonProgress,
  resumeStepIndex,
  saveLessonProgress,
  skipLesson,
  skipLessons,
  subscribeToProgress,
} from "../../src/lib/learner/progress";
import { lessonOutcome } from "../../src/lib/learner/presentation";
import type { LessonBlock } from "../../src/lib/lesson-builder/types";

test("progress accepts previous completion records and rejects malformed browser data", () => {
  const date = "2026-09-04T12:00:00Z";
  assert.deepEqual(
    parseProgress(
      JSON.stringify({
        a: { completedAt: date, skippedAt: date },
        b: null,
        c: 3,
        d: { completedAt: false, lastOpenedAt: "bad", stepId: 5 },
        e: { skippedAt: date },
      }),
    ),
    { a: { completedAt: date }, d: {}, e: { completedAt: date } },
  );
  for (const raw of [null, "broken", "[]", "null", "5"])
    assert.deepEqual(parseProgress(raw), {});
});

test("resume follows stable block IDs when lessons are reordered and restarts missing steps", () => {
  const blocks = [{ id: "new" }, { id: "a" }, { id: "b" }];
  assert.equal(resumeStepIndex(blocks, { stepId: "a" }), 1);
  assert.equal(resumeStepIndex(blocks, { stepId: "deleted" }), 0);
  assert.equal(resumeStepIndex(blocks, undefined), 0);
});

// Owner, 2026-09-17: landing a finished lesson on its completion screen
// meant that once a module was done every entry point (home CTA, every done
// path row) opened a "well done" screen and the course read as broken. The
// methodology is review: a finished lesson replays from its first slide and
// reaches its completion screen again at the end.
test("a finished lesson reopens from its first slide for review", () => {
  const blocks = [{ id: "new" }, { id: "a" }, { id: "b" }];
  assert.equal(
    resumeStepIndex(blocks, {
      stepId: "b",
      completedAt: "2026-09-04T12:00:00Z",
    }),
    0,
  );
});

test("continue takes the first unfinished lesson and excludes unavailable lessons", () => {
  const lessons = [
    { id: "a", stepCount: 4 },
    { id: "b", stepCount: 4 },
    { id: "c", stepCount: 0 },
  ];
  assert.equal(nextLessonToStudy(lessons, {})?.id, "a");
  // Course order, not "whatever was opened most recently": having wandered
  // into a later lesson must never send "Continuar" past an unfinished one
  // (owner, 2026-09-17).
  assert.equal(
    nextLessonToStudy(lessons, {
      a: { lastOpenedAt: "2026-09-04T10:00:00Z" },
      b: { lastOpenedAt: "2026-09-04T11:00:00Z" },
      c: { lastOpenedAt: "2026-09-04T12:00:00Z" },
    })?.id,
    "a",
  );
  assert.equal(
    nextLessonToStudy(lessons, { b: { completedAt: "2026-09-04T12:00:00Z" } })
      ?.id,
    "a",
  );
  assert.equal(
    nextLessonToStudy(lessons, { a: { completedAt: "2026-09-04T12:00:00Z" } })
      ?.id,
    "b",
  );
  assert.equal(
    nextLessonToStudy([{ id: "empty", stepCount: 0 }], {}),
    undefined,
  );
});

test("a completed course still offers a lesson to review", () => {
  assert.equal(
    nextLessonToStudy([{ id: "a", stepCount: 4 }], {
      a: { completedAt: "2026-09-04T12:00:00Z" },
    })?.id,
    "a",
  );
});

// Owner, 2026-09-17: the home's hero — its "vas a poder decir" sentence and
// its "Continuar" CTA — must name the next UNFINISHED lesson. Pressing
// Continuar with lesson 1 finished opened lesson 1's completion screen
// again, because the fallback below picked the first lesson whenever
// nothing unfinished was left (a trailing lesson with no steps yet puts a
// course in that state while the path still reads as unfinished).
test("the home's next lesson is the next unfinished one, and never lesson 1 once it is done", () => {
  const course = [
    { id: "lesson1", stepCount: 6 },
    { id: "lesson2", stepCount: 6 },
    { id: "lesson3", stepCount: 6 },
    // Authored but still empty — invisible to the home, offered by nothing.
    { id: "lesson4", stepCount: 0 },
  ];
  const done = (at: string) => ({ completedAt: at });

  // The CTA href the home builds is `/practice?lesson=${nextLesson.id}`.
  const ctaHref = (progress: Parameters<typeof nextLessonToStudy>[1]) =>
    `/practice?lesson=${nextLessonToStudy(course, progress)?.id}`;

  assert.equal(
    ctaHref({ lesson1: done("2026-09-17T10:00:00Z") }),
    "/practice?lesson=lesson2",
  );
  assert.equal(
    ctaHref({
      lesson1: done("2026-09-17T10:00:00Z"),
      lesson2: done("2026-09-17T11:00:00Z"),
    }),
    "/practice?lesson=lesson3",
  );
  // Every lesson with steps finished: nothing is left to study, so the home
  // switches to its "Todo listo." review hero and "Repasar desde el inicio"
  // goes back to lesson 1.
  assert.equal(
    ctaHref({
      lesson1: done("2026-09-17T10:00:00Z"),
      lesson2: done("2026-09-17T11:00:00Z"),
      lesson3: done("2026-09-17T12:00:00Z"),
    }),
    "/practice?lesson=lesson1",
  );
});

// Owner, 2026-09-17: the home's per-row / per-module / whole-course resets.
// Each one calls resetLessonProgress with just the ids it owns — a row must
// not wipe the rest of the course, and the lesson stays in the course either
// way (only its progress record goes).
test("a row-level reset clears that lesson only, and a module reset clears its own lessons", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const data = new Map<string, string>();
  const events = new EventTarget();
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
      },
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    },
    configurable: true,
  });
  try {
    const at = "2026-09-17T12:00:00Z";
    for (const id of ["m1l1", "m1l2", "m2l1"])
      saveLessonProgress(id, { completedAt: at });

    // The "Reiniciar" button on one finished path row.
    resetLessonProgress(["m1l2"]);
    assert.equal(readProgress().m1l2, undefined);
    assert.ok(readProgress().m1l1.completedAt);
    assert.ok(readProgress().m2l1.completedAt);

    // "Reiniciar módulo" on the first module's section title.
    resetLessonProgress(["m1l1", "m1l2"]);
    assert.equal(readProgress().m1l1, undefined);
    assert.ok(readProgress().m2l1.completedAt);

    // "Reiniciar todo el progreso" in the footer.
    resetLessonProgress(["m1l1", "m1l2", "m2l1"]);
    assert.deepEqual(readProgress(), {});
  } finally {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("completion uses the final practiced sentence, never a concatenated vocabulary table", () => {
  const sentence: LessonBlock = {
    id: "s",
    type: "sentence",
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: [
      {
        id: "a",
        spanish: "Mi nombre es",
        acceptedAnswers: ["My name is"],
        callout: null,
      },
      {
        id: "b",
        spanish: "James.",
        acceptedAnswers: ["James."],
        callout: null,
      },
    ],
  };
  assert.deepEqual(lessonOutcome([sentence]), {
    english: "My name is James.",
    spanish: "Mi nombre es James.",
  });
  assert.equal(
    lessonOutcome([{ ...sentence, layout: "vocabulary_table" }]),
    null,
  );
  assert.equal(lessonOutcome([]), null);
});

test("progress persists, notifies subscribers, preserves completion, and tolerates blocked storage", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const data = new Map<string, string>();
  const events = new EventTarget();
  let blocked = false;
  const fakeWindow = {
    localStorage: {
      getItem: (key: string) => {
        if (blocked) throw new Error("denied");
        return data.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (blocked) throw new Error("denied");
        data.set(key, value);
      },
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  };
  Object.defineProperty(globalThis, "window", {
    value: fakeWindow,
    configurable: true,
  });
  let calls = 0;
  const unsubscribe = subscribeToProgress(() => {
    calls += 1;
  });
  try {
    saveLessonProgress("a", { stepId: "second" });
    assert.equal(
      parseProgress(data.get(lessonProgressStorageKey)!).a.stepId,
      "second",
    );
    saveLessonProgress("a", {
      completedAt: "2026-09-04T12:00:00Z",
      stepId: undefined,
    });
    saveLessonProgress("a", { lastOpenedAt: "2026-09-04T13:00:00Z" });
    assert.ok(readProgress().a.completedAt);
    assert.equal(readProgress().a.stepId, undefined);
    skipLesson("b");
    assert.ok(readProgress().b.completedAt);
    skipLessons(["b", "c"]);
    assert.ok(readProgress().b.completedAt);
    assert.ok(readProgress().c.completedAt);
    resetLessonProgress(["b", "c"]);
    assert.equal(readProgress().b, undefined);
    blocked = true;
    assert.doesNotThrow(() => saveLessonProgress("b", { stepId: "first" }));
    assert.equal(readProgress().b.stepId, "first");
    assert.equal(calls, 7);
  } finally {
    unsubscribe();
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
