import { readFile } from "node:fs/promises";
import path from "node:path";

import Link from "next/link";

import {
  CourseContentDashboard,
  type GraphMappingItem,
} from "@/components/course-content-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type CurriculumGraph = {
  version: 1;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type GraphNode = {
  id: string;
  label: string;
  language: string;
  type: string;
  aliases: string[];
  description: string;
  speakingPriority: string;
  learningTags: string[];
};

type GraphEdge = {
  id: string;
  type: string;
  direction: string;
  from: string;
  to: string;
  context: string;
  speakingPriority: string;
  learningTags: string[];
  evidence: Array<{
    lessonId: string;
    blockId: string;
    languageBlockId: string;
    presentationSpanish: string;
    presentationEnglish: string;
  }>;
};

async function getCurriculumGraph() {
  try {
    const file = await readFile(
      path.join(process.cwd(), "data", "curriculum-graph.json"),
      "utf8",
    );
    return JSON.parse(file) as CurriculumGraph;
  } catch {
    return { version: 1, nodes: [], edges: [] } satisfies CurriculumGraph;
  }
}

function stripPresentationPunctuation(value: string) {
  return value.trim().replace(/[.?!]+$/u, "");
}

function getGraphMappingItems(graph: CurriculumGraph) {
  const nodesById = new Map(
    graph.nodes.map((node) => [node.id, node]),
  );

  return graph.edges
    .filter(
      (edge) =>
        edge.type === "maps_to" &&
        ["es_to_en", "en_to_es", "bidirectional"].includes(edge.direction),
    )
    .map<GraphMappingItem>((edge) => {
      const fromLabel = nodesById.get(edge.from)?.label ?? edge.from;
      const toLabel = nodesById.get(edge.to)?.label ?? edge.to;
      const spanish =
        edge.direction === "en_to_es" ? toLabel : fromLabel;
      const english =
        edge.direction === "en_to_es" ? fromLabel : toLabel;

      return {
        id: edge.id,
        spanish,
        english,
        direction: edge.direction,
        context: edge.context,
        speakingPriority: edge.speakingPriority,
        learningTags: edge.learningTags,
        evidence: edge.evidence.map((evidence) => ({
          presentationSpanish: stripPresentationPunctuation(
            evidence.presentationSpanish,
          ),
          presentationEnglish: stripPresentationPunctuation(
            evidence.presentationEnglish,
          ),
        })),
      };
    })
    .sort((firstItem, secondItem) =>
      firstItem.spanish.localeCompare(secondItem.spanish),
    );
}

export default async function Home() {
  const curriculumGraph = await getCurriculumGraph();
  const graphMappings = getGraphMappingItems(curriculumGraph);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Inglés Con Confianza
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Contenido del curso
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A simple view of the English-Spanish and Spanish-English mapping
            cards currently drafted in the curriculum graph.
          </p>
        </div>

        <Card className="border-border bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Current authoring workflow</CardTitle>
            <CardDescription>
              Lessons are still authored in the Lesson Builder. The course
              content view is currently focused on the separate curriculum graph.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/lesson-builder"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              Open Lesson Builder
            </Link>
          </CardContent>
        </Card>

        <CourseContentDashboard graphMappings={graphMappings} />
      </div>
    </main>
  );
}
