"use client";

import { Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const learnerLinks = [
  { href: "/", label: "Lecciones" },
];

const internalLinks = [
  { href: "/admin/lesson-builder", label: "Lesson Builder" },
  { href: "/admin/lesson-builder/coverage", label: "Coverage" },
  { href: "/admin/curriculum", label: "Curriculum" },
];

const themeOptions = [
  { value: "default", label: "Default" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "rose", label: "Rose" },
  { value: "night", label: "Night" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "default";
    }

    return window.localStorage.getItem("icc-theme") ?? "default";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function updateTheme(nextTheme: string) {
    setTheme(nextTheme);
    window.localStorage.setItem("icc-theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin/lesson-builder") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[var(--header)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="min-w-0 font-semibold tracking-tight text-foreground"
          onClick={() => setIsMenuOpen(false)}
        >
          Inglés Con Confianza
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full bg-background/55 p-1 text-sm font-medium shadow-inner lg:flex"
          aria-label="Learner navigation"
        >
          {learnerLinks.map((link) => (
            <HeaderLink
              key={link.href}
              href={link.href}
              isActive={isActive(link.href)}
            >
              {link.label}
            </HeaderLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAdmin && <InternalNav isActive={isActive} />}
          <SettingsButton onClick={() => setIsSettingsOpen(true)} />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <SettingsButton onClick={() => setIsSettingsOpen(true)} />
          <button
            type="button"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            title={isMenuOpen ? "Close navigation" : "Open navigation"}
            className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
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
            <MobileNavGroup label="Aprender">
              {learnerLinks.map((link) => (
                <MobileLink
                  key={link.href}
                  href={link.href}
                  isActive={isActive(link.href)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </MobileLink>
              ))}
            </MobileNavGroup>
            {isAdmin && (
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
              </MobileNavGroup>
            )}
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/25 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="settings-title" className="text-lg font-semibold">
                Settings
              </h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close settings"
                title="Close"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-muted-foreground">
                Theme
              </span>
              <select
                value={theme}
                onChange={(event) => updateTheme(event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
              >
                {themeOptions.map((themeOption) => (
                  <option key={themeOption.value} value={themeOption.value}>
                    {themeOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </header>
  );
}

function InternalNav({
  isActive,
}: {
  isActive: (href: string) => boolean;
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
          className={`rounded-lg px-2.5 py-2 transition ${
            isActive(link.href)
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function HeaderLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 transition ${
        isActive
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-card hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open settings"
      title="Settings"
      className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <Settings className="size-5" aria-hidden="true" />
    </button>
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
