"use client";

// "Add from Level…" (round 2, item B — docs/design/lesson-builder-round-2.md):
// a quiet text-button next to "Copy as text" on the syllabus card, opening a
// portal popover (same pattern as ConceptQuickEdit) with a level selector and
// a checklist of that level's concepts not yet claimed by ANY module's Main
// or Review list. The caller (syllabus-panel.tsx) owns turning the selected
// rows into syllabus items and recording their displays — this component only
// fetches, filters/groups (via syllabus-fill.ts) and collects a selection.
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { renderConceptLabel } from "@/lib/lesson-builder/concept-label";
import { curriculumRoleLabel } from "@/lib/curriculum/types";
import { unclaimedConceptsForLevel, type ByLevelConcept } from "@/lib/lesson-builder/syllabus-fill";
import type { LessonModule } from "@/lib/lesson-builder/types";

const LEVELS = ["P1", "P2", "P3", "P4", "P5"] as const;

export function AddFromLevelPicker({
  modules,
  onAdd,
}: {
  modules: LessonModule[];
  onAdd: (rows: ByLevelConcept[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<(typeof LEVELS)[number]>("P1");
  const [rows, setRows] = useState<ByLevelConcept[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    // Opening the popover, or switching levels while it's open, starts a
    // fresh fetch and a clean selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setSelected(new Set());
    fetch(`/api/admin/curriculum/concepts/by-level?role=${role}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { concepts: ByLevelConcept[] }) => {
        if (!live) return;
        setRows(data.concepts);
        setStatus("idle");
      })
      .catch(() => {
        if (live) setStatus("error");
      });
    return () => {
      live = false;
    };
  }, [open, role]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const groups = unclaimedConceptsForLevel(rows, modules);
  const orderedIds = groups.flatMap((group) => group.entries.map((entry) => entry.item.id));
  const rowById = new Map(rows.map((row) => [row.id, row]));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSelected() {
    const chosen = orderedIds
      .filter((id) => selected.has(id))
      .map((id) => rowById.get(id))
      .filter((row): row is ByLevelConcept => Boolean(row));
    if (chosen.length === 0) return;
    onAdd(chosen);
    close();
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="syllabus-panel-copy-link"
        onClick={() => setOpen(true)}
      >
        Add from Level…
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="syllabus-fill-overlay"
            data-keymap-ignore
            role="dialog"
            aria-modal="true"
            aria-label="Add concepts from a level"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <div className="syllabus-fill-popover">
              <div className="syllabus-fill-header">
                <label className="syllabus-fill-level-field">
                  <span>Level</span>
                  <select
                    className="syllabus-fill-level-select"
                    value={role}
                    onChange={(event) => setRole(event.target.value as (typeof LEVELS)[number])}
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {curriculumRoleLabel(level)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="syllabus-fill-close"
                  onClick={close}
                  aria-label="Close"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>

              {status === "loading" && (
                <p className="syllabus-fill-status">Loading…</p>
              )}
              {status === "error" && (
                <p className="syllabus-fill-status">Could not load concepts for this level.</p>
              )}
              {status === "idle" && groups.length === 0 && (
                <p className="syllabus-fill-status">
                  Everything at this level is already in a syllabus.
                </p>
              )}

              {status === "idle" && groups.length > 0 && (
                <>
                  <div className="syllabus-fill-toolbar">
                    <button
                      type="button"
                      className="syllabus-fill-text-button"
                      onClick={() => setSelected(new Set(orderedIds))}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="syllabus-fill-text-button"
                      onClick={() => setSelected(new Set())}
                    >
                      Clear
                    </button>
                  </div>

                  <div className="syllabus-fill-list">
                    {groups.map((group) => (
                      <div key={group.id} className="syllabus-pos-group">
                        <span className="syllabus-pos-eyebrow">{group.label}</span>
                        {group.entries.map(({ item }) => (
                          <label
                            key={item.id}
                            className="syllabus-fill-row"
                            data-syllabus-fill-row={item.id}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(item.id)}
                              onChange={() => toggle(item.id)}
                            />
                            <span
                              className={`syllabus-fill-dot role-${item.curriculumRole}`}
                              aria-hidden="true"
                            />
                            <span className="syllabus-fill-row-label">
                              {renderConceptLabel(item.spanish)}
                              <span className="lesson-concept-english">
                                {renderConceptLabel(item.english)}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="syllabus-fill-footer">
                    <button
                      type="button"
                      className="syllabus-fill-primary"
                      disabled={selected.size === 0}
                      onClick={addSelected}
                    >
                      Add {selected.size} to Main
                    </button>
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
