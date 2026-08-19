import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const upcomingSections = [
  {
    title: "Curriculum Concepts",
    description:
      "The future home for vocabulary, grammar patterns, transformations, and concept groups.",
  },
  {
    title: "Coverage",
    description:
      "Track what has been introduced, reinforced, and left untouched across handcrafted lessons.",
  },
  {
    title: "Lesson Inventory",
    description:
      "Review authored lessons once the JSON lesson format settles into the real curriculum contract.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Inglés Con Confianza
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Contenido del curso
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            This page will become the curriculum dashboard: the place to inspect
            concepts, lesson coverage, and what still needs to be taught.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {upcomingSections.map((section) => (
            <Card key={section.title} className="border-border bg-card">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-border bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Current authoring workflow</CardTitle>
            <CardDescription>
              For now, lessons are authored and saved through the Lesson Builder
              while we rethink the curriculum database from real examples.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/lesson-builder"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              Open Lesson Builder
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
