import { Plus } from "lucide-react";

export default function LessonBuilderPage() {
  return (
    <main className="flex-1 bg-stone-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <button
          type="button"
          className="group flex min-h-40 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 text-lg font-semibold text-stone-700 shadow-sm transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-stone-100 transition group-hover:bg-violet-100">
            <Plus className="size-5" aria-hidden="true" />
          </span>
          Create new lesson
        </button>
      </div>
    </main>
  );
}
