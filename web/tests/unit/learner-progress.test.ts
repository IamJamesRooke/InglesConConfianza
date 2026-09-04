import assert from "node:assert/strict";
import test from "node:test";
import {
  lessonProgressStorageKey,
  nextLessonToStudy,
  parseProgress,
  readProgress,
  resumeStepIndex,
  saveLessonProgress,
  subscribeToProgress,
} from "../../src/lib/learner/progress";
import { lessonOutcome } from "../../src/lib/learner/presentation";
import type { LessonBlock } from "../../src/lib/lesson-builder/types";

test("progress accepts previous completion records and rejects malformed browser data", () => {
  const date = "2026-09-04T12:00:00Z";
  assert.deepEqual(
    parseProgress(
      JSON.stringify({
        a: { completedAt: date },
        b: null,
        c: 3,
        d: { completedAt: false, lastOpenedAt: "bad", stepId: 5 },
      }),
    ),
    { a: { completedAt: date }, d: {} },
  );
  for (const raw of [null, "broken", "[]", "null", "5"])
    assert.deepEqual(parseProgress(raw), {});
});

test("resume follows stable block IDs when lessons are reordered and restarts missing steps", () => {
  const blocks = [{ id: "new" }, { id: "a" }, { id: "b" }];
  assert.equal(resumeStepIndex(blocks, { stepId: "a" }), 1);
  assert.equal(resumeStepIndex(blocks, { stepId: "deleted" }), 0);
  assert.equal(
    resumeStepIndex(blocks, {
      stepId: "b",
      completedAt: "2026-09-04T12:00:00Z",
    }),
    0,
  );
});

test("continue prioritizes the latest unfinished lesson and excludes unavailable lessons", () => {
  const lessons = [
    { id: "a", stepCount: 4 },
    { id: "b", stepCount: 4 },
    { id: "c", stepCount: 0 },
  ];
  assert.equal(nextLessonToStudy(lessons, {})?.id, "a");
  assert.equal(
    nextLessonToStudy(lessons, {
      a: { lastOpenedAt: "2026-09-04T10:00:00Z" },
      b: { lastOpenedAt: "2026-09-04T11:00:00Z" },
      c: { lastOpenedAt: "2026-09-04T12:00:00Z" },
    })?.id,
    "b",
  );
  assert.equal(
    nextLessonToStudy(lessons, { b: { completedAt: "2026-09-04T12:00:00Z" } })
      ?.id,
    "a",
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
    blocked = true;
    assert.doesNotThrow(() => saveLessonProgress("b", { stepId: "first" }));
    assert.equal(readProgress().b.stepId, "first");
    assert.equal(calls, 4);
  } finally {
    unsubscribe();
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
