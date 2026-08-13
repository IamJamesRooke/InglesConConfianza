import { SentenceExercise } from "@/components/sentence-exercise";
import { getSentences } from "@/lib/database";

export default function SentencesPage() {
  const sentences = getSentences();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-stone-500">
            Course Content
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Sentences
          </h1>
          <p className="mt-3 max-w-xl text-stone-500">
            Sentences assembled from reusable curriculum blocks.
          </p>
        </div>

        <div className="space-y-6">
          {sentences.map((sentence) => (
            <SentenceExercise key={sentence.id} sentence={sentence} />
          ))}
        </div>
      </div>
    </main>
  );
}
