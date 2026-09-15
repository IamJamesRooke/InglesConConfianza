"use client";

import Link from "next/link";

export default function ErrorPage() {
  return (
    <main id="main-content" className="learner-theme learner-error">
      <h1>No pudimos abrir las lecciones.</h1>
      <p>Inténtalo de nuevo en un momento.</p>
      <Link href="/" className="learner-button primary">
        Volver al inicio
      </Link>
    </main>
  );
}
