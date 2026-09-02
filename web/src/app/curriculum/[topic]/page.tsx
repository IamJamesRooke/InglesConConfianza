import { notFound } from "next/navigation";

import { TopicCurriculumView } from "@/components/curriculum/topic-curriculum-view";
import { readCuratedTopic } from "@/lib/curriculum/server/curriculum-store";
import { CURRICULUM_TOPICS, findCurriculumTopic } from "@/lib/curriculum/topics";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CURRICULUM_TOPICS.map((topic) => ({ topic: topic.slug }));
}

type PageProps = { params: Promise<{ topic: string }> };

export default async function CurriculumTopicPage({ params }: PageProps) {
  const { topic: slug } = await params;
  const topic = findCurriculumTopic(slug);
  if (!topic) notFound();

  const { concepts } = await readCuratedTopic(topic.baseCollection);

  return (
    <main className="flex-1 bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">{topic.title}</h1>
          <p className="mt-2 text-muted-foreground">{topic.description}</p>
        </div>
        <TopicCurriculumView
          concepts={concepts}
          facetButtons={topic.facetButtons}
        />
      </div>
    </main>
  );
}
