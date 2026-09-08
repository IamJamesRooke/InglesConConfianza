"use client";

import { Menu, Palette, Settings, X } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const internalLinks = [
  { href: "/admin/lesson-builder", label: "Lessons" },
  { href: "/admin/curriculum", label: "Curriculum" },
];

const themeOptions = [
  {
    value: "default",
    label: "Confianza",
    swatches: [
      "oklch(0.48 0.18 265)",
      "oklch(0.68 0.12 185)",
      "oklch(0.74 0.14 80)",
    ],
  },
  {
    value: "purple",
    label: "Violeta",
    swatches: [
      "oklch(0.5 0.2 295)",
      "oklch(0.68 0.15 335)",
      "oklch(0.72 0.13 210)",
    ],
  },
  {
    value: "night",
    label: "Noche",
    swatches: [
      "oklch(0.72 0.14 250)",
      "oklch(0.76 0.13 205)",
      "oklch(0.18 0.055 275)",
    ],
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState("default");

  useEffect(() => {
    let storedTheme = "default";
    try {
      storedTheme = window.localStorage.getItem("icc-theme") ?? "default";
    } catch {
      // The default theme remains usable when storage is blocked.
    }
    if (storedTheme === "default") return;
    const timer = window.setTimeout(() => setTheme(storedTheme), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function updateTheme(nextTheme: string) {
    setTheme(nextTheme);
    try {
      window.localStorage.setItem("icc-theme", nextTheme);
    } catch {
      // Theme selection still works when persistent storage is unavailable.
    }
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === href;
    if (href === "/admin/lesson-builder") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const isAdmin = pathname.startsWith("/admin");

  if (pathname === "/practice") return null;

  if (!isAdmin) {
    return (
      <>
        <LearnerHeader onOpenTheme={() => setIsSettingsOpen(true)} />
        {isSettingsOpen && (
          <ThemeDialog
            theme={theme}
            onChange={updateTheme}
            onClose={() => setIsSettingsOpen(false)}
            learner
          />
        )}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[var(--header)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/admin/lesson-builder"
          className="flex min-w-0 items-center gap-2.5 font-semibold text-foreground"
          onClick={() => setIsMenuOpen(false)}
        >
          <BrandMark size={32} />
          <span className="min-w-0 leading-tight">Inglés con Confianza <span className="text-xs font-medium text-muted-foreground">Admin</span></span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <InternalNav isActive={isActive} />
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
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <ThemeDialog
          theme={theme}
          onChange={updateTheme}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </header>
  );
}

function LearnerHeader({ onOpenTheme }: { onOpenTheme: () => void }) {
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
          <BrandMark size={40} />
          <span className="learner-brand-name">
            Inglés con <strong>Confianza<span aria-hidden="true">.</span></strong>
          </span>
        </Link>
        <button
          type="button"
          className="learner-theme-switcher"
          onClick={onOpenTheme}
          aria-label="Cambiar tema"
        >
          <Palette size={18} aria-hidden="true" />
          <span>Tema</span>
        </button>
      </div>
    </header>
  );
}

function ThemeDialog({
  theme,
  onChange,
  onClose,
  learner = false,
}: {
  theme: string;
  onChange: (theme: string) => void;
  onClose: () => void;
  learner?: boolean;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/25 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="settings-title" className="text-lg font-semibold">
            {learner ? "Elige tu estilo" : "Settings"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label={learner ? "Cerrar" : "Close settings"}
            title={learner ? "Cerrar" : "Close"}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mb-2 text-sm font-medium text-muted-foreground">
          {learner ? "Tema" : "Theme"}
        </p>
        <div className="grid gap-2">
          {themeOptions.map((themeOption) => (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => onChange(themeOption.value)}
              aria-pressed={theme === themeOption.value}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 ${
                theme === themeOption.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span>{themeOption.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {themeOption.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    aria-hidden="true"
                    className="size-4 rounded-full border border-black/10"
                    style={{ background: swatch }}
                  />
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
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
