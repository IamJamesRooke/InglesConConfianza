import { getBlocks } from "@/lib/database";

export default function Home() {
  const blocks = getBlocks();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Curriculum Blocks</h1>
      <ul className="space-y-3">
        {blocks.map((block) => (
          <li key={block.id} className="rounded border p-4">
            <span className="font-medium">{block.spanish}</span>
            <span className="mx-2 text-gray-400">→</span>
            <span>{block.english}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}