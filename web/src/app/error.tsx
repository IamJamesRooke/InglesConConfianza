"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="learner-theme learner-error">
      <h1>No pudimos abrir las lecciones.</h1>
      <p>Inténtalo de nuevo en un momento.</p>
      <button type="button" className="learner-button primary" onClick={reset}>
        <RefreshCw size={17} aria-hidden="true" />
        Volver a intentar
      </button>
      <Link href="/" className="learner-button text-button">
        Mis lecciones
      </Link>
    </main>
  );
}
