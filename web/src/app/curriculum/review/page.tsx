import { ReviewInbox } from "@/components/curriculum/review-inbox";
import { readReviewFile } from "@/lib/curriculum/server/review-store";

export const dynamic = "force-dynamic";

export default async function CurriculumReviewPage() {
  const reviewFile = await readReviewFile();

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold tracking-tight">Review inbox</h1>
        <p className="mt-2 text-muted-foreground">
          Candidates remain outside the approved Curriculum database until you
          decide what to do with them.
        </p>
        <div className="mt-8">
          <ReviewInbox initialBatches={reviewFile.batches} />
        </div>
      </div>
    </main>
  );
}
