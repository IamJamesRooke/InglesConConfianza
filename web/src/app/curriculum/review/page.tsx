export default function CurriculumReviewPage() {
  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold tracking-tight">Review inbox</h1>
        <p className="mt-2 text-muted-foreground">
          Candidate curriculum batches will wait here for review before they
          enter the approved database.
        </p>
      </div>
    </main>
  );
}
