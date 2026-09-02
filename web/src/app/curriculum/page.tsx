import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { readCurriculumPage } from "@/lib/curriculum/server/curriculum-store";
import type { CurriculumRole } from "@/lib/curriculum/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParameter(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CurriculumPage({ searchParams }: PageProps) {
  const parameters = await searchParams;
  const requestedPage = Number.parseInt(
    firstParameter(parameters.page) ?? "1",
    10,
  );
  const requestedRole = firstParameter(parameters.role);
  const role: CurriculumRole | "all" =
    requestedRole === "core" ||
    requestedRole === "supporting" ||
    requestedRole === "reference" ||
    requestedRole === "trash"
      ? requestedRole
      : "all";
  const curriculum = await readCurriculumPage({
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    search: (firstParameter(parameters.search) ?? "").trim(),
    collection: (firstParameter(parameters.collection) ?? "").trim(),
    role,
  });

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Curriculum</h1>
          <p className="mt-2 text-muted-foreground">
            Language concepts that combine vocabulary and structure.
          </p>
        </div>

        <CurriculumTable
          key={`${curriculum.page}:${curriculum.totalConcepts}:${curriculum.search}:${curriculum.collection}:${curriculum.role}`}
          initialConcepts={curriculum.concepts}
          totalConcepts={curriculum.totalConcepts}
          page={curriculum.page}
          pageCount={curriculum.pageCount}
          filters={{
            search: curriculum.search,
            collection: curriculum.collection,
            role: curriculum.role,
          }}
        />
      </div>
    </main>
  );
}
