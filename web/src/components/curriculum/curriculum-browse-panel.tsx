"use client";

import type { CurriculumNavigationFamilyWithCounts } from "@/lib/curriculum/navigation";

type Macrotag = { slug: string; title: string };

type CurriculumBrowsePanelProps = {
  mobile?: boolean;
  macrotags: Macrotag[];
  activeTopic: { slug: string; title: string; baseCollection: string } | null;
  families: CurriculumNavigationFamilyWithCounts[];
  activeFamilyId: string;
  activeLeafCollection: string;
  topicCount: number;
  scopeLabel: string;
  onSelectTopic: (slug: string | null) => void;
  onSelectFamily: (familyId: string | null) => void;
  onSelectLeaf: (familyId: string, collection: string | null) => void;
  onCloseMobileBrowser: () => void;
};

export function CurriculumBrowsePanel({
  mobile = false,
  macrotags,
  activeTopic,
  families,
  activeFamilyId,
  activeLeafCollection,
  topicCount,
  scopeLabel,
  onSelectTopic,
  onSelectFamily,
  onSelectLeaf,
  onCloseMobileBrowser,
}: CurriculumBrowsePanelProps) {
  const activeFamily = families.find((family) => family.id === activeFamilyId);
  const configuredFamilies = families.filter(
    (family) => family.id !== "outside-families",
  );
  const outsideFamily = families.find(
    (family) => family.id === "outside-families",
  );
  const showFamilyLevel = configuredFamilies.length > 1;
  const browseFamily =
    activeFamily ?? (!showFamilyLevel ? configuredFamilies[0] : undefined);
  const activeLeaf = browseFamily?.leaves.find(
    (leaf) => leaf.collection === activeLeafCollection,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border p-3">
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          1 · Topic
          <select
            value={activeTopic?.slug ?? ""}
            onChange={(event) => onSelectTopic(event.target.value || null)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="">All curriculum</option>
            {macrotags.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {activeTopic ? (
        <>
          {showFamilyLevel && (
          <div className="flex min-h-0 flex-1 flex-col border-b border-border p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              2 · Family
            </p>
            <div
              className={`${mobile ? "max-h-52" : "max-h-[32vh]"} min-h-0 space-y-0.5 overflow-y-auto overscroll-contain pr-1`}
              aria-label={`${activeTopic.title} families`}
            >
              <button
                type="button"
                onClick={() => onSelectFamily(null)}
                aria-pressed={!activeFamily}
                className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-sm transition ${
                  !activeFamily
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>All {activeTopic.title}</span>
                <span className="shrink-0 text-[11px] tabular-nums opacity-70">
                  {topicCount}
                </span>
              </button>
              {families.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => onSelectFamily(family.id)}
                  aria-pressed={activeFamily?.id === family.id}
                  disabled={family.count === 0}
                  className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-[13px] transition disabled:opacity-40 ${
                    activeFamily?.id === family.id
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{family.label}</span>
                  <span className="shrink-0 text-[11px] tabular-nums opacity-70">
                    {family.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              3 · Collection
            </p>
            {browseFamily ? (
              <div
                className={`${mobile ? "max-h-60" : "max-h-[39vh]"} min-h-0 space-y-0.5 overflow-y-auto overscroll-contain pr-1`}
                aria-label={`${browseFamily.label} collections`}
              >
                <button
                  type="button"
                  onClick={() =>
                    showFamilyLevel
                      ? onSelectLeaf(browseFamily.id, null)
                      : onSelectFamily(null)
                  }
                  aria-pressed={!activeLeaf}
                  className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-sm transition ${
                    !activeLeaf
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>
                    All{" "}
                    {showFamilyLevel || browseFamily.id === "outside-families"
                      ? browseFamily.label
                      : activeTopic.title}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums opacity-70">
                    {showFamilyLevel ? browseFamily.count : topicCount}
                  </span>
                </button>
                {browseFamily.leaves.length === 0 && (
                  <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground">
                    These concepts are still reachable for curation but are
                    not assigned to one of this topic&apos;s focused collections.
                  </p>
                )}
                {browseFamily.leaves.map((leaf) => (
                  <button
                    key={leaf.collection}
                    type="button"
                    onClick={() =>
                      onSelectLeaf(browseFamily.id, leaf.collection)
                    }
                    aria-pressed={activeLeaf?.collection === leaf.collection}
                    disabled={leaf.count === 0}
                    title={leaf.collection}
                    className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-[13px] leading-snug transition disabled:opacity-40 ${
                      activeLeaf?.collection === leaf.collection
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{leaf.label}</span>
                    <span className="shrink-0 text-[11px] tabular-nums opacity-70">
                      {leaf.count}
                    </span>
                  </button>
                ))}
                {!showFamilyLevel &&
                  outsideFamily &&
                  browseFamily.id !== "outside-families" && (
                    <button
                      type="button"
                      onClick={() => onSelectFamily(outsideFamily.id)}
                      className="mt-2 flex min-h-9 w-full items-center justify-between gap-2 border-t border-border px-2.5 pt-2 text-left text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span>Outside these collections</span>
                      <span className="tabular-nums">
                        {outsideFamily.count}
                      </span>
                    </button>
                  )}
              </div>
            ) : (
              <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
                Choose a family to see its focused collections.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="p-4 text-sm leading-relaxed text-muted-foreground">
          Choose a topic to browse its families and collections, or search the
          complete curriculum.
        </p>
      )}

      {mobile && (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={onCloseMobileBrowser}
            className="h-10 w-full rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            View {scopeLabel}
          </button>
        </div>
      )}
    </div>
  );
}
