import { readCurriculumFile } from "@/lib/curriculum/server/curriculum-store";
import { readReviewFile } from "@/lib/curriculum/server/review-store";

export const dynamic = "force-dynamic";

const completedVerbFamilies = [
  "querer",
  "necesitar",
  "comer",
  "tomar",
  "beber",
  "hablar",
  "decir",
  "dar",
  "pedir",
  "poner",
  "enseñar",
  "escuchar",
  "esperar",
  "estar",
  "extrañar",
  "faltar",
  "ganar",
  "gustar",
  "haber",
  "hacer",
  "ir",
  "llamar",
  "llegar",
  "llevar",
  "mandar",
  "parar",
  "parecer",
  "pasar",
  "pensar",
  "perder",
  "pesar",
  "poder",
  "preguntar",
  "prestar",
  "quedar",
  "quitar",
  "abrir",
  "acabar",
  "alcanzar",
  "caer",
  "conocer",
  "conseguir",
  "contar",
  "costar",
  "creer",
  "deber",
  "dejar",
  "echar",
];

const todoVerbFamilies = [
  "recordar",
  "robar",
  "saber",
  "sacar",
  "salir",
  "seguir",
  "sentir",
  "ser",
  "significar",
  "soler",
  "suponer",
  "tener",
  "tocar",
  "trabajar",
  "traer",
  "valer",
  "venir",
  "ver",
  "volver",
];

export default async function CurriculumProgressPage() {
  const [curriculum, review] = await Promise.all([
    readCurriculumFile(),
    readReviewFile(),
  ]);
  const completedBatches = review.batches.filter(
    (batch) => batch.status === "migrated",
  );
  const roleCounts = curriculum.concepts.reduce(
    (counts, concept) => {
      counts[concept.curriculumRole] += 1;
      return counts;
    },
    { core: 0, supporting: 0, reference: 0 },
  );

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          Migration progress
        </h1>
        <p className="mt-2 text-muted-foreground">
          Completed verb-family audits and the concepts now in the database.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Verb families complete</p>
            <p className="mt-2 text-3xl font-semibold">{completedVerbFamilies.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">{completedBatches.length} migration batches</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Concepts migrated</p>
            <p className="mt-2 text-3xl font-semibold">{curriculum.concepts.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">database records</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Core</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{roleCounts.core}</p>
            <p className="mt-1 text-sm text-muted-foreground">must-learn language</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Supporting / Reference</p>
            <p className="mt-2 text-3xl font-semibold">
              {roleCounts.supporting + roleCounts.reference}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {roleCounts.supporting} supporting · {roleCounts.reference} reference
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Completed audits</h2>
          <div className="mt-4 space-y-3">
            {completedBatches.map((batch) => {
              const core = batch.candidates.filter(
                (candidate) => candidate.curriculumRole === "core",
              ).length;
              const supporting = batch.candidates.filter(
                (candidate) => candidate.curriculumRole === "supporting",
              ).length;
              const reference = batch.candidates.filter(
                (candidate) => candidate.curriculumRole === "reference",
              ).length;

              return (
                <article
                  key={batch.id}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{batch.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Migrated {batch.migratedAt ?? batch.createdAt}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                      Complete
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span>{batch.candidates.length} concepts</span>
                    <span>{core} Core</span>
                    <span>{supporting} Supporting</span>
                    <span>{reference} Reference</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Verb-family Todo list</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Active Spanish-to-English mapping folders still awaiting their completeness audit.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
              {todoVerbFamilies.length} remaining
            </span>
          </div>

          <div className="mt-4 rounded-xl border bg-card p-5">
            <div className="flex flex-wrap gap-2">
              {todoVerbFamilies.map((verb) => (
                <span
                  key={verb}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-950"
                >
                  Todo · {verb}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
