"use client";

import { Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  const linkClassName = (href: string) =>
    `rounded-full px-4 py-2 transition ${
      pathname === href
        ? "bg-card text-foreground shadow-sm"
        : "text-muted-foreground hover:bg-card hover:text-foreground"
    }`;

  return (
    <header className="border-b border-border bg-[var(--header)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          Inglés Con Confianza
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-background/45 p-1 text-sm font-medium shadow-inner">
          <Link
            href="/"
            className={linkClassName("/")}
          >
            Contenido del curso
          </Link>
          <Link
            href="/lesson-builder"
            className={linkClassName("/lesson-builder")}
          >
            Lesson Builder
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Open settings"
          title="Settings"
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Settings className="size-5" aria-hidden="true" />
        </button>
      </div>

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
