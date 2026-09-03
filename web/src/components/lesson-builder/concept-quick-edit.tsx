"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CoveredConcept } from "@/lib/lesson-builder/server/coverage-report";
import { curriculumRoles } from "@/lib/curriculum/types";

const roleClasses: Record<string, string> = {
  core: "bg-emerald-100 text-emerald-800",
  supporting: "bg-blue-100 text-blue-800",
  reference: "bg-stone-200 text-stone-600",
  trash: "bg-red-100 text-red-700",
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

// The concept label in the Coverage matrix, click-to-edit. Small text / role
// fixes only — tags stay out of here on purpose (they're batch/AI work). Writes
// straight to the curriculum via PATCH, same as the /curriculum table; the seed
// snapshot then needs re-exporting + committing.
export function ConceptQuickEdit({ concept }: { concept: CoveredConcept }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    spanish: concept.spanish,
    english: concept.english,
    exampleSpanish: concept.exampleSpanish,
    exampleEnglish: concept.exampleEnglish,
    role: concept.role as string,
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      ) => setForm((current) => ({ ...current, [key]: event.target.value })),
    };
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/curriculum/concepts/${encodeURIComponent(concept.conceptId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: concept.conceptId,
            spanish: form.spanish.trim(),
            english: form.english.trim(),
            example: {
              spanish: form.exampleSpanish.trim(),
              english: form.exampleEnglish.trim(),
            },
            collections: concept.collections,
            curriculumRole: form.role,
          }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Unable to save.");
      }
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setForm({
            spanish: concept.spanish,
            english: concept.english,
            exampleSpanish: concept.exampleSpanish,
            exampleEnglish: concept.exampleEnglish,
            role: concept.role,
          });
          setError(null);
          setOpen(true);
        }}
        title="Quick edit"
        className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition hover:bg-muted"
      >
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleClasses[concept.role]}`}
        >
          {concept.role}
        </span>
        <span className="truncate">
          <span className="font-semibold text-stone-900">{concept.spanish}</span>
          <span className="text-stone-400"> → </span>
          <span className="text-stone-600">{concept.english}</span>
        </span>
        <Pencil
          className="ml-auto size-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${concept.spanish}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl">
            <h2 className="text-lg font-semibold tracking-tight">
              Edit concept
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Text and role only. Tags are edited in a batch pass.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Spanish
                </span>
                <input {...field("spanish")} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  English
                </span>
                <input {...field("english")} className={inputClass} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Example (Spanish)
                  </span>
                  <input {...field("exampleSpanish")} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Example (English)
                  </span>
                  <input {...field("exampleEnglish")} className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Role
                </span>
                <select {...field("role")} className={inputClass}>
                  {curriculumRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
