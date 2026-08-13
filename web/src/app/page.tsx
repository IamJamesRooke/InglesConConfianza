import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBlocks, getConstructions } from "@/lib/database";

export default function Home() {
  const blocks = getBlocks();
  const constructions = getConstructions();

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
            Reusable blocks and patterns for creating natural English sentences.
          </p>
        </div>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Blocks
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Surface forms that can be reused in different constructions.
              </p>
            </div>
            <span className="text-sm text-stone-400">{blocks.length} total</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {blocks.map((block) => (
              <Card
                key={block.id}
                className="group min-h-44 overflow-hidden border-stone-200 bg-white p-0 text-stone-950 shadow-lg shadow-stone-200/60 transition duration-200 hover:-translate-y-1 hover:border-stone-400 hover:shadow-stone-300/70"
              >
                <CardContent className="flex h-full min-h-44 flex-col justify-between p-0">
                  <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
                    <span className="text-2xl font-semibold tracking-tight transition group-hover:text-stone-600">
                      {block.english ?? "Part of a construction"}
                    </span>
                    {block.context && (
                      <span className="mt-2 text-xs text-stone-400">
                        {block.context}
                      </span>
                    )}
                  </div>
                  <div className="border-t border-stone-800 bg-stone-900 px-5 py-3 text-center text-sm font-semibold text-white">
                    {block.spanish}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Constructions
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Reusable patterns with variable slots.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {constructions.map((construction) => (
              <Card key={construction.id} className="border-stone-200 bg-white">
                <CardHeader>
                  <CardTitle>{construction.name}</CardTitle>
                  <CardDescription>{construction.explanation}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-stone-100 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">
                        Spanish pattern
                      </p>
                      <code className="text-sm text-stone-800">
                        {construction.source_pattern}
                      </code>
                    </div>
                    <div className="rounded-lg bg-stone-900 p-3 text-white">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">
                        English pattern
                      </p>
                      <code className="text-sm">
                        {construction.target_pattern}
                      </code>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                      Variable slots
                    </p>
                    <ul className="space-y-2 text-sm">
                      {construction.slots.map((slot) => (
                        <li key={slot.id} className="rounded-md border border-stone-200 p-3">
                          <p className="font-medium text-stone-900">{slot.name}</p>
                          <p className="mt-1 text-stone-500">
                            {slot.source_constraint} → {slot.target_constraint}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                      Examples
                    </p>
                    <ul className="space-y-3">
                      {construction.examples.map((example) => (
                        <li key={example.id} className="border-l-2 border-stone-300 pl-3">
                          <p className="font-medium text-stone-900">{example.source_text}</p>
                          <p className="text-stone-500">{example.target_text}</p>
                          {example.note && (
                            <p className="mt-1 text-xs text-stone-400">{example.note}</p>
                          )}
                          {example.slots.length > 0 && (
                            <div className="mt-3 space-y-1 rounded-md bg-stone-50 p-2 text-xs">
                              {example.slots.map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex flex-wrap gap-x-2 gap-y-1"
                                >
                                  <span className="font-medium text-stone-700">
                                    {slot.slot_name}:
                                  </span>
                                  <span className="text-stone-500">
                                    {slot.source_value} → {slot.target_value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
