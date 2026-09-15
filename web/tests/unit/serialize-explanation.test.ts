import assert from "node:assert/strict";
import test from "node:test";

import {
  serializeExplanation,
  wrapTrimmed,
} from "../../src/lib/lesson-builder/serialize-explanation";

// `serializeExplanation` walks a real DOM tree, which Node doesn't provide.
// This is a deliberately minimal stand-in — just enough surface
// (nodeType/tagName/childNodes/children/classList/dataset/textContent) for
// `serializeExplanation`'s traversal, no rendering, no real Range/Selection
// APIs. `Node`/`HTMLElement` are set as globals so the module's own
// `instanceof HTMLElement` / `Node.TEXT_NODE` checks resolve against these
// fakes exactly as they would against the browser's real classes.
class FakeText {
  readonly nodeType = 3; // Node.TEXT_NODE
  constructor(public textContent: string) {}
}

class FakeElement {
  readonly nodeType = 1; // Node.ELEMENT_NODE
  tagName: string;
  childNodes: Array<FakeElement | FakeText> = [];
  dataset: Record<string, string | undefined> = {};
  private classSet = new Set<string>();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get children(): FakeElement[] {
    return this.childNodes.filter(
      (node): node is FakeElement => node instanceof FakeElement,
    );
  }

  get classList() {
    const classSet = this.classSet;
    return {
      contains: (name: string) => classSet.has(name),
      add: (name: string) => classSet.add(name),
      remove: (name: string) => classSet.delete(name),
    };
  }

  get textContent(): string {
    return this.childNodes.map((node) => node.textContent ?? "").join("");
  }

  append(...nodes: Array<FakeElement | FakeText>) {
    this.childNodes.push(...nodes);
  }
}

(globalThis as unknown as { HTMLElement: unknown }).HTMLElement = FakeElement;
(globalThis as unknown as { Node: unknown }).Node = { TEXT_NODE: 3 };

function asRoot(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

// Bug #1 [DATA LOSS]: Chrome's own paragraph split (Enter, in a
// never-yet-saved explanation) clones the root wrapper's
// `.practice-markdown-content` class onto the new sibling <div> it creates.
// The old serializer did `root.querySelector(".practice-markdown-content")`
// — first match only — so every paragraph after the first was invisible to
// serialization. This is the exact two-sibling-divs shape from the friction
// log; both paragraphs must come back.
test("serializeExplanation: two sibling divs both carrying the wrapper class both serialize", () => {
  const root = new FakeElement("div");
  const paragraph1 = new FakeElement("div");
  paragraph1.classList.add("practice-markdown-content");
  paragraph1.append(new FakeText("Primer parrafo."));
  const paragraph2 = new FakeElement("div");
  paragraph2.classList.add("practice-markdown-content");
  paragraph2.append(new FakeText("Segundo parrafo."));
  root.append(paragraph1, paragraph2);

  assert.equal(
    serializeExplanation(asRoot(root)),
    "Primer parrafo.\n\nSegundo parrafo.",
  );
});

// Bug #6 [COSMETIC, same family as #1]: a nested duplicate wrapper (real
// paste can produce `<div class="...content"><div class="...content">…`)
// must not lose content either — serializing from the root, unconditionally,
// handles any depth of wrapper nesting the same way.
test("serializeExplanation: a nested duplicate wrapper div doesn't lose content", () => {
  const root = new FakeElement("div");
  const outer = new FakeElement("div");
  outer.classList.add("practice-markdown-content");
  const inner = new FakeElement("div");
  inner.classList.add("practice-markdown-content");
  inner.append(new FakeText("Nested but not lost."));
  outer.append(inner);
  root.append(outer);

  assert.equal(serializeExplanation(asRoot(root)), "Nested but not lost.");
});

// Bug #3 [VISIBLE]: a list used to flatten every <li> to its own top-level
// block, joined with the same `\n\n` used between unrelated blocks — so a
// 3-item list degraded into three separate one-item lists on its very first
// save/reload (`parseLessonMarkdown` treats a blank line as ending a list).
// List items must join with a single newline as ONE block.
test("serializeExplanation: unordered list round-trips as one block, items joined by a single newline", () => {
  const root = new FakeElement("div");
  const content = new FakeElement("div");
  content.classList.add("practice-markdown-content");
  const list = new FakeElement("ul");
  for (const text of ["a", "b", "c"]) {
    const item = new FakeElement("li");
    item.append(new FakeText(text));
    list.append(item);
  }
  content.append(list);
  root.append(content);

  assert.equal(serializeExplanation(asRoot(root)), "- a\n- b\n- c");
});

test("serializeExplanation: ordered list round-trips as one block, items joined by a single newline", () => {
  const root = new FakeElement("div");
  const content = new FakeElement("div");
  content.classList.add("practice-markdown-content");
  const list = new FakeElement("ol");
  for (const text of ["uno", "dos", "tres"]) {
    const item = new FakeElement("li");
    item.append(new FakeText(text));
    list.append(item);
  }
  content.append(list);
  root.append(content);

  assert.equal(serializeExplanation(asRoot(root)), "1. uno\n2. dos\n3. tres");
});

// A plain single-paragraph explanation (text/marks sitting directly inside
// the wrapper div, no nested <p>/<div>) must still serialize as one flat
// run, not one block per inline node — the reason the top-level "does this
// container have block children" question has to be re-asked at every div,
// not answered once for the whole tree.
test("serializeExplanation: a mark and plain text inside the wrapper stay one paragraph", () => {
  const root = new FakeElement("div");
  const content = new FakeElement("div");
  content.classList.add("practice-markdown-content");
  const mark = new FakeElement("mark");
  mark.dataset.language = "es";
  mark.append(new FakeText("hola"));
  content.append(new FakeText("Say "), mark, new FakeText(" to greet."));
  root.append(content);

  assert.equal(
    serializeExplanation(asRoot(root)),
    "Say [[es:hola]] to greet.",
  );
});

// `wrapTrimmed` is the piece of `serializeExplanation` that decides where the
// `**`/`*`/`[[es:…]]`/`==…==` delimiters actually land. It's pure (no DOM),
// so it's testable directly — the surrounding DOM-walking serializer that
// calls it needs a browser and is exercised via `npm run ux:check` instead.
//
// Bug: a selection with a leading/trailing space (an ordinary outcome of
// keyboard word-selection, e.g. Ctrl+Shift+ArrowRight) used to serialize the
// space *inside* the delimiters — `** text**`, `* text*` — which is not
// valid CommonMark emphasis/strong and silently fails to parse back on the
// next render, dropping the formatting with no error.

test("wrapTrimmed moves a leading space outside the delimiters", () => {
  assert.equal(wrapTrimmed(" to be able", "*", "*"), " *to be able*");
});

test("wrapTrimmed moves a trailing space outside the delimiters", () => {
  assert.equal(wrapTrimmed("to be able ", "*", "*"), "*to be able* ");
});

test("wrapTrimmed moves whitespace on both sides outside the delimiters", () => {
  assert.equal(wrapTrimmed("  poder  ", "**", "**"), "  **poder**  ");
});

test("wrapTrimmed handles tabs/newlines as whitespace too", () => {
  assert.equal(wrapTrimmed("\tpoder\n", "**", "**"), "\t**poder**\n");
});

test("wrapTrimmed leaves content with no surrounding whitespace untouched but wrapped", () => {
  assert.equal(wrapTrimmed("poder", "**", "**"), "**poder**");
});

test("wrapTrimmed returns all-whitespace content unwrapped — nothing to emphasize", () => {
  assert.equal(wrapTrimmed("   ", "*", "*"), "   ");
});

test("wrapTrimmed returns empty content unwrapped", () => {
  assert.equal(wrapTrimmed("", "*", "*"), "");
});

test("wrapTrimmed works with the bracketed mark delimiters", () => {
  assert.equal(wrapTrimmed(" quiero ", "[[es:", "]]"), " [[es:quiero]] ");
});
