"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * The bottom "Previous / Page N of M / Next" bar under the results list.
 * The compact pager inside the toolbar's results-count row is a separate,
 * visually distinct control and stays inlined in `CurriculumTableToolbar`.
 */
export function CurriculumPagination({
  page,
  pageCount,
  onPreviousPage,
  onNextPage,
}: {
  page: number;
  pageCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <nav
      aria-label="Curriculum pages"
      className="mt-4 flex items-center justify-between gap-4"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPreviousPage}
        title="Previous page"
        className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="sr-only">Previous page</span>
      </button>
      <span className="text-sm font-medium text-muted-foreground">
        Page <span className="text-foreground">{page}</span> of {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={onNextPage}
        title="Next page"
        className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
        <span className="sr-only">Next page</span>
      </button>
    </nav>
  );
}
