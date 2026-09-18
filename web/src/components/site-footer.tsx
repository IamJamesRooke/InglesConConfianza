import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ConfirmResetButton } from "@/components/learner/confirm-reset-button";

const adminLinks = [
  { href: "/admin/lesson-builder", label: "Lessons" },
  { href: "/admin/lesson-builder/coverage", label: "Coverage" },
  { href: "/admin/curriculum", label: "Curriculum" },
];

/**
 * Shared site-wide footer (owner, 2026-09-17): one dark `--ink-deep` band —
 * brand mark, name, tagline, copyright — on every page except the lesson
 * experience (`/practice`). The learner variant keeps the "Reiniciar todo
 * el progreso" control (needs client state, so it's the only interactive
 * piece); the admin variant swaps it for a muted line + the three admin
 * section links, matching the header's own English chrome.
 */
export function SiteFooter({
  variant,
  onResetAll,
  showOnboardingReplay = false,
}: {
  variant: "learner" | "admin";
  onResetAll?: () => void;
  /** A quiet "Ver la introducción otra vez" link — only when a published
   * onboarding module exists (docs/design/onboarding.md §1, "Afterwards"). */
  showOnboardingReplay?: boolean;
}) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand-row">
          <BrandMark size={28} variant={variant === "admin" ? "bare" : "tile"} />
          <span className="site-footer-name">Inglés con Confianza</span>
        </div>
        <p className="site-footer-tagline">
          Inglés para hispanohablantes, una frase real a la vez.
        </p>
        <p className="site-footer-copyright">
          © 2026 Inglés con Confianza · Hecho en Bogotá
        </p>
        {variant === "learner" ? (
          <>
            {showOnboardingReplay && (
              <Link href="/bienvenida?repasar=1" className="site-footer-replay">
                Ver la introducción otra vez
              </Link>
            )}
            <ConfirmResetButton
              className="site-footer-reset"
              label="Reiniciar todo el progreso"
              confirmLabel="¿Seguro? Reiniciar todo, incluida la introducción"
              onConfirm={() => onResetAll?.()}
            />
          </>
        ) : (
          <div className="site-footer-admin">
            <p className="site-footer-admin-label">Admin · Inglés con Confianza</p>
            <nav className="site-footer-admin-links" aria-label="Admin sections">
              {adminLinks.map((link) => (
                <Link key={link.href} href={link.href} className="site-footer-admin-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </footer>
  );
}
