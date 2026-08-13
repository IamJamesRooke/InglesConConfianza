import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-stone-950">
          Inglés Con Confianza
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-stone-100 p-1 text-sm font-medium">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-stone-700 transition hover:bg-white hover:text-stone-950"
          >
            Course Content
          </Link>
          <Link
            href="/sentences"
            className="rounded-full px-4 py-2 text-stone-700 transition hover:bg-white hover:text-stone-950"
          >
            Sentences
          </Link>
          <Link
            href="/demo-lesson"
            className="rounded-full px-4 py-2 text-stone-700 transition hover:bg-white hover:text-stone-950"
          >
            Demo Lesson
          </Link>
        </nav>
      </div>
    </header>
  );
}
