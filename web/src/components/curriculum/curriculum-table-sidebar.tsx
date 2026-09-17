"use client";

import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { RefObject } from "react";

import { CurriculumBrowsePanel } from "@/components/curriculum/curriculum-browse-panel";
import type { CurriculumNavigationFamilyWithCounts } from "@/lib/curriculum/navigation";

type Macrotag = { slug: string; title: string };

/**
 * The desktop docked topic browser (collapsible aside) plus the mobile
 * slide-over dialog that wraps the same `CurriculumBrowsePanel`. Owns none of
 * the open/closed state itself — `CurriculumTable` keeps that so the alt-digit
 * keyboard shortcut effect and other table-level effects can still see it.
 */
export function CurriculumTableSidebar({
  sidebarOpen,
  toggleSidebar,
  openSidebar,
  mobileTopicsOpen,
  onToggleMobileTopics,
  closeMobileBrowser,
  mobileBrowseRef,
  mobileBrowseOpenerRef,
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
}: {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  mobileTopicsOpen: boolean;
  onToggleMobileTopics: () => void;
  closeMobileBrowser: () => void;
  mobileBrowseRef: RefObject<HTMLElement | null>;
  mobileBrowseOpenerRef: RefObject<HTMLButtonElement | null>;
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
}) {
  return (
    <>
      <aside
        className={`${
          sidebarOpen ? "lg:w-72 xl:w-80" : "lg:w-14"
        } hidden h-[calc(100vh-5rem)] min-h-[560px] self-start overflow-hidden rounded-[16px] border border-border bg-card shadow-[var(--shadow-card)] transition-[width] lg:sticky lg:top-16 lg:flex lg:flex-col`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-3">
          {sidebarOpen && (
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Browse curriculum
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={sidebarOpen ? "Collapse topics" : "Expand topics"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {sidebarOpen ? (
          <CurriculumBrowsePanel
            macrotags={macrotags}
            activeTopic={activeTopic}
            families={families}
            activeFamilyId={activeFamilyId}
            activeLeafCollection={activeLeafCollection}
            topicCount={topicCount}
            scopeLabel={scopeLabel}
            onSelectTopic={onSelectTopic}
            onSelectFamily={onSelectFamily}
            onSelectLeaf={onSelectLeaf}
            onCloseMobileBrowser={closeMobileBrowser}
          />
        ) : (
          <button
            type="button"
            onClick={openSidebar}
            className="m-2 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
            title={activeTopic?.title ?? "All curriculum"}
          >
            <Menu className="size-4" aria-hidden="true" />
            <span className="sr-only">Open topics</span>
          </button>
        )}
      </aside>

      <div className="mb-3 lg:hidden">
        <button
          ref={mobileBrowseOpenerRef}
          type="button"
          onClick={onToggleMobileTopics}
          aria-expanded={mobileTopicsOpen}
          className="flex w-full items-center justify-between rounded-[16px] border border-border bg-card px-4 py-3 text-sm font-semibold shadow-[var(--shadow-card)]"
        >
          <span className="flex items-center gap-2">
            <Menu className="size-4 text-primary" aria-hidden="true" />
            <span className="min-w-0 truncate">{scopeLabel}</span>
          </span>
          <ChevronRight
            className={`size-4 text-muted-foreground transition ${mobileTopicsOpen ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>
        {mobileTopicsOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
            <button
              type="button"
              aria-label="Close curriculum browser"
              onClick={closeMobileBrowser}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
            />
            <aside
              ref={mobileBrowseRef}
              role="dialog"
              aria-modal="true"
              aria-label="Browse curriculum"
              tabIndex={-1}
              className="absolute inset-y-0 left-0 flex w-[min(92vw,24rem)] flex-col overflow-hidden border-r border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Browse curriculum
                </span>
                <button
                  type="button"
                  onClick={closeMobileBrowser}
                  aria-label="Close curriculum browser"
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <CurriculumBrowsePanel
                mobile
                macrotags={macrotags}
                activeTopic={activeTopic}
                families={families}
                activeFamilyId={activeFamilyId}
                activeLeafCollection={activeLeafCollection}
                topicCount={topicCount}
                scopeLabel={scopeLabel}
                onSelectTopic={onSelectTopic}
                onSelectFamily={onSelectFamily}
                onSelectLeaf={onSelectLeaf}
                onCloseMobileBrowser={closeMobileBrowser}
              />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
