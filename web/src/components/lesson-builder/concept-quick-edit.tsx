"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { COLLECTION_FACETS } from "@/lib/curriculum/collections";
import { curriculumRoles } from "@/lib/curriculum/types";

const KNOWN_FACETS = new Set(Object.keys(COLLECTION_FACETS));

const inputClass =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

export type ConceptDraft = {
  spanish: string;
  english: string;
  exampleSpanish: string;
  exampleEnglish: string;
  role: string;
  collections: string[];
};

type ApiConcept = {
  id: string;
  spanish: string;
  english: string;
  example: { spanish: string; english: string };
  collections: string[];
  curriculumRole: string;
};

function toDraft(concept: ApiConcept): ConceptDraft {
  return {
    spanish: concept.spanish,
    english: concept.english,
    exampleSpanish: concept.example.spanish,
    exampleEnglish: concept.example.english,
    role: concept.curriculumRole,
    collections: concept.collections,
  };
}

// Click-to-edit a curriculum concept. Text / role / tags / delete — the caller
// renders the trigger as `children`. Writes straight to the DB (PATCH/DELETE),
// same as the /curriculum table; the seed snapshot then needs re-exporting.
// Tag editing is unguarded on purpose — use at your own risk.
export function ConceptQuickEdit({
  conceptId,
  initial,
  className,
  children,
  onSaved,
  onDeleted,
}: {
  conceptId: string;
  initial?: ConceptDraft;
  className?: string;
  children: ReactNode;
  onSaved?: (draft: ConceptDraft) => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ConceptDraft | null>(initial ?? null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [vocab, setVocab] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    if (!form) {
      void fetch(`/api/curriculum/concepts/${encodeURIComponent(conceptId)}`)
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data: { concept: ApiConcept }) => {
          if (live) setForm(toDraft(data.concept));
        })
        .catch(() => live && setError("Could not load this concept."));
    }
    if (vocab.length === 0) {
      void fetch("/api/curriculum/collections")
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data: { collections: typeof vocab }) => {
          if (live) setVocab(data.collections);
        })
        .catch(() => undefined);
    }
    return () => {
      live = false;
    };
  }, [open, form, conceptId, vocab.length]);

  function patch<K extends keyof ConceptDraft>(key: K, value: ConceptDraft[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || !form || form.collections.includes(tag)) return;
    patch("collections", [...form.collections, tag]);
    setNewTag("");
  }

  const tagSuggestions = newTag.trim()
    ? vocab
        .filter(
          (entry) =>
            entry.name.toLowerCase().includes(newTag.trim().toLowerCase()) &&
            !form?.collections.includes(entry.name),
        )
        .slice(0, 8)
    : [];

  async function save() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/curriculum/concepts/${encodeURIComponent(conceptId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: conceptId,
            spanish: form.spanish.trim(),
            english: form.english.trim(),
            example: {
              spanish: form.exampleSpanish.trim(),
              english: form.exampleEnglish.trim(),
            },
            collections: form.collections,
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
      onSaved?.(form);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/curriculum/concepts/${encodeURIComponent(conceptId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Unable to delete.");
      setOpen(false);
      onDeleted?.();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete.");
    } finally {
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setForm(initial ?? null);
          setError(null);
          setConfirmingDelete(false);
          setNewTag("");
          setOpen(true);
        }}
        title="Edit concept"
        className={className}
      >
        {children}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Edit concept"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving)
                setOpen(false);
            }}
          >
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl">
            <h2 className="text-lg font-semibold tracking-tight">
              Edit concept
            </h2>

            {!form ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="mt-3 space-y-2.5">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      Spanish
                    </span>
                    <input
                      value={form.spanish}
                      onChange={(event) => patch("spanish", event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      English
                    </span>
                    <input
                      value={form.english}
                      onChange={(event) => patch("english", event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Example (Spanish)
                      </span>
                      <input
                        value={form.exampleSpanish}
                        onChange={(event) =>
                          patch("exampleSpanish", event.target.value)
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Example (English)
                      </span>
                      <input
                        value={form.exampleEnglish}
                        onChange={(event) =>
                          patch("exampleEnglish", event.target.value)
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      Role
                    </span>
                    <select
                      value={form.role}
                      onChange={(event) => patch("role", event.target.value)}
                      className={inputClass}
                    >
                      {curriculumRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      Tags — at your own risk
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {form.collections.map((tag) => {
                        const facet = tag.includes(":")
                          ? tag.slice(0, tag.indexOf(":"))
                          : null;
                        const unknown = !facet || !KNOWN_FACETS.has(facet);
                        return (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                              unknown
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-border bg-muted text-foreground"
                            }`}
                            title={
                              unknown
                                ? "Unrecognised facet — db:test will reject this"
                                : undefined
                            }
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                patch(
                                  "collections",
                                  form.collections.filter((t) => t !== tag),
                                )
                              }
                              aria-label={`Remove ${tag}`}
                              className="text-current/60 hover:text-red-600"
                            >
                              <X className="size-3" aria-hidden="true" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <div className="relative mt-1.5">
                      <input
                        value={newTag}
                        onChange={(event) => setNewTag(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addTag(tagSuggestions[0]?.name ?? newTag);
                          }
                        }}
                        placeholder="add tag, e.g. grammar:manner"
                        className={inputClass}
                      />
                      {tagSuggestions.length > 0 && (
                        <ul className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-xl">
                          {tagSuggestions.map((entry) => (
                            <li key={entry.name}>
                              <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => addTag(entry.name)}
                                className="flex w-full items-center justify-between gap-3 px-3 py-1 text-left hover:bg-muted"
                              >
                                <span>{entry.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {entry.count}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-3 text-sm font-medium text-red-600"
                  >
                    {error}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between gap-2">
                  {confirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-700">Delete?</span>
                      <button
                        type="button"
                        onClick={() => void remove()}
                        disabled={saving}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      disabled={saving}
                      className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                    >
                      Delete concept
                    </button>
                  )}
                  <div className="flex gap-2">
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
              </>
            )}
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}
