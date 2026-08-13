"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  const linkClassName = (href: string) =>
    `rounded-full px-4 py-2 transition ${
      pathname === href
        ? "bg-white text-stone-950 shadow-sm"
        : "text-stone-700 hover:bg-white hover:text-stone-950"
    }`;

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-stone-950">
          Inglés Con Confianza
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-stone-100 p-1 text-sm font-medium">
          <Link
            href="/"
            className={linkClassName("/")}
          >
            Contenido del curso
          </Link>
          <Link
            href="/sentences"
            className={linkClassName("/sentences")}
          >
            Oraciones
          </Link>
          <Link
            href="/demo-lesson"
            className={linkClassName("/demo-lesson")}
          >
            Lección de demostración
          </Link>
        </nav>
      </div>
    </header>
  );
}
