// Compact-rail (<900px) "Modules ▾" disclosure toggle for module-navigator.tsx (item 6).
"use client";

import { ChevronDown } from "lucide-react";
import type { Ref } from "react";

// 6: compact rail under 900px — a "Modules ▾" disclosure that shows the
// active module's name and toggles the rest of the rail (search, module
// list, "Add module", save/undo status) underneath it. Rendered
// unconditionally; module-navigation.css hides it above 900px and always
// shows the collapsible body there regardless of `open`, so this button and
// state are no-ops on wide screens.
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
      <span className="module-navigator-disclosure-label">
        Modules
        <span className="module-navigator-disclosure-active">{activeModuleName}</span>
      </span>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className={open ? "module-navigator-disclosure-chevron open" : "module-navigator-disclosure-chevron"}
      />
    </button>
  );
}
