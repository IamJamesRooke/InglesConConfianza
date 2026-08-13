import { DemoLesson } from "@/components/demo-lesson";
import { demoLessonSteps, type DemoLessonStep } from "@/lib/demo-lesson";
import { getBlocks } from "@/lib/database";

export default function DemoLessonPage() {
  const blocks = getBlocks();
  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const lessonSteps = demoLessonSteps.map((step) => {
    if (step.type !== "question") {
      return step;
    }

    if (step.answerBlocks) {
      return {
        ...step,
        answerBlocks: step.answerBlocks.map((answerBlock) => ({
          ...answerBlock,
          spanish: blockById.get(answerBlock.blockId)?.spanish ?? answerBlock.spanish,
        })),
      };
    }

    if (step.blockId && !blockById.has(step.blockId)) {
      throw new Error(`Missing curriculum block ${step.blockId} for ${step.id}`);
    }

    return step;
  }) satisfies DemoLessonStep[];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-violet-50 px-4 py-8 text-stone-950 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-600">
            ✨ Inglés Con Confianza
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Lección de demostración
          </h1>
        </div>

        <DemoLesson steps={lessonSteps} />
      </div>
    </main>
  );
}
