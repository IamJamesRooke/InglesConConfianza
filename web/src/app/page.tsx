import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  PenTool,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const course = await readCourseSummary().catch(() => null);
  const firstModule = course?.modules.find((module) => module.lessonCount > 0);
  const firstLessonId = firstModule?.firstLessonId;

  return (
    <main className="flex-1 bg-background text-foreground">
      <section className="border-b border-border bg-[linear-gradient(180deg,var(--surface-raised),var(--background))] px-6 py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Inglés para hispanohablantes
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Inglés Con Confianza
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Practica inglés desde ideas en español, con pasos cortos,
              respuestas inmediatas y frases que puedes usar de verdad.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={firstLessonId ? `/practice?lesson=${firstLessonId}` : "/course"}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
              >
                Empezar
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/course"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
              >
                Ver curso
                <BookOpen className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-sm">
            <div className="rounded-xl bg-background p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                Tu siguiente paso
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {firstModule?.name ?? "Curso en preparación"}
              </h2>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <Stat label="Lecciones" value={course?.lessonCount ?? 0} />
                <Stat label="Prácticas" value={course?.practiceCount ?? 0} />
                <Stat label="Módulos" value={course?.modules.length ?? 0} />
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <Signal
                icon={<Sparkles className="size-4" aria-hidden="true" />}
                title="Ideas pequeñas"
                text="Una cosa nueva, luego una acción rápida."
              />
              <Signal
                icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                title="Respuestas claras"
                text="El curso acepta la respuesta apenas la tienes."
              />
              <Signal
                icon={<PenTool className="size-4" aria-hidden="true" />}
                title="Construcción real"
                text="Cada lección termina en una frase útil."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <HomeBand
            title="Aprende"
            text="Abre el curso y avanza por módulos cortos."
            href="/course"
          />
          <HomeBand
            title="Practica"
            text="Retoma cualquier lección guardada."
            href="/practice"
          />
          <HomeBand
            title="Construye"
            text="Autoría y currículo siguen listos para trabajar."
            href="/lesson-builder"
          />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-[var(--surface)] px-3 py-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Signal({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function HomeBand({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </Link>
  );
}
