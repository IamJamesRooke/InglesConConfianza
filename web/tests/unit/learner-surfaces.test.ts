import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonDashboard } from "../../src/components/learner/lesson-dashboard";
import { PracticeMarkdown } from "../../src/components/practice/practice-markdown";
import { SentencePracticeCard } from "../../src/components/practice/sentence-practice-card";
import { SentenceStageCard } from "../../src/components/practice/sentence-stage-card";
import {
  completionSentenceSize,
  completionView,
  explanationPlainText,
  explanationWraps,
  learnerLabel,
} from "../../src/lib/learner/presentation";
import {
  isAnswerAccepted,
  normalizeAnswer,
} from "../../src/lib/lesson-builder/utils";

// The old practice-responsive-overrides.css was split by concern (see
// docs/engineering/code-map.md's Styling row): shell (status strip,
// footer/action, session frame, motion), explanation (card, marks, bridge,
// keycaps, replay), table (sentence grid card + vocabulary table), stage
// (sentence stage, speaker chip/bubble, hint button, instruction audio).
// Tests below read the specific file that now holds a given rule, and any
// test asserting a selector is ABSENT scans all four, so the split can't
// silently narrow what it's checking.
const PRACTICE_STYLE_FILES = [
  "../../src/styles/practice-shell.css",
  "../../src/styles/practice-explanation.css",
  "../../src/styles/practice-table.css",
  "../../src/styles/practice-stage.css",
];
function readPracticeStyles(): string {
  return PRACTICE_STYLE_FILES.map((file) =>
    readFileSync(new URL(file, import.meta.url), "utf8"),
  ).join("\n");
}

const lesson = {
  id: "hello",
  lessonNumber: 1,
  moduleLessonNumber: 1,
  name: "Hello James!",
  previewText: "Hola James!",
  outcomeEnglish: "Hello James!",
  stepCount: 4,
};
const modules = [
  {
    id: "welcome",
    name: "Tu primera conversación",
    kind: "onboarding" as const,
    lessonCount: 1,
    lessons: [lesson],
  },
  {
    id: "plans",
    name: "Planes de todos los días",
    kind: "course" as const,
    lessonCount: 1,
    lessons: [{ ...lesson, id: "tomorrow", name: "Tomorrow", stepCount: 0 }],
  },
];

test("learnerLabel strips curriculum bracket notation into plain words", () => {
  assert.equal(learnerLabel("[the] day"), "the day");
  assert.equal(learnerLabel("[el] día"), "el día");
  assert.equal(
    learnerLabel("[to do something] on purpose"),
    "to do something on purpose",
  );
  assert.equal(learnerLabel("hello"), "hello");
});

test("completionSentenceSize buckets the final sentence by word count", () => {
  assert.equal(completionSentenceSize("I want to go home"), "hero"); // 5 words
  assert.equal(
    completionSentenceSize("I want to know if you want to go"),
    "sentence",
  ); // 9 words
  assert.equal(
    completionSentenceSize(
      "I want to know if you want to go there with me",
    ),
    "body",
  ); // 12 words
});

test("completionView shows the next lesson for any lesson but the module's last, regardless of completion", () => {
  const moduleLessons = [
    { id: "l1", blocks: [{}] },
    { id: "l2", blocks: [{}] },
    { id: "l3", blocks: [{}] },
    { id: "l4", blocks: [{}] },
  ];
  // Reopening lesson 1 with every lesson in the module already complete must
  // still hand off to lesson 2 — completion status never decides this, only
  // position (owner screenshot, 2026-09-17: it wrongly showed the module list).
  assert.deepEqual(completionView(0, moduleLessons), {
    kind: "next",
    lesson: moduleLessons[1],
  });
  assert.deepEqual(completionView(1, moduleLessons), {
    kind: "next",
    lesson: moduleLessons[2],
  });
  // The module's last lesson always gets the module-end list.
  assert.deepEqual(completionView(3, moduleLessons), { kind: "module" });
});

test("completionView skips a contentless placeholder lesson when looking for the next one", () => {
  const moduleLessons = [
    { id: "l1", blocks: [{}] },
    { id: "l2", blocks: [] },
    { id: "l3", blocks: [{}] },
  ];
  assert.deepEqual(completionView(0, moduleLessons), {
    kind: "next",
    lesson: moduleLessons[2],
  });
  // The empty placeholder itself is skipped, but l3 past it still counts.
  assert.deepEqual(completionView(1, moduleLessons), {
    kind: "next",
    lesson: moduleLessons[2],
  });
  // Nothing with content left after this one: module-end.
  assert.deepEqual(completionView(2, moduleLessons), { kind: "module" });
});

test("a single-module course hides module chrome but still lists its lessons", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules: [modules[0]] }),
  );
  // One module = no module rail, no tabs, no sub-heading — a flat path
  // straight under "Tu recorrido".
  assert.doesNotMatch(html, /role="tablist"/);
  assert.doesNotMatch(html, /path-module-title/);
  assert.match(html, /Tu recorrido/);
  assert.match(html, /Hello James!/);
});

test("the hero and lesson row carry no concept chips, minute counts, or status labels", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules }),
  );
  assert.doesNotMatch(html, /learner-concept|Vas a aprender/);
  assert.doesNotMatch(html, /\bmin\b/);
  assert.doesNotMatch(html, /Completada|Repasar|Omitir módulo|Reiniciar módulo/);
  // "Empieza aquí" is a legitimate first-visit hero eyebrow now — just not
  // the old lesson-row status label.
  assert.match(html, /learner-eyebrow hero-eyebrow">Empieza aquí/);
  // Several modules do get their name as a plain section title above their
  // rows — no rail, no tabs, no per-module progress counters.
  assert.match(html, /path-module-title">Tu primera conversación/);
  assert.match(html, /path-module-title">Planes de todos los días/);
});

test("public course renders lesson destinations without any admin navigation", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules }),
  );
  assert.match(html, /href="\/practice\?lesson=hello"/);
  assert.match(html, /Hola James!/);
  assert.doesNotMatch(
    html,
    /href="\/admin|Lesson Builder|Curriculum|Concepts Taught/,
  );
  // No module tabs at all — the next lesson's row is a plain white card.
  assert.doesNotMatch(html, /role="tab"/);
  assert.match(html, /path-row path-row-card/);
});

test("an explicit module selection survives page load and unavailable lessons have no practice link", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules, initialModuleId: "plans" }),
  );
  // `?module=` targets a real section id the effect can scroll/focus to —
  // static markup can't assert the scroll itself, just that the anchor exists.
  assert.match(html, /id="module-plans"/);
  assert.match(html, /Una nueva conversación, muy pronto\./);
  assert.doesNotMatch(html, /href="\/practice\?lesson=tomorrow"/);
});

test("the empty course gives learners a meaningful state without authoring instructions", () => {
  const html = renderToStaticMarkup(
    createElement(LessonDashboard, { modules: [] }),
  );
  assert.match(html, /Nos vemos pronto/);
  assert.doesNotMatch(html, /\/practice\?|\/admin|Lesson Builder/);
});

test("practice markdown keeps the established paragraph and inline fixtures", () => {
  const html = renderToStaticMarkup(createElement(PracticeMarkdown, {
    markdown: "First line\nsecond line\n\n**bold** and *italic* [[es:hola]] [[en:hello]]",
  }));
  assert.match(html, /<p[^>]*>First line<\/p><p[^>]*>second line<\/p>/);
  assert.match(html, /<strong[^>]*>bold<\/strong>/);
  assert.match(html, /<em[^>]*>italic<\/em>/);
  assert.match(html, /data-language="es"[^>]*>hola<\/mark>/);
  assert.match(html, /data-language="en"[^>]*>hello<\/mark>/);
});

test("an empty explanation renders an empty markdown content container", () => {
  const html = renderToStaticMarkup(createElement(PracticeMarkdown, { markdown: "" }));
  assert.match(html, /^<div class="practice-markdown-content /);
  assert.doesNotMatch(html, /<p/);
});

test("normalizeAnswer folds case in addition to trimming whitespace", () => {
  assert.equal(normalizeAnswer("To do"), normalizeAnswer("to do"));
  assert.equal(normalizeAnswer("I'm hungry"), normalizeAnswer("i'm hungry"));
  assert.notEqual(
    normalizeAnswer("I want to buy"),
    normalizeAnswer("I want to buy it"),
  );
});

test("isAnswerAccepted is case-insensitive and splits legacy semicolon-joined alternates", () => {
  assert.ok(isAnswerAccepted("To do", ["to do"]));
  assert.ok(isAnswerAccepted("i'm hungry", ["I'm hungry"]));
  assert.ok(!isAnswerAccepted("I want to buy it", ["I want to buy"]));
  // Legacy content joins alternates in one literal string instead of two
  // array entries — matching must still accept each half on its own.
  assert.ok(
    isAnswerAccepted("I want to buy", ["I want to buy; I wanna buy"]),
  );
  assert.ok(
    isAnswerAccepted("i wanna buy", ["I want to buy; I wanna buy"]),
  );
  assert.ok(!isAnswerAccepted("", ["I want to buy; I wanna buy"]));
});

test("the sentence practice card skips a dangling fully-blank language block", () => {
  const html = renderToStaticMarkup(
    createElement(SentencePracticeCard, {
      sentence: {
        id: "s1",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "real",
            spanish: "hola",
            callout: null,
            acceptedAnswers: ["hello"],
          },
          {
            id: "phantom",
            spanish: "",
            callout: null,
            acceptedAnswers: [""],
          },
        ],
      },
    }),
  );
  // Only the real block's Spanish prompt should render; the phantom blank
  // block must not produce a second, unlabeled input.
  assert.match(html, /hola/);
  const inputCount = (html.match(/<input/g) ?? []).length;
  assert.equal(inputCount, 1);
});

test("a given middle piece renders as static text, skips the input, and never blocks completion", () => {
  const html = renderToStaticMarkup(
    createElement(SentencePracticeCard, {
      sentence: {
        id: "s1",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          { id: "l1", spanish: "Quiero", callout: null, acceptedAnswers: ["I want"] },
          { id: "l2", spanish: "saber", callout: null, acceptedAnswers: ["to know"] },
          { id: "l3", spanish: "si", callout: null, acceptedAnswers: ["if"] },
          {
            id: "l4",
            spanish: "...",
            callout: null,
            acceptedAnswers: ["..."],
            given: true,
          },
        ],
      },
    }),
  );
  // Three testable blanks, not four — the given piece gets no input.
  const inputCount = (html.match(/<input/g) ?? []).length;
  assert.equal(inputCount, 3);
  // Its Spanish and English both still render, as static text.
  assert.match(html, /answer-given-text/);
  assert.match(html, /\.\.\.[\s\S]*\.\.\./);
});

test("the L2b stage card renders both sentence lines, one inline input per tested piece", () => {
  const html = renderToStaticMarkup(
    createElement(SentenceStageCard, {
      sentence: {
        id: "s2",
        type: "sentence",
        promptLabel: "",
        promptText: "Un reto más grande.",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "l1",
            spanish: "Quiero",
            callout: null,
            acceptedAnswers: ["I want"],
          },
          {
            id: "l2",
            spanish: "saber",
            callout: null,
            acceptedAnswers: ["to know"],
          },
          {
            id: "l3",
            spanish: "...",
            callout: null,
            acceptedAnswers: ["..."],
            given: true,
          },
        ],
      },
    }),
  );
  // Line 1 is the Spanish sentence as prose, line 2 the English being built.
  assert.match(html, /stage-line-es/);
  assert.match(html, /stage-line-en/);
  assert.match(html, /Quiero<\/span> <span[^>]*>saber/);
  // Two tested pieces get inline inputs; the given piece is static text.
  assert.equal((html.match(/<input/g) ?? []).length, 2);
  assert.match(html, /stage-en given/);
  // Pending blanks are sized from their answer, and there is no success
  // check anywhere on the card.
  assert.match(html, /--blank-chars:6/);
  assert.doesNotMatch(html, /sentence-success/);
  // The authored instruction is a quiet line above the card.
  assert.match(html, /stage-instruction/);
});

test("a finished stage piece displays the canonical accepted answer, not the learner's raw typing", () => {
  const html = renderToStaticMarkup(
    createElement(SentenceStageCard, {
      sentence: {
        id: "s3",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "l1",
            spanish: "Quiero",
            callout: null,
            acceptedAnswers: ["I want"],
          },
          {
            id: "l2",
            spanish: "saber",
            callout: null,
            acceptedAnswers: ["to know"],
          },
        ],
      },
      initialAnswers: ["i want", ""],
    }),
  );
  // Matched lowercase, but the finished piece shows the canonical casing —
  // as a span, not an input, so it sits at normal word spacing.
  assert.match(html, /<span class="stage-en stage-en-done"[^>]*>I want<\/span>/);
  assert.doesNotMatch(html, />i want</);
  // The still-pending second piece stays an input; only one input remains.
  assert.equal((html.match(/<input/g) ?? []).length, 1);
});

test("a finished LAST stage piece (no next input to advance focus to) still renders as the full canonical span, not a lingering input", () => {
  // Regression for the "I want" -> "want" clipping bug: the last testable
  // piece has nowhere to move focus to on completion, so — before the fix —
  // it never blurred and stayed rendered as `<input data-state="done">`,
  // whose CSS width is sized to the *expected* answer's blank estimate
  // (`--blank-chars`), narrower than the full typed text, so a still-focused
  // input scrolls to keep the caret visible and clips the leading
  // characters. A single-piece sentence (this test) or the last piece of a
  // multi-piece one both hit this, since there's no next field either way.
  const html = renderToStaticMarkup(
    createElement(SentenceStageCard, {
      sentence: {
        id: "s4",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "l1",
            spanish: "Quiero",
            callout: null,
            acceptedAnswers: ["I want"],
          },
        ],
      },
      initialAnswers: ["i want"],
    }),
  );
  assert.match(html, /<span class="stage-en stage-en-done"[^>]*>I want<\/span>/);
  assert.doesNotMatch(html, /<input/);
});

test("the finished-piece span and its transient 'done' input both drop width constraints in CSS (no clipping)", () => {
  const css = readFileSync(
    new URL("../../src/styles/practice-stage.css", import.meta.url),
    "utf8",
  );
  const doneSpanBlock = css.match(/\.stage-en-done\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(doneSpanBlock, /width:\s*auto/);
  assert.doesNotMatch(doneSpanBlock, /overflow:\s*hidden/);
  const maxWidthValues = [...doneSpanBlock.matchAll(/max-width:\s*([^;]+);/g)].map(
    (matched) => matched[1],
  );
  assert.ok(maxWidthValues.every((value) => value === "none"));
  const doneInputBlock =
    css.match(/\.stage-en-input\[data-state="done"\]\s*\{([^}]*)\}/)?.[1] ??
    "";
  assert.match(doneInputBlock, /width:\s*auto/);
});

test("the vocabulary table on the stage uses the two-actor composition, not a centred card with the speaker below-left", () => {
  const html = renderToStaticMarkup(
    createElement(SentencePracticeCard, {
      sentence: {
        id: "s5",
        type: "sentence",
        layout: "vocabulary_table",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "l1",
            spanish: "el gato",
            callout: null,
            acceptedAnswers: ["the cat"],
          },
        ],
      },
    }),
  );
  assert.match(html, /class="sentence-stage learner-enter"/);
  assert.match(html, /class="stage-composition"/);
  assert.match(html, /class="stage-speaker"/);
  assert.match(html, /class="stage-column"/);
  assert.match(html, /vocabulary-practice/);
});

test("help is the speaker's quiet Recuérdame button — no lightbulb, no amber hint bar anywhere on the learner side", () => {
  const css = readPracticeStyles();
  // The lightbulb toggles and the old standalone hint field/diff BAR are
  // gone (owner, 2026-09-17 — hints are spoken by the speaker and shown in
  // its bubble). The diff itself came back on 2026-09-18, owner: "make sure
  // the reminder has diff highlighting" — but inside the bubble, as
  // `.answer-diff-same`/`.answer-diff-fix` (see the test below), never as
  // its own bar or field state.
  for (const gone of [
    ".stage-hint-toggle",
    ".answer-hint-toggle",
    ".answer-diff-label",
    ".answer-diff-insert",
    ".answer-diff-delete",
    ".answer-input.showing-hint",
    '.stage-en-input[data-state="hint"]',
  ])
    assert.equal(css.includes(gone), false, `${gone} should be gone`);
  // Owner, 2026-09-17: "Recuérdame" (then "Pista") has to look pressable — a small ghost button
  // (hairline border, ink text, 8px radius, 28px tall), not a line of text.
  const hintButtonBlock =
    css.match(/\.stage-hint-button\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(hintButtonBlock, /color:\s*var\(--foreground\)/);
  assert.match(hintButtonBlock, /border:\s*1px solid var\(--border\)/);
  assert.match(hintButtonBlock, /border-radius:\s*8px/);
  assert.match(hintButtonBlock, /height:\s*28px/);
  assert.doesNotMatch(hintButtonBlock, /var\(--hint\)/);

  const stageCard = readFileSync(
    new URL(
      "../../src/components/practice/sentence-stage-card.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const tableCard = readFileSync(
    new URL(
      "../../src/components/practice/sentence-practice-card.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  for (const source of [stageCard, tableCard]) {
    assert.equal(source.includes("Lightbulb"), false);
    // Neither card renders the diff itself — it lives inside SpeakerChip's
    // bubble (speaker-chip.tsx), fed a `diffSegments` prop from
    // useSentencePractice's `hintDiff`.
    assert.equal(source.includes("answer-diff"), false);
    assert.match(source, /HintButton/);
    assert.match(source, /diffSegments=\{hintDiff\}/);
  }
});

test("Recuérdame's diff marks fixes by weight + underline, never colour alone — no red, no strike-through", () => {
  const css = readPracticeStyles();
  const sameBlock = css.match(/\.answer-diff-same\s*\{([^}]*)\}/)?.[1] ?? "";
  const fixBlock = css.match(/\.answer-diff-fix\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(sameBlock, /color:\s*var\(--muted-foreground\)/);
  assert.match(fixBlock, /color:\s*var\(--lesson-hl-en\)/);
  assert.match(fixBlock, /font-weight:\s*700/);
  assert.match(fixBlock, /text-decoration:\s*underline/);
  assert.doesNotMatch(fixBlock, /--lesson-hl-es/);
  assert.doesNotMatch(fixBlock, /line-through/);

  const speakerChip = readFileSync(
    new URL("../../src/components/practice/speaker-chip.tsx", import.meta.url),
    "utf8",
  );
  // The bubble's accessible text stays the plain answer; a visually-hidden
  // "Revisa: …" sentence is the only extra a screen reader gets.
  assert.match(speakerChip, /sr-only/);
  assert.match(speakerChip, /Revisa:/);
});

// Owner, 2026-09-17: superseded to weight 600 (small caps read as heavier
// than 700 at that letterform) for explanation marks specifically — see
// docs/design/learner-direction.md's "Small caps" note and the 2026-09-17
// owner correction scoping small caps + 600 to explanation marks only. The
// sentence stage and vocabulary table (sentence-presentation.css,
// practice-stage.css's .stage-en-input, practice-table.css's .answer-input,
// etc.) were reverted back to their original heavier weights and are
// covered separately, not by this test.
test("English explanation marks are bold like Spanish marks, never italic", () => {
  for (const file of [
    "../../src/styles/practice-explanation.css",
    "../../src/styles/lesson-builder/explanation-editor.css",
  ]) {
    const css = readFileSync(new URL(file, import.meta.url), "utf8");
    const englishMark = css
      .split(/\}/)
      .filter((rule) => /mark(\.english|\[data-language="en"\])/.test(rule))
      .join("\n");
    assert.match(englishMark, /font-weight:\s*600/);
    assert.doesNotMatch(englishMark, /font-style:\s*italic/);
  }
});

test("the retired completion screen's copy is gone from the whole app", () => {
  const root = new URL("../../src/", import.meta.url);
  const offenders: string[] = [];
  const walk = (directory: URL) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const child = new URL(
        entry.name + (entry.isDirectory() ? "/" : ""),
        directory,
      );
      if (entry.isDirectory()) {
        walk(child);
        continue;
      }
      if (!/\.(tsx?|css)$/.test(entry.name)) continue;
      const text = readFileSync(child, "utf8");
      if (
        text.includes("Lección completada") ||
        text.includes("Tu progreso está guardado")
      )
        offenders.push(child.pathname);
    }
  };
  walk(root);
  assert.deepEqual(offenders, []);
});

test("explanations left-align once the authored text is longer than one line", () => {
  assert.equal(explanationWraps("Esto es corto."), false);
  assert.equal(
    explanationWraps(
      "Para decir lo que quieres hacer, usa **want** y después el verbo con *to*.",
    ),
    true,
  );
  // Several blocks always wrap, even when each block is short — and a
  // heading counts, which the old DOM measurement (p/li only) missed.
  assert.equal(explanationWraps("# Hola\n\nQué tal."), true);
  assert.equal(
    explanationPlainText("**[[en:I want]]** es _quiero_"),
    "I want es quiero",
  );
});

// Audio-only marks (docs/design/speech.md "Audio-only marks"): the narrator
// says them, the learner never sees them — so PracticeMarkdown drops the run
// entirely, including any language mark nested inside it.
test("PracticeMarkdown renders nothing for an audio-only run", () => {
  const html = renderToStaticMarkup(
    createElement(PracticeMarkdown, {
      markdown: "[[es:cosa]] es [[en:thing]][[audio:, T-H-I-N-G, [[en:thing]]]]",
    }),
  );
  assert.ok(!html.includes("T-H-I-N-G"), "the spelled aside is not rendered");
  assert.ok(!html.includes("data-audio"), "no audio span reaches the learner");
  assert.ok(html.includes("cosa") && html.includes("thing"), "the visible text survives");
  // Exactly the two authored marks are rendered — the nested `en` inside the
  // audio run is gone with it, not rendered a second time.
  assert.equal(html.match(/<mark/gu)?.length, 2);
});

test("PracticeMarkdown leaves markdown with no audio run untouched", () => {
  const html = renderToStaticMarkup(
    createElement(PracticeMarkdown, { markdown: "[[es:hoy]] es [[en:today]]" }),
  );
  assert.ok(html.includes(">hoy<") && html.includes(">today<"));
});
