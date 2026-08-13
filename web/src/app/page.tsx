import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { getBlocks } from "@/lib/database";

export default function Home() {
  const blocks = getBlocks();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-stone-500">
            Inglés Con Confianza
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Curriculum blocks
          </h1>
          <p className="mt-3 max-w-xl text-stone-500">
            Small building blocks for creating natural English sentences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {blocks.map((block) => (
            <Card
              key={block.id}
              className="group min-h-44 overflow-hidden border-stone-200 bg-white p-0 text-stone-950 shadow-lg shadow-stone-200/60 transition duration-200 hover:-translate-y-1 hover:border-stone-400 hover:shadow-stone-300/70"
            >
              <CardContent className="flex h-full min-h-44 flex-col justify-between p-0">
                <div className="flex flex-1 items-center justify-center px-5 py-8 text-center">
                  <span className="text-2xl font-semibold tracking-tight transition group-hover:text-stone-600">
                    {block.english}
                  </span>
                </div>
                <div className="border-t border-stone-800 bg-stone-900 px-5 py-3 text-center text-sm font-semibold text-white">
                  {block.spanish}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
