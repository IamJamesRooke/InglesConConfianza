import { readFileSync } from "node:fs";

import { uxCheckLessonsPath } from "../../playwright.config";
import { expect, test } from "./fixtures";

type SavedLanguageBlock = { spanish: string; acceptedAnswers: string[] };
type SavedSentenceBlock = { type: "sentence"; languageBlocks: SavedLanguageBlock[] };
type SavedBlock = SavedSentenceBlock | { type: "explanation"; contentMarkdown: string };

function readLastLessonBlocks(): SavedBlock[] {
  const data = JSON.parse(readFileSync(uxCheckLessonsPath, "utf8")) as {
    lessons: Array<{ blocks: SavedBlock[] }>;
  };
  return data.lessons[data.lessons.length - 1]?.blocks ?? [];
}

// E5b — curriculum autocomplete in pair fields
// (docs/design/lesson-builder-rebuild.md E5). Typing ≥2 characters in a
// sentence pair's Spanish (or English) field, after a short pause, offers
// up to 5 matching curriculum concepts in a popover with NO default
// selection (owner regression, 2026-09-16: a pre-highlighted first result
// meant typing "Quiero" and pressing Enter silently replaced it with
// "quiero decir"). Until the teacher presses ArrowDown, the field behaves as
// if the popover weren't there at all — typing, Tab and Enter do exactly
// what they'd do with no popover open. ArrowDown enters the list at the
// first item; from there Enter accepts and Escape closes the popover only
// (field stays focused/selected).

async function waitForFocusedField(page: import("@playwright/test").Page, field: string, timeout?: number) {
  await page.waitForFunction(
    (f) => (document.activeElement as HTMLElement | null)?.dataset.field === f,
    field,
    { timeout },
  );
}

test("typing a match keeps what the teacher typed — Enter/Tab never accept an unhighlighted suggestion", async ({
  page,
}, testInfo) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Querer");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  // Predicted type after a fresh empty explanation is a sentence.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");

  const pair = page.locator(".lesson-document-pair").first();
  const spanish = pair.locator("[data-field='spanish']");
  const english = pair.locator("[data-field='english']");
  const popover = pair.locator(".concept-typeahead-popover");

  // Resize after authoring, not before — see pair-proposals.spec.ts.
  await page.setViewportSize({ width: 760, height: 900 });
  await spanish.pressSequentially("Quiero");
  await expect(popover).toBeVisible({ timeout: 2000 });
  // "quiero decir" ("I mean") is a real label match for this prefix. Note:
  // in this Spanish field's popover the *own*-language text (Spanish) is
  // rendered in the `.concept-typeahead-option-english` span — the class
  // names are purely positional (first line/second line), not tied to the
  // actual language; see PairAutocompletePopover's `primary`/`secondary`.
  await expect(
    popover.locator(".concept-typeahead-option-english", { hasText: "quiero decir" }).first(),
  ).toBeVisible();
  // `scope=label` (E5b's fix): "quiero" only appears in "ser"/"estar"'s own
  // EXAMPLE sentences ("Quiero ser…"/"Quiero estar…"), never in their own
  // labels — those must not pollute a pair field's list the way they do the
  // Covers typeahead (owner regression, 2026-09-16).
  await expect(popover.locator(".concept-typeahead-option-english", { hasText: /^ser\b/i })).toHaveCount(0);
  await expect(popover.locator(".concept-typeahead-option-english", { hasText: /^estar\b/i })).toHaveCount(0);
  // Nothing highlighted by default — the regression this guards against.
  await expect(popover.locator(".is-active")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("autocomplete-760.png"), fullPage: true });

  // Enter with nothing highlighted: the spanish scope's own Enter (consume,
  // no navigation, single-line field) fires exactly as it would with no
  // popover — the typed text is left completely untouched and the field
  // stays focused.
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "spanish");
  await expect(spanish).toHaveValue("Quiero");

  // Tab with nothing highlighted: plain pair navigation, unaffected by the
  // still-open popover.
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await expect(spanish).toHaveValue("Quiero");

  // Same contract on the English field: typing re-triggers a search, and
  // Tab with nothing highlighted advances normally (adds a new pair)
  // instead of accepting a suggestion.
  await english.pressSequentially("to wa");
  await expect(popover).toBeVisible({ timeout: 2000 });
  await expect(popover.locator(".is-active")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(english).toHaveValue("to wa");
});

test("ArrowDown enters the list, Enter accepts, Escape closes the popover only", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Querer arrow");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");

  const pair = page.locator(".lesson-document-pair").first();
  const spanish = pair.locator("[data-field='spanish']");
  const english = pair.locator("[data-field='english']");
  const popover = pair.locator(".concept-typeahead-popover");

  await page.setViewportSize({ width: 760, height: 900 });
  await spanish.pressSequentially("quer");
  await expect(popover).toBeVisible({ timeout: 2000 });

  // ArrowDown highlights the first option; Escape from there closes the
  // popover only — the field stays focused/selected, no slide-level Escape
  // fires.
  await page.keyboard.press("ArrowDown");
  await expect(popover.locator(".is-active")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await waitForFocusedField(page, "spanish");

  // Re-trigger the popover (the value must change for the debounced search
  // effect to refire), ArrowDown into it, and accept with Enter.
  await spanish.pressSequentially("e");
  await expect(popover).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await waitForFocusedField(page, "english");
  await expect(spanish).not.toHaveValue("");
  await expect(english).not.toHaveValue("");
  await expect(spanish).toHaveValue(/querer/i);

  // The same completion, roles reversed, on the English field.
  await english.fill("");
  await english.pressSequentially("to wa");
  await expect(popover).toBeVisible({ timeout: 2000 });
  await expect(popover.locator(".concept-typeahead-option")).not.toHaveCount(0);
});

// Regression for the false-positive "exact match" suppression: before the
// fix, the popover's own-text comparison ran against every SEARCH RESULT,
// not against what the teacher had actually accepted — so typing a word
// that is itself a curriculum headword (like "hacer") always matched one of
// its own search results and the popover silently never opened, producing
// a persisted half-pair (Spanish filled, English never Tab-filled) with no
// visual sign in the resting view. See pair-field-autocomplete.tsx's
// `isAcceptedMatch`.
test("typing a Spanish word that is itself a curriculum headword still opens the popover", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Hacer headword");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");

  const pair = page.locator(".lesson-document-pair").first();
  const spanish = pair.locator("[data-field='spanish']");
  const english = pair.locator("[data-field='english']");
  const popover = pair.locator(".concept-typeahead-popover");

  await page.setViewportSize({ width: 760, height: 900 });
  await spanish.pressSequentially("hace");
  await expect(popover).toBeVisible({ timeout: 2000 });
  await spanish.pressSequentially("r");
  // Must still be open (or reopen) once the text is the exact headword
  // "hacer" — this is the case the false-positive check broke. "hacer"
  // may not be the top-ranked result (other concepts can share the "hace"
  // prefix), so click it directly rather than assuming Tab's default
  // highlight (index 0) lands on it.
  await expect(popover).toBeVisible({ timeout: 2000 });
  const hacerOption = popover
    .locator(".concept-typeahead-option")
    .filter({ has: page.locator(".concept-typeahead-option-english", { hasText: /^hacer\b/i }) })
    .first();
  await expect(hacerOption).toBeVisible({ timeout: 2000 });
  await hacerOption.click();
  await waitForFocusedField(page, "english");
  await expect(spanish).toHaveValue(/^hacer/i);
  await expect(english).not.toHaveValue("");

  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+s");
  // The module-navigator rail (and its save-status text) is hidden at
  // 760px — widen back out to read it, same as pair-proposals.spec.ts.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  const blocks = readLastLessonBlocks();
  const sentences = blocks.filter((block): block is SavedSentenceBlock => block.type === "sentence");
  const last = sentences[sentences.length - 1];
  // No half-pair: a pair with Spanish text must never persist with a blank
  // accepted answer — if it does, the autofill above failed silently.
  for (const languageBlock of last.languageBlocks) {
    if (languageBlock.spanish.trim()) {
      expect(languageBlock.acceptedAnswers.some((answer) => answer.trim())).toBe(true);
    }
  }
});

// Regression for the owner-reported corruption: chain-extend
// (Ctrl+Alt+Shift+Enter) into a brand-new sentence slide whose fields don't
// exist yet, typed into immediately — before this fix, the still-focused
// *previous* pair's field (locked open by a stale autocomplete popover, or
// simply still holding real DOM focus during the async mount) would absorb
// those keystrokes, corrupting its text and leaving the new pair blank
// (later pruned as empty on reload). See src/lib/lesson-builder/focus.ts
// (`lockElementDuringFocusTransfer`) and pair-field-autocomplete.tsx
// (`usePairFieldAutocomplete`'s selection-owned popover close).
test("chain-extend into a fresh pair never corrupts the previous pair, and its popover never gets orphaned", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Corruption regression");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");

  const firstPair = page.locator(".lesson-document-pair").nth(0);
  const firstSpanish = firstPair.locator("[data-field='spanish']");
  const firstEnglish = firstPair.locator("[data-field='english']");
  const firstPopover = firstPair.locator(".concept-typeahead-popover");

  // Type a real curriculum-matching prefix (opens the popover), then finish
  // the phrase, ArrowDown to highlight a suggestion (without accepting it),
  // then Escape — which, per the interaction contract, closes the popover
  // only and leaves the field focused/selected.
  await firstSpanish.pressSequentially("quie");
  await expect(firstPopover).toBeVisible({ timeout: 2000 });
  await firstSpanish.pressSequentially("res o tú quieres");
  await page.keyboard.press("ArrowDown");
  await expect(firstPopover.locator(".is-active")).toHaveCount(1);
  await page.keyboard.press("Escape");
  // Not just hidden — gone from the DOM, and no keymap-ignore left behind.
  await expect(firstPopover).toHaveCount(0);
  expect(await firstSpanish.evaluate((el) => el.hasAttribute("data-keymap-ignore"))).toBe(false);
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await firstEnglish.pressSequentially("you want");

  // Chain-extend: a brand-new sentence slide, copying this pair, plus one
  // new empty pair — whose fields do not exist in the DOM the instant the
  // chord fires. Type into it immediately, with no settle delay.
  await page.keyboard.press("Control+Alt+Shift+Enter");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("hacer", { delay: 0 });
  const secondPair = page.locator(".lesson-document-pair").nth(1);
  // Click away (not Tab/Enter/Escape) is a fourth way to leave the field —
  // it too must leave nothing orphaned in the DOM. Click the same block's
  // first pair (not the title) so the block stays active/mounted; only the
  // field-level selection changes.
  await firstSpanish.click();
  await expect(page.locator(".concept-typeahead-popover")).toHaveCount(0);
  await secondPair.locator("[data-field='spanish']").click();
  await waitForFocusedField(page, "spanish");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("to do", { delay: 0 });
  // Commit the live English draft (native blur, moving to the block scope)
  // before saving — Ctrl+S itself doesn't blur anything.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  const blocks = readLastLessonBlocks();
  const sentences = blocks.filter((block): block is SavedSentenceBlock => block.type === "sentence");
  expect(sentences).toHaveLength(2);
  expect(sentences[0].languageBlocks).toHaveLength(1);
  expect(sentences[0].languageBlocks[0].spanish).toBe("quieres o tú quieres");
  expect(sentences[0].languageBlocks[0].acceptedAnswers).toEqual(["you want"]);
  expect(sentences[1].languageBlocks).toHaveLength(2);
  expect(sentences[1].languageBlocks[1].spanish).toBe("hacer");
  expect(sentences[1].languageBlocks[1].acceptedAnswers).toEqual(["to do"]);

  // Chords still work normally afterward — nothing left swallowing them.
  // Selection is already at `block` (the Escape used to commit the English
  // draft above) — a second Escape fully deselects to the builder root.
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => (document.activeElement as HTMLElement | null)?.hasAttribute("data-lesson-library-root"),
  );
});

// Deterministic regression for the specific mechanism behind the orphaned
// popover: `Escape` closes the popover locally (the field stays focused —
// see the interaction contract) but, before this fix, never invalidated a
// fetch already in flight. A concept search that resolves *after* Escape
// could therefore call setOpen(true) again, resurrecting the popover — and
// its data-keymap-ignore — on a field the teacher believes is a plain
// textarea. Delaying the search response deterministically opens that
// window instead of racing real network/debounce timing.
test("a concept search that resolves after Escape does not resurrect the popover", async ({
  page,
}) => {
  // Delay every search *after* the first — the first must resolve normally
  // so the popover is genuinely open (and Escape is therefore the "close
  // popover only" gesture, not the field-scope "leave to block" chord) by
  // the time a second, slower-resolving fetch is still in flight.
  let requestCount = 0;
  await page.route("**/api/admin/curriculum/concepts/search*", async (route) => {
    requestCount += 1;
    if (requestCount > 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    await route.continue();
  });

  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Escape race");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");

  const pair = page.locator(".lesson-document-pair").first();
  const spanish = pair.locator("[data-field='spanish']");
  const popover = pair.locator(".concept-typeahead-popover");

  await spanish.pressSequentially("quie");
  await expect(popover).toBeVisible({ timeout: 2000 });
  // One more keystroke starts a second, slow (800ms) fetch — still in
  // flight when Escape is pressed a moment later. ArrowDown highlights a
  // suggestion first so Escape is the "close the popover only" gesture
  // (the interaction contract) rather than unhighlighted Escape's normal
  // field-scope behavior.
  await spanish.pressSequentially("r");
  await page.keyboard.press("ArrowDown");
  await expect(popover.locator(".is-active")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(popover).toHaveCount(0);
  // Wait past the delayed response's arrival — it must not resurrect the
  // popover it was in flight for when Escape was pressed.
  await page.waitForTimeout(1200);
  await expect(popover).toHaveCount(0);
  expect(await spanish.evaluate((el) => el.hasAttribute("data-keymap-ignore"))).toBe(false);

  // Tab now must be plain pair navigation, not swallowed by a resurrected
  // popover's own key handling.
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english", 5000);
});
