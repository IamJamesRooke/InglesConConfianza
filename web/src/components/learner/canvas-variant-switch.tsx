"use client";

import { useEffect } from "react";

/**
 * TEMPORARY (docs/design/learner-direction.md "Colour" — owner to pick from
 * screenshots, 2026-09-18): switches the learner canvas variant via
 * `?canvas=glow|bare|lavender` in the URL, for side-by-side comparison
 * screenshots only. Nothing is persisted; the default (no param, or an
 * unrecognised value) is "glow", already set statically as `<html
 * data-canvas="glow">` in layout.tsx so there is no flash on the common
 * path. Delete this component, its import in layout.tsx, and the
 * `[data-canvas]` rules in globals.css once the owner has picked one.
 */
export function CanvasVariantSwitch() {
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "canvas",
    );
    const variant =
      requested === "bare" || requested === "lavender" ? requested : "glow";
    document.documentElement.setAttribute("data-canvas", variant);
  }, []);
  return null;
}
