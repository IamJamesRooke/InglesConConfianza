import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { explanationWraps } from "@/lib/learner/presentation";

/**
 * An explanation slide. A single short line reads well centred and gets the
 * larger of the two fluid type sizes; anything that wraps switches to
 * left-aligned at the ordinary size (owner spec: "left-aligned when it wraps
 * beyond one line").
 *
 * The wrap decision is a rule on the authored text (explanationWraps), not a
 * DOM measurement: the previous ResizeObserver version measured only `p`/`li`
 * heights, so an explanation whose wrapping text was a heading stayed centred
 * forever, and its first measurement ran before webfonts had loaded with no
 * later re-measure guaranteed. The rule needs no effect, no ref, and is
 * already right in the server-rendered HTML.
 */
export function ExplanationStep({ markdown }: { markdown: string }) {
  const wraps = explanationWraps(markdown);
  return (
    <div
      className="lesson-explanation learner-enter"
      data-wraps={wraps ? "true" : "false"}
    >
      <PracticeMarkdown markdown={markdown} />
    </div>
  );
}
