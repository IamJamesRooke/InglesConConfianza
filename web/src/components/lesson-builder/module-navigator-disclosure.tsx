// Compact-rail (<900px) "Modules ▾" disclosure toggle for module-navigator.tsx (item 6).
"use client";

import { ChevronDown } from "lucide-react";
import type { Ref } from "react";

// 6: compact rail under 900px — a "Modules ▾" disclosure that toggles the
// rest of the rail (search, module list, "Add module", save/undo status)
// underneath it. Rendered unconditionally; module-navigation.css hides it
// above 900px and always shows the collapsible body there regardless of
// `open`, so this button and state are no-ops on wide screens.
//
// Owner, 2026-09-16: the button itself only shows "Modules" and the
// chevron — the active module name used to render inline here too, but the
// module card's own title right below already shows it, so it was pure
// duplication. The name stays in the aria-label for screen readers, since
// sighted users get the card title as a visual confirmation that a screen
// reader announcement alone doesn't provide.
export function ModuleNavigatorDisclosure({
  activeModuleName,
  open,
  onToggle,
  buttonRef,
}: {
  activeModuleName: string;
  open: boolean;
  onToggle: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      className="module-navigator-disclosure"
      aria-expanded={open}
      aria-label={`Modules — ${activeModuleName}${open ? ", collapse" : ", expand"}`}
      onClick={onToggle}
    >
      <span className="module-navigator-disclosure-label">Modules</span>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className={open ? "module-navigator-disclosure-chevron open" : "module-navigator-disclosure-chevron"}
      />
    </button>
  );
}
