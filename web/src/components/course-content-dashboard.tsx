"use client";

import { ListFilter, X } from "lucide-react";
import { useState } from "react";

export type GraphMappingItem = {
  id: string;
  source: string;
  target: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceType: string;
  targetType: string;
  sourceLemma: string;
  targetLemma: string;
  sourceCitationForm: string;
  targetCitationForm: string;
  sourceFormFamily: string | null;
  sourceFormFamilySize: number | null;
  coveredForm: string;
  coveredForms: string[];
  direction: string;
  context: string;
  speakingPriority: string;
  learningTags: string[];
  evidence: Array<{
    presentationSpanish: string;
    presentationEnglish: string;
  }>;
};

export function CourseContentDashboard({
  graphMappings,
}: {
  graphMappings: GraphMappingItem[];
}) {
  const [selectedMapping, setSelectedMapping] =
    useState<GraphMappingItem | null>(null);
  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>("all");
  const filteredMappings = graphMappings.filter(
    (mapping) =>
      directionFilter === "all" || mapping.direction === directionFilter,
  );
  const directionCounts = {
    all: graphMappings.length,
    es_to_en: graphMappings.filter(
      (mapping) => mapping.direction === "es_to_en",
    ).length,
    en_to_es: graphMappings.filter(
      (mapping) => mapping.direction === "en_to_es",
    ).length,
  } satisfies Record<DirectionFilter, number>;

  return (
    <>
      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Curriculum Mappings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Source-to-target translation choices from the curriculum graph.
            </p>
          </div>
          <div
            className="inline-flex w-full rounded-xl border border-border bg-muted/50 p-1 sm:w-auto"
            aria-label="Filter mapping direction"
          >
            {directionFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDirectionFilter(option.value)}
                aria-pressed={directionFilter === option.value}
                aria-label={option.label}
                title={option.label}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                  directionFilter === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
              >
                <DirectionIcon direction={option.value} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {directionCounts[option.value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMappings.map((mapping) => (
            <button
              key={mapping.id}
              type="button"
              onClick={() => setSelectedMapping(mapping)}
              className={`rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 ${getPriorityCardClassName(mapping.speakingPriority)}`}
            >
              <span
                className={`mb-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadgeClassName(mapping.speakingPriority)}`}
              >
                {formatPriority(mapping.speakingPriority)}
              </span>
              <p className="text-lg font-semibold text-foreground">
                {mapping.sourceCitationForm}
              </p>
              <p className="text-lg text-muted-foreground">
                {mapping.targetCitationForm}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Covered forms ({mapping.coveredForms.length}
                  {mapping.sourceFormFamilySize
                    ? ` of ${mapping.sourceFormFamilySize}`
                    : ""}):
                </span>{" "}
                {mapping.coveredForms.join(", ")}
              </p>
            </button>
          ))}
        </div>

        {filteredMappings.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No mapping cards match this direction yet.
          </div>
        )}
      </section>

      {selectedMapping && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mapping-card-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="mapping-card-title" className="text-2xl font-semibold">
                  {selectedMapping.source} → {selectedMapping.target}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDirection(selectedMapping.direction)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMapping(null)}
                aria-label="Close mapping metadata"
                title="Close"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetadataCard
                title="Canonical source"
                value={selectedMapping.sourceCitationForm}
              />
              <MetadataCard
                title="Canonical target"
                value={selectedMapping.targetCitationForm}
              />
              <MetadataCard
                title="Covered forms"
                value={selectedMapping.coveredForms.join(", ")}
              />
              <MetadataCard title="Source lemma" value={selectedMapping.sourceLemma} />
              <MetadataCard title="Target lemma" value={selectedMapping.targetLemma} />
              <MetadataCard title="Source type" value={formatIdentifier(selectedMapping.sourceType)} />
              <MetadataCard title="Target type" value={formatIdentifier(selectedMapping.targetType)} />
              {selectedMapping.sourceFormFamily && (
                <MetadataCard
                  title="Source form family"
                  value={selectedMapping.sourceFormFamily}
                />
              )}
              <MetadataCard
                title="Speaking priority"
                value={formatPriority(selectedMapping.speakingPriority)}
              />
              <MetadataCard title="Context" value={selectedMapping.context} />
            </div>

            {selectedMapping.learningTags.length > 0 && (
              <div className="mt-4">
                <MetadataCard
                  title="Learning tags"
                  value={selectedMapping.learningTags.join(", ")}
                />
              </div>
            )}

            {selectedMapping.evidence.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Lesson evidence
                </p>
                <div className="space-y-2">
                  {selectedMapping.evidence.map((evidence, evidenceIndex) => (
                    <div
                      key={`${selectedMapping.id}-${evidenceIndex}`}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="font-medium">
                        {evidence.presentationSpanish}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {evidence.presentationEnglish}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

type DirectionFilter = "all" | "es_to_en" | "en_to_es";

const directionFilterOptions: Array<{
  value: DirectionFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "es_to_en", label: "Spanish → English" },
  { value: "en_to_es", label: "English → Spanish" },
];

function DirectionIcon({ direction }: { direction: DirectionFilter }) {
  if (direction === "all") {
    return <ListFilter className="size-4" aria-hidden="true" />;
  }

  return (
    <span className="inline-flex text-base leading-none" aria-hidden="true">
      {direction === "es_to_en" ? "🇪🇸" : "🇬🇧"}
    </span>
  );
}

function MetadataCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-sm">{value || "None"}</p>
    </div>
  );
}

function formatPriority(priority: string) {
  return (
    {
      core_function: "Core function",
      high_utility: "High utility",
      common_vocabulary: "Common vocabulary",
      advanced_expression: "Advanced expression",
      rare_or_archaic: "Rare or archaic",
    }[priority] ?? formatIdentifier(priority)
  );
}

function getPriorityCardClassName(priority: string) {
  return (
    {
      core_function: "border-red-200 bg-red-50/70",
      high_utility: "border-amber-200 bg-amber-50/70",
      common_vocabulary: "border-blue-200 bg-blue-50/70",
      advanced_expression: "border-violet-200 bg-violet-50/70",
      rare_or_archaic: "border-stone-200 bg-stone-50",
    }[priority] ?? "border-border bg-card"
  );
}

function getPriorityBadgeClassName(priority: string) {
  return (
    {
      core_function: "bg-red-100 text-red-700",
      high_utility: "bg-amber-100 text-amber-800",
      common_vocabulary: "bg-blue-100 text-blue-700",
      advanced_expression: "bg-violet-100 text-violet-700",
      rare_or_archaic: "bg-stone-200 text-stone-700",
    }[priority] ?? "bg-muted text-muted-foreground"
  );
}

function formatDirection(direction: string) {
  return (
    {
      es_to_en: "Spanish → English",
      en_to_es: "English → Spanish",
      bidirectional: "Both directions",
      not_directional: "Not directional",
    }[direction] ?? direction
  );
}

function formatIdentifier(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
