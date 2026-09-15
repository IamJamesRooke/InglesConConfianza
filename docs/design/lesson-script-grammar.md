# Lesson script — grammar (Phase 2.5 contract)

A lesson is a plain-text script. `parseScript(text) → Lesson["blocks"] + concepts`
and `printScript(lesson) → text` are inverse up to whitespace normalisation
(`printScript(parseScript(t)) === normalize(t)`, property-tested). The block model is
unchanged; the script is a second, lossless view of it.

## Lines

| Line shape | Meaning |
|---|---|
| `text` (no prefix) | Explanation paragraph. Consecutive plain lines = paragraphs of ONE explanation slide; a blank line ends the slide. Inline marks use the existing dialect (`[[es:…]]`, `[[en:…]]`, `**b**`, `*i*`); unmarked `X es Y` lines are auto-marked on parse by the E1 rule. |
| `> es / en` | One practice pair. Consecutive `>` lines = one sentence slide. `en` may hold alternatives separated by ` \| ` (pipe, since `/` is the pair separator). A trailing ` (hint)` in parentheses at the end of the line = the pair's hint. |
| `> = es / en` | A **given** piece (shown, not tested) — E8. |
| `> + es / en` | **Extend**: this sentence slide = a copy of the previous sentence slide's pieces + this pair; terminal punctuation moves from the old last piece to the new one. Further `> +` lines in the same slide append more pieces. A `>` line immediately after a `> +` block continues the same slide. — E3b |
| `\| es / en` | One vocabulary row. Consecutive `\|` lines = one table slide. Same ` (hint)` and ` \| ` rules. |
| `? text` | Instruction for the practice slide that follows (`promptText`). Must be directly followed by `>` or `\|` lines. |
| `# Title` (first line only) | Lesson title. |
| `@ concept, concept` | "Covers" concepts (labels; matched to curriculum ids by exact label on parse, freehand otherwise). Optional; auto-Covers (E5) fills it when absent. |
| `//` … | Comment, ignored, not round-tripped. |

Escapes: `\/`, `\|`, `\(` for literal characters inside pair text. Leading/trailing
whitespace on each side of `/` is trimmed. Empty `es` or `en` is an error (line
number reported); the parser never produces a blank pair or an empty slide.

## Example (the owner's lesson 2, abridged)

```
# I want to know if you want to do something with me.
quieres o tú quieres es you want
> quieres / you want
> Quieres / You want
> + hacer / to do
> + algo. / something.

con es with
conmigo es with me
contigo es with you
| con / with
| conmigo / with me
| contigo / with you

saber es to know, pronunciado **no**
> saber / to know
> Quiero / I want
> + saber / to know
> + algo. / something.

? Algo más difícil.
> Quiero / I want
> + saber / to know
> + si / if
> + = ... / ...
```

## Surface
- Per lesson, `Ctrl Alt T` toggles between the block view and a script `<textarea>`
  (monospace, 15px, the lesson's full script). Leaving the script view parses; parse
  errors are shown inline with line numbers and the view stays until fixed.
- Paste into an empty lesson's first explanation: if the pasted text contains `>` or
  `|` line prefixes, offer "Import as script" (one click) instead of inserting text.
- The block view is unchanged; `printScript` is also the "copy lesson as text" action.
