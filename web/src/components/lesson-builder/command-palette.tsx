"use client";

import {
  ArrowRight,
  FileText,
  Keyboard,
  Languages,
  Layers2,
  Plus,
  Save,
  Search,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type BuilderCommand = {
  id: string;
  label: string;
  detail?: string;
  keywords?: string[];
  shortcut?: string;
  disabledReason?: string;
  icon:
    | "lesson"
    | "explanation"
    | "sentence"
    | "pair"
    | "vocabulary"
    | "save"
    | "delete"
    | "keyboard"
    | "search"
    | "open";
  run: () => void;
};

const icons = {
  lesson: Plus,
  explanation: FileText,
  sentence: Languages,
  pair: Layers2,
  vocabulary: Table2,
  save: Save,
  delete: Trash2,
  keyboard: Keyboard,
  search: Search,
  open: ArrowRight,
} satisfies Record<BuilderCommand["icon"], typeof Plus>;

function scoreCommand(command: BuilderCommand, query: string) {
  if (!query) return 1;
  const haystack = [
    command.label,
    command.detail,
    command.shortcut,
    ...(command.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const normalized = query.toLowerCase().trim();
  if (haystack.includes(normalized)) return 2;
  return normalized
    .split(/\s+/)
    .every((term) => haystack.includes(term))
    ? 1
    : 0;
}

export function CommandPalette({
  commands,
  onClose,
}: {
  commands: BuilderCommand[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  const visibleCommands = useMemo(
    () =>
      commands
        .map((command) => ({ command, score: scoreCommand(command, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ command }) => command),
    [commands, query],
  );

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    inputRef.current?.focus();
    return () => {
      const previousFocus = previousFocusRef.current;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  function execute(command: BuilderCommand) {
    if (command.disabledReason) return;
    onClose();
    window.setTimeout(command.run, 0);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="builder-command-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/35 p-3 pt-[12vh] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-950 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
          <Search className="size-5 shrink-0 text-stone-400" aria-hidden="true" />
          <label htmlFor="builder-command-search" className="sr-only">
            Search commands
          </label>
          <input
            id="builder-command-search"
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) =>
                  Math.min(index + 1, visibleCommands.length - 1),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
                return;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const command = visibleCommands[activeIndex];
                if (command) execute(command);
              }
            }}
            placeholder="Search lessons and actions"
            className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            title="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <h2 id="builder-command-palette-title" className="sr-only">
          Command palette
        </h2>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {visibleCommands.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-stone-500">
              No matching commands.
            </p>
          ) : (
            visibleCommands.map((command, index) => {
              const Icon = icons[command.icon];
              const active = index === activeIndex;
              return (
                <button
                  key={command.id}
                  type="button"
                  disabled={Boolean(command.disabledReason)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => execute(command)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200 ${
                    active ? "bg-violet-50" : "hover:bg-stone-50"
                  } ${
                    command.disabledReason
                      ? "cursor-not-allowed opacity-45"
                      : "text-stone-900"
                  }`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {command.label}
                    </span>
                    {(command.disabledReason || command.detail) && (
                      <span className="mt-0.5 block truncate text-xs text-stone-500">
                        {command.disabledReason ?? command.detail}
                      </span>
                    )}
                  </span>
                  {command.shortcut && (
                    <kbd className="shrink-0 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-500 shadow-sm">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
