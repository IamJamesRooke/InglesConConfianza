"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import type { CurriculumConcept } from "@/lib/curriculum/types";

const collectionHues = [25, 55, 90, 145, 190, 235, 275, 315, 350];

function collectionStyle(collection: string): CSSProperties {
  const hash = [...collection].reduce(
    (current, character) => (current * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return { "--collection-hue": collectionHues[hash % collectionHues.length] } as CSSProperties;
}

const roleBadge: Record<string, string> = {
  core: "bg-primary/15 text-primary",
  supporting: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  reference: "bg-muted text-muted-foreground",
  trash: "bg-destructive/15 text-destructive",
};

type FacetButton = { collection: string; label: string };

export function TopicCurriculumView({
  concepts,
  facetButtons,
}: {
  concepts: CurriculumConcept[];
  facetButtons: FacetButton[];
}) {
  const [active, setActive] = useState<string[]>([]);

  const visibleFacets = useMemo(
    () =>
      facetButtons.filter((facet) =>
        concepts.some((concept) => concept.collections.includes(facet.collection)),
      ),
    [concepts, facetButtons],
  );

  const filtered = useMemo(
    () =>
      active.length === 0
        ? concepts
        : concepts.filter((concept) =>
            active.every((collection) => concept.collections.includes(collection)),
          ),
    [concepts, active],
  );

  function toggle(collection: string) {
    setActive((current) =>
      current.includes(collection)
        ? current.filter((item) => item !== collection)
        : [...current, collection],
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {visibleFacets.map((facet) => {
          const on = active.includes(facet.collection);
          const count = concepts.filter((concept) =>
            concept.collections.includes(facet.collection),
          ).length;
          return (
            <button
              key={facet.collection}
              type="button"
              onClick={() => toggle(facet.collection)}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {facet.label}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
        {active.length > 0 && (
          <button
            type="button"
            onClick={() => setActive([])}
            className="px-2 py-1 text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {filtered.length} of {concepts.length} concepts
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">Spanish</th>
              <th className="px-3 py-2 font-semibold">English</th>
              <th className="px-3 py-2 font-semibold">Role</th>
              <th className="px-3 py-2 font-semibold">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((concept) => (
              <tr key={concept.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium">{concept.spanish}</td>
                <td className="px-3 py-2">{concept.english}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadge[concept.curriculumRole] ?? ""}`}
                  >
                    {concept.curriculumRole}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {concept.collections
                      .filter((collection) => collection.startsWith("grammar:"))
                      .map((collection) => (
                        <button
                          key={collection}
                          type="button"
                          onClick={() => toggle(collection)}
                          style={collectionStyle(collection)}
                          className={`collection-pill rounded-full border px-2 py-0.5 text-xs font-semibold transition ${
                            active.includes(collection) ? "collection-pill-selected" : ""
                          }`}
                        >
                          {collection.slice("grammar:".length)}
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
