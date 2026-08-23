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
  const role = firstParameter(parameters.role);
  const maximumRole: CurriculumRole | "all" =
    role === "core" || role === "supporting" || role === "reference"
      ? role
      : "all";
  const curriculum = await readCurriculumPage({
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    search: (firstParameter(parameters.search) ?? "").trim(),
    collection: (firstParameter(parameters.collection) ?? "").trim(),
    maximumRole,
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
          key={`${curriculum.page}:${curriculum.totalConcepts}:${curriculum.search}:${curriculum.collection}:${curriculum.maximumRole}`}
          initialConcepts={curriculum.concepts}
          availableCollections={curriculum.availableCollections}
          totalConcepts={curriculum.totalConcepts}
          page={curriculum.page}
          pageCount={curriculum.pageCount}
          filters={{
            search: curriculum.search,
            collection: curriculum.collection,
            maximumRole: curriculum.maximumRole,
          }}
        />
      </div>
    </main>
  );
}
