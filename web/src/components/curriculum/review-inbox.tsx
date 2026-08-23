"use client";

import { useRef, useState } from "react";

import {
  curriculumRoles,
  type ReviewBatch,
  type ReviewCandidate,
} from "@/lib/curriculum/review-types";
import type { CurriculumRole } from "@/lib/curriculum/types";

const roleLabels: Record<CurriculumRole, string> = {
  core: "Core",
  supporting: "Supporting",
  reference: "Reference",
};

type CandidateReviewUpdate = Partial<
  Pick<
    ReviewCandidate,
    "curriculumRole" | "approved" | "deleted" | "ownerNote"
  >
>;

export function ReviewInbox({ initialBatches }: { initialBatches: ReviewBatch[] }) {
  const [batches, setBatches] = useState(initialBatches);
  const batchesRef = useRef(initialBatches);
  const saveQueuesRef = useRef(new Map<string, Promise<void>>());
  const [savingCandidateIds, setSavingCandidateIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | null>(null);

  function updateCandidate(
    batchId: string,
    candidateId: string,
    updates: CandidateReviewUpdate,
  ) {
    let nextCandidate: ReviewCandidate | null = null;

    const nextBatches = batchesRef.current.map((batch) =>
      batch.id === batchId
        ? {
            ...batch,
            candidates: batch.candidates.map((candidate) => {
              if (candidate.id !== candidateId) return candidate;

              nextCandidate = { ...candidate, ...updates };
              return nextCandidate;
            }),
          }
        : batch,
    );

    if (!nextCandidate) return null;

    batchesRef.current = nextBatches;
    setBatches(nextBatches);
    return nextCandidate;
  }

  function saveCandidate(
    batchId: string,
    candidateId: string,
    updates: CandidateReviewUpdate,
  ) {
    const candidate = updateCandidate(batchId, candidateId, updates);
    if (!candidate) return;

    setError(null);
    setSavingCandidateIds((current) => new Set(current).add(candidateId));

    const queueKey = `${batchId}:${candidateId}`;
    const previousSave = saveQueuesRef.current.get(queueKey) ?? Promise.resolve();

    const save = previousSave.catch(() => undefined).then(async () => {
      const response = await fetch(
        `/api/curriculum/review/batches/${encodeURIComponent(batchId)}/candidates/${encodeURIComponent(candidateId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidate),
        },
      );

      if (!response.ok) throw new Error("Unable to save the review candidate.");
    });

    saveQueuesRef.current.set(queueKey, save);

    void save
      .catch(() => {
        setError("Unable to save the review candidate. Please try again.");
      })
      .finally(() => {
        if (saveQueuesRef.current.get(queueKey) !== save) return;

        saveQueuesRef.current.delete(queueKey);
        setSavingCandidateIds((current) => {
          const next = new Set(current);
          next.delete(candidateId);
          return next;
        });
      });
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {batches.map((batch) => (
        <section key={batch.id} className="rounded-xl border border-border bg-card shadow-sm">
          {(() => {
            const pendingCandidates = batch.candidates.filter(
              (candidate) =>
                !candidate.approved && !candidate.deleted && !candidate.migrated,
            );
            const approvedCandidates = batch.candidates.filter(
              (candidate) =>
                candidate.approved && !candidate.deleted && !candidate.migrated,
            );
            const migratedCandidates = batch.candidates.filter(
              (candidate) => candidate.migrated && !candidate.deleted,
            );
            const deletedCandidates = batch.candidates.filter(
              (candidate) => candidate.deleted,
            );

            if (batch.candidates.length === 0) return null;

            return (
              <>
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">{batch.title}</h2>
              <span className="text-sm text-muted-foreground">{batch.createdAt}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {pendingCandidates.length > 0
                ? `${pendingCandidates.length} candidate${pendingCandidates.length === 1 ? "" : "s"} awaiting approval. Choose a final role, add a note if needed, and click Done when it is ready to apply.`
                : approvedCandidates.length === 0 && deletedCandidates.length > 0
                  ? "All remaining candidates have been deleted. Deleted entries stay in the review history with their notes."
                : approvedCandidates.length === 0 && migratedCandidates.length > 0
                  ? "All approved candidates have been applied. Pending candidates remain for a later review round."
                  : "All candidates in this batch are approved and ready to apply."}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Sources: {batch.sourcePaths.join(" · ")}
            </p>
          </div>

          <div className="divide-y divide-border">
            {pendingCandidates.map((candidate) => {
              const isSaving = savingCandidateIds.has(candidate.id);

              return (
                <article key={candidate.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {candidate.action === "revise" ? "Correction" : "Addition"}
                      </span>
                      <h3 className="mt-3 text-lg font-semibold">
                        {candidate.spanish} <span className="text-muted-foreground">→</span> {candidate.english}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Model recommendation
                        </span>
                        <span
                          className={`role-select role-${candidate.suggestedCurriculumRole} rounded-full border px-2.5 py-1 text-sm font-semibold`}
                        >
                          {roleLabels[candidate.suggestedCurriculumRole]}
                        </span>
                      </div>
                      {candidate.existingConceptId && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Revises approved concept: {candidate.existingConceptId}
                        </p>
                      )}
                    </div>

                    <div className="max-w-md space-y-2">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Your choice
                        </span>
                        {curriculumRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() =>
                              saveCandidate(batch.id, candidate.id, {
                                curriculumRole: role,
                              })
                            }
                            aria-pressed={candidate.curriculumRole === role}
                            className={`rounded-md border px-2 py-1 text-sm font-semibold transition disabled:opacity-60 ${
                              candidate.curriculumRole === role
                                ? `role-select role-${role}`
                                : "border-input bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {roleLabels[role]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            saveCandidate(batch.id, candidate.id, {
                              approved: false,
                              deleted: true,
                            })
                          }
                          aria-pressed={candidate.deleted === true}
                          className={`rounded-md border px-2 py-1 text-sm font-semibold transition disabled:opacity-60 ${
                            candidate.deleted
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-input bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            saveCandidate(batch.id, candidate.id, {
                              approved: true,
                            })
                          }
                          className="rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <p className="rounded-lg bg-muted/60 p-3">
                      <span className="block font-medium text-muted-foreground">Spanish example</span>
                      {candidate.example.spanish}
                    </p>
                    <p className="rounded-lg bg-muted/60 p-3">
                      <span className="block font-medium text-muted-foreground">English example</span>
                      {candidate.example.english}
                    </p>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {candidate.rationale}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Not approved yet. Your note guides the next revision round.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Tags
                    </span>
                    {candidate.collections.map((collection) => (
                      <span
                        key={collection}
                        className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                      >
                        {collection}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Evidence: {candidate.sourcePaths.join(" · ")}
                  </p>

                  <label className="mt-4 block text-sm font-medium text-muted-foreground">
                    Your note
                    <textarea
                      value={candidate.ownerNote}
                      onChange={(event) =>
                        updateCandidate(batch.id, candidate.id, {
                          ownerNote: event.target.value,
                        })
                      }
                      onBlur={(event) => {
                        const ownerNote = event.target.value.trim();
                        saveCandidate(batch.id, candidate.id, { ownerNote });
                      }}
                      placeholder="Optional correction, rationale, or follow-up request"
                      className="mt-2 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
                    />
                  </label>
                  {isSaving && (
                    <p className="mt-2 text-xs text-muted-foreground">Saving…</p>
                  )}
                </article>
              );
            })}
          </div>
          {approvedCandidates.length > 0 && (
            <div className="border-t border-border bg-emerald-500/5 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Approved / Ready to apply ({approvedCandidates.length})
              </h3>
              <div className="mt-3 space-y-2">
                {approvedCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-600/25 bg-card px-3 py-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{candidate.spanish}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-muted-foreground">{candidate.english}</span>
                      <span className="ml-3 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {roleLabels[candidate.curriculumRole]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        saveCandidate(batch.id, candidate.id, {
                          approved: false,
                        })
                      }
                      className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                    >
                      Undo approval
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {migratedCandidates.length > 0 && (
            <div className="border-t border-border bg-muted/40 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Applied to curriculum ({migratedCandidates.length})
              </h3>
              <div className="mt-3 space-y-2">
                {migratedCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{candidate.spanish}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-muted-foreground">{candidate.english}</span>
                      <span className="ml-3 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {roleLabels[candidate.curriculumRole]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {deletedCandidates.length > 0 && (
            <div className="border-t border-border bg-red-500/5 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Deleted ({deletedCandidates.length})
              </h3>
              <div className="mt-3 space-y-2">
                {deletedCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-600/25 bg-card px-3 py-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{candidate.spanish}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-muted-foreground">{candidate.english}</span>
                      {candidate.ownerNote && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Note: {candidate.ownerNote}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        saveCandidate(batch.id, candidate.id, {
                          deleted: false,
                        })
                      }
                      className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                    >
                      Undo delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
              </>
            );
          })()}
        </section>
      ))}
    </div>
  );
}
