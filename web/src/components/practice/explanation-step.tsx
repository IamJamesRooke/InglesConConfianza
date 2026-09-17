"use client";

import { useEffect, useRef, useState } from "react";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";

export function ExplanationStep({
  markdown,
}: {
  markdown: string;
}) {
  // Single-line explanation text reads fine centered; once any paragraph or
  // list item wraps to a second line, centering makes the ragged edges hard
  // to read, so the whole card switches to left-aligned text (owner spec:
  // "left-aligned when it wraps beyond one line"). Detected by comparing
  // each text node's rendered height against one line of its own type,
  // rather than guessing from character count, so it stays correct across
  // viewport widths and font-size changes.
  const containerRef = useRef<HTMLDivElement>(null);
  const [wraps, setWraps] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const nodes = container.querySelectorAll<HTMLElement>("p, li");
      let multiline = false;
      nodes.forEach((node) => {
        const lineHeight = parseFloat(getComputedStyle(node).lineHeight);
        if (Number.isFinite(lineHeight) && node.offsetHeight > lineHeight * 1.4)
          multiline = true;
      });
      setWraps(multiline);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [markdown]);

  return (
    <div
      ref={containerRef}
      className="lesson-explanation learner-enter"
      data-wraps={wraps ? "true" : "false"}
    >
      <PracticeMarkdown markdown={markdown} />
    </div>
  );
}
