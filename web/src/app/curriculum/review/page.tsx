import { ReviewInbox } from "@/components/curriculum/review-inbox";
import { readReviewFile } from "@/lib/curriculum/server/review-store";

export const dynamic = "force-dynamic";

export default async function CurriculumReviewPage() {
  const reviewFile = await readReviewFile();
  const openBatches = reviewFile.batches.filter(
    (batch) => batch.status === "open",
  );

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold tracking-tight">Review inbox</h1>
        <p className="mt-2 text-muted-foreground">
          Candidates remain outside the approved Curriculum database until you
          decide what to do with them.
        </p>
        <div className="mt-8">
          {openBatches.length > 0 ? (
            <ReviewInbox initialBatches={openBatches} />
          ) : (
            <p className="rounded-lg border border-emerald-600/30 bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
              The review inbox is empty. Migrated batches remain in the review
              history and will not reappear here.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
