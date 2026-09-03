"use client";

import { Plus } from "lucide-react";

import { MarkdownEditor } from "@/components/lesson-builder/markdown-editor";
import { OverviewMarkdown } from "@/components/lesson-builder/overview-markdown";
import type { SentenceBlock } from "@/lib/lesson-builder/types";

export type SentenceMarkdownFieldName =
  | "promptLabel"
  | "promptText"
  | "helperText"
  | "answerFeedback";

function SentenceMarkdownFieldEditor({
  label,
  markdown,
  placeholder,
  tone = "violet",
  isOpen,
  onOpen,
  onClose,
  onChange,
}: {
  label: string;
  markdown: string;
  placeholder: string;
  tone?: "violet" | "emerald";
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (markdown: string) => void;
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/45 text-emerald-800"
      : "border-violet-200 bg-violet-50/45 text-violet-800";

  if (!isOpen && !markdown.trim()) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-dashed px-3 py-2 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-current/15 ${toneClasses}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
          <Plus className="size-3.5" aria-hidden="true" />
          Add
        </span>
      </button>
    );
  }

  return (
    <section className={`overflow-hidden rounded-xl border ${toneClasses}`}>
      <div className="flex min-h-10 items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={isOpen ? onClose : onOpen}
          className="min-w-0 flex-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em] focus-visible:outline-none"
        >
          {label}
        </button>
        {isOpen && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-semibold transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20"
          >
            Done
          </button>
        )}
      </div>
      {isOpen ? (
        <div className="border-t border-current/10 bg-white text-stone-900">
          <MarkdownEditor
            markdown={markdown}
            onChange={onChange}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="block w-full border-t border-current/10 bg-white/75 px-3 py-3 text-left text-sm leading-5 text-stone-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-current/15"
        >
          {markdown.trim() ? (
            <OverviewMarkdown markdown={markdown} />
          ) : (
            <span className="italic text-stone-400">{placeholder}</span>
          )}
        </button>
      )}
    </section>
  );
}

// The four optional prose fields on a sentence block. `activeField` is which of
// this block's fields is currently open for editing (null = none); the parent
// owns that single-open-at-a-time state across all blocks.
export function SentenceMarkdownFields({
  block,
  activeField,
  onActivate,
  onDeactivate,
  onChange,
}: {
  block: SentenceBlock;
  activeField: SentenceMarkdownFieldName | null;
  onActivate: (field: SentenceMarkdownFieldName) => void;
  onDeactivate: () => void;
  onChange: (field: SentenceMarkdownFieldName, markdown: string) => void;
}) {
  return (
    <>
      <div className="order-1 space-y-3">
        <div className="flex items-center gap-3 text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
            Optional fields
          </span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <SentenceMarkdownFieldEditor
          label="Label"
          markdown={block.promptLabel}
          placeholder="For example: Tu turno"
          isOpen={activeField === "promptLabel"}
          onOpen={() => onActivate("promptLabel")}
          onClose={onDeactivate}
          onChange={(markdown) => onChange("promptLabel", markdown)}
        />
        <SentenceMarkdownFieldEditor
          label="Prompt"
          markdown={block.promptText}
          placeholder="For example: ¿Cómo se dice “Estoy preparando”?"
          isOpen={activeField === "promptText"}
          onOpen={() => onActivate("promptText")}
          onClose={onDeactivate}
          onChange={(markdown) => onChange("promptText", markdown)}
        />
      </div>
      <div className="order-3 mt-3">
        <SentenceMarkdownFieldEditor
          label="Helper text"
          markdown={block.helperText ?? ""}
          placeholder="For example: No hay penalización por equivocarse."
          isOpen={activeField === "helperText"}
          onOpen={() => onActivate("helperText")}
          onClose={onDeactivate}
          onChange={(markdown) => onChange("helperText", markdown)}
        />
      </div>
      <div className="order-4 mt-3">
        <SentenceMarkdownFieldEditor
          label="Answer feedback"
          markdown={block.answerFeedback ?? ""}
          placeholder="For example: Correcto. Ahora puedes usar la frase completa."
          tone="emerald"
          isOpen={activeField === "answerFeedback"}
          onOpen={() => onActivate("answerFeedback")}
          onClose={onDeactivate}
          onChange={(markdown) => onChange("answerFeedback", markdown)}
        />
      </div>
    </>
  );
}
