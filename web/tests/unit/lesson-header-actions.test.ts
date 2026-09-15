import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LessonHeaderActions } from "../../src/components/lesson-builder/lesson-header-actions";

test("lesson header actions render direct Duplicate/Delete icon buttons, no menu", () => {
  const html = renderToStaticMarkup(
    createElement(LessonHeaderActions, {
      lessonId: "lesson_1",
      lessonName: "Introductions",
      onDuplicate() {},
      onDuplicateStructure() {},
      onRequestDelete() {},
    }),
  );

  assert.match(html, /aria-label="Duplicate Introductions"/);
  assert.match(html, /aria-label="Delete Introductions"/);
  assert.doesNotMatch(html, /Move to/);
  assert.doesNotMatch(html, /role="menu"/);
  assert.doesNotMatch(html, /aria-haspopup/);
});

test("lesson header actions render a Duplicate structure icon button", () => {
  const html = renderToStaticMarkup(
    createElement(LessonHeaderActions, {
      lessonId: "lesson_1",
      lessonName: "Introductions",
      onDuplicate() {},
      onDuplicateStructure() {},
      onRequestDelete() {},
    }),
  );

  assert.match(html, /aria-label="Duplicate structure"/);
  assert.match(html, /title="New lesson with the same slides, emptied"/);
});
