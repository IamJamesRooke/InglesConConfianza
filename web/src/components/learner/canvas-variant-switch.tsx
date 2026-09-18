"use client";

import { useEffect } from "react";

/**
 * TEMPORARY (docs/design/learner-direction.md "Colour" — owner to judge,
 * 2026-09-18): switches the learner canvas variant via
 * `?canvas=strong|white` in the URL, for side-by-side comparison
 * screenshots only. Nothing is persisted; the default (no param, or an
 * unrecognised value) is "tint" — a visibly lavender page — already set
 * statically as `<html data-canvas="tint">` in layout.tsx so there is no
 * flash on the common path. `strong` is one step darker/more saturated for
 * comparison; `white` is the old near-white "glow" page. Delete this
 * component, its import in layout.tsx, and the `[data-canvas]` rules in
 * globals.css once the owner has judged them.
 */
export function CanvasVariantSwitch() {
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "canvas",
    );
    const variant =
      requested === "strong" || requested === "white" ? requested : "tint";
    document.documentElement.setAttribute("data-canvas", variant);
  }, []);
  return null;
}
