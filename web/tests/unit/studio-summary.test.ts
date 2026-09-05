import assert from "node:assert/strict";
import test from "node:test";

import { buildStudioSummary } from "../../src/lib/lesson-builder/studio-summary";
import type { CourseSummary } from "../../src/lib/lesson-builder/server/course-summary";
import type { CoverageReport } from "../../src/lib/lesson-builder/server/coverage-report";

const course: CourseSummary = {
  modules: [],
  lessonCount: 2,
  explanationCount: 1,
  practiceCount: 1,
  lessons: [
    {
      id: "empty",
      lessonNumber: 1,
      moduleId: "module",
      moduleName: "Module",
      moduleLessonNumber: 1,
      name: "Empty lesson",
      explanationCount: 0,
      practiceCount: 0,
      previewText: "",
      blocks: [],
    },
    {
      id: "draft",
      lessonNumber: 2,
      moduleId: "module",
      moduleName: "Module",
      moduleLessonNumber: 2,
      name: "Draft lesson",
      explanationCount: 1,
      practiceCount: 1,
      previewText: "",
      blocks: [
        { id: "blank", type: "explanation", contentMarkdown: "  " },
        {
          id: "practice",
          type: "sentence",
          promptLabel: "",
          promptText: "",
          helperText: "",
          answerFeedback: null,
          languageBlocks: [
            { id: "language", spanish: "", callout: null, acceptedAnswers: [""] },
          ],
        },
      ],
    },
  ],
};

const coverage: CoverageReport = {
  lessons: [],
  requested: [],
  missing: [],
  concepts: [
    {
      conceptId: "active",
      spanish: "hola",
      english: "hello",
      exampleSpanish: "hola",
      exampleEnglish: "hello",
      role: "core",
      collections: [],
      lessonNumbers: [1],
      firstLesson: 1,
      lastLesson: 1,
      timesTaught: 1,
      lessonsSinceLast: 1,
    },
  ],
  trashed: [
    {
      conceptId: "trash",
      spanish: "adios",
      english: "goodbye",
      exampleSpanish: "adios",
      exampleEnglish: "goodbye",
      role: "trash",
      collections: [],
      lessonNumbers: [2],
      firstLesson: 2,
      lastLesson: 2,
      timesTaught: 1,
      lessonsSinceLast: 0,
    },
  ],
};

test("Studio identifies structural issues and excludes trash from coverage", () => {
  const result = buildStudioSummary(course, coverage);

  assert.equal(result.declaredConceptCount, 1);
  assert.deepEqual(result.trashedConcepts.map((concept) => concept.conceptId), ["trash"]);
  assert.deepEqual(
    result.structuralIssues.map((issue) => issue.message),
    [
      "This lesson has no content blocks.",
      "An explanation block is blank.",
      "2 practice validation issues.",
    ],
  );
});
