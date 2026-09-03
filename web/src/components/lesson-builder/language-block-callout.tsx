"use client";

import { Sun, X } from "lucide-react";

// The amber "context hint" strip under a language block. `callout === null`
// means no hint yet (show the add button); `""` or text means show the editor.
export function LanguageBlockCallout({
  callout,
  registerInputRef,
  onAdd,
  onChange,
  onRemove,
}: {
  callout: string | null;
  registerInputRef: (element: HTMLInputElement | null) => void;
  onAdd: () => void;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  if (callout == null) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="group flex min-h-12 w-full items-center justify-center gap-2 border-t border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-200 to-orange-100 px-3 py-3 text-sm font-bold text-amber-900 transition hover:from-amber-200 hover:via-yellow-300 hover:to-orange-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-amber-400"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-white/75 text-orange-600 shadow-sm transition group-hover:rotate-12 group-hover:scale-105">
          <Sun className="size-4" aria-hidden="true" />
        </span>
        Add context hint
      </button>
    );
  }

  return (
    <div className="flex min-h-14 w-full items-center gap-2.5 border-t border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-200 to-orange-100 px-3 py-3 text-amber-950">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/75 text-orange-600 shadow-sm">
        <Sun className="size-4.5" aria-hidden="true" />
      </span>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Spanish context</span>
        <input
          ref={registerInputRef}
          type="text"
          value={callout}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Add hint or context note."
          className="w-full bg-transparent text-sm font-semibold italic outline-none placeholder:text-amber-700/55"
        />
      </label>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove context hint"
        title="Remove context hint"
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-amber-700 transition hover:bg-white/60 hover:text-red-600"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
