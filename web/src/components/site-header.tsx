"use client";

import { Keyboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import "@/styles/admin-header.css";

const internalLinks = [
  { href: "/admin/lesson-builder", label: "Lessons" },
  { href: "/admin/lesson-builder/coverage", label: "Coverage" },
  { href: "/admin/curriculum", label: "Curriculum" },
];

// Same-page bridge to the Lesson Builder's keyboard-help dialog (S4): the
// dialog's own state lives inside lesson-library.tsx, outside this
// component tree, so this dispatches a plain DOM event instead of
// prop-drilling dialog state through the layout. Event name must stay in
// sync with lesson-library.tsx's listener.
const KEYBOARD_HELP_EVENT = "lesson-builder:toggle-keyboard-help";

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === href;
    // "Lessons" owns the builder itself and its course/module views, but not the
    // sibling Coverage page.
    if (href === "/admin/lesson-builder") {
      return (
        pathname === href ||
        pathname.startsWith("/admin/lesson-builder/course") ||
        pathname.startsWith("/admin/lesson-builder/modules")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const isAdmin = pathname.startsWith("/admin");
  // The Ctrl+. shortcut/dialog only exists on the Lesson Builder itself, so
  // the menu entry that replaces the old floating trigger (S4) only shows
  // there, not on every admin page.
  const showKeyboardHelpEntry = pathname.startsWith("/admin/lesson-builder");

  if (pathname === "/practice") return null;

  if (!isAdmin) {
    return <LearnerHeader />;
  }

  function toggleKeyboardHelp() {
    document.dispatchEvent(new Event(KEYBOARD_HELP_EVENT));
  }

  return (
    <header className="admin-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/admin/lesson-builder"
          className="admin-header-brand flex min-w-0 items-center gap-2.5 font-semibold"
          onClick={() => setIsMenuOpen(false)}
        >
          <BrandMark size={32} variant="bare" />
          <span className="flex min-w-0 items-center gap-2 leading-tight">
            <span className="truncate">Inglés con Confianza</span>
            <span className="admin-header-badge shrink-0 text-[10px] font-semibold tracking-wide uppercase">
              Admin
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <InternalNav
            isActive={isActive}
            showKeyboardHelp={showKeyboardHelpEntry}
            onToggleKeyboardHelp={toggleKeyboardHelp}
          />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            title={isMenuOpen ? "Close navigation" : "Open navigation"}
            className="admin-header-menu-button flex size-10 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {isMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-background px-6 py-4 lg:hidden">
          <div className="mx-auto grid max-w-6xl gap-4">
            <MobileNavGroup label="Admin">
              {internalLinks.map((link) => (
                <MobileLink
                  key={link.href}
                  href={link.href}
                  isActive={isActive(link.href)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </MobileLink>
              ))}
              {showKeyboardHelpEntry && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    toggleKeyboardHelp();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Keyboard className="size-4" aria-hidden="true" />
                  Keyboard shortcuts
                </button>
              )}
            </MobileNavGroup>
          </div>
        </div>
      )}
    </header>
  );
}

function LearnerHeader() {
  return (
    <header className="learner-theme learner-header">
      <a href="#main-content" className="learner-skip">
        Ir al curso
      </a>
      <div className="course-container learner-header-inner">
        <Link
          href="/"
          className="learner-brand"
          aria-label="Inglés con Confianza"
        >
          <BrandMark size={38} />
          <span className="learner-brand-name">
            <span className="brand-pre">Inglés con</span>
            <span className="brand-word">
              Confianza
              <span aria-hidden="true" className="brand-dot">
                .
              </span>
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}

function InternalNav({
  isActive,
  showKeyboardHelp,
  onToggleKeyboardHelp,
}: {
  isActive: (href: string) => boolean;
  showKeyboardHelp: boolean;
  onToggleKeyboardHelp: () => void;
}) {
  return (
    <nav
      className="flex items-center gap-1 text-xs font-semibold"
      aria-label="Admin tools"
    >
      {internalLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`admin-header-nav-link rounded-lg px-2.5 py-2 transition ${
            isActive(link.href) ? "admin-header-nav-link-active" : ""
          }`}
        >
          {link.label}
        </Link>
      ))}
      {showKeyboardHelp && (
        <button
          type="button"
          onClick={onToggleKeyboardHelp}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts  ( Ctrl/⌘ . )"
          className="admin-header-nav-link flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition"
        >
          <Keyboard className="size-3.5" aria-hidden="true" />
          Shortcuts
        </button>
      )}
    </nav>
  );
}

function MobileNavGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <nav className="grid gap-1 text-sm font-semibold">{children}</nav>
    </div>
  );
}

function MobileLink({
  href,
  isActive,
  onClick,
  children,
}: {
  href: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 transition ${
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
