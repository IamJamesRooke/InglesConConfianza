import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { readCurriculumFile } from "@/lib/curriculum/server/curriculum-store";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const curriculum = await readCurriculumFile();

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Curriculum</h1>
          <p className="mt-2 text-muted-foreground">
            Language concepts that combine vocabulary and structure.
          </p>
        </div>

        <CurriculumTable initialConcepts={curriculum.concepts} />
      </div>
    </main>
  );
}
