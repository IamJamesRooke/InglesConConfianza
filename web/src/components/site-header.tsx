"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

const internalLinks = [
  { href: "/admin/lesson-builder", label: "Lessons" },
  { href: "/admin/curriculum", label: "Curriculum" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const isAdmin = pathname.startsWith("/admin");

  if (pathname === "/practice") return null;

  if (!isAdmin) {
    return <LearnerHeader />;
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
        </div>

        <div className="flex items-center gap-2 lg:hidden">
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
              Confianza<span aria-hidden="true" className="brand-dot">.</span>
            </span>
          </span>
        </Link>
      </div>
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
