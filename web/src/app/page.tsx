import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  CourseContentDashboard,
  type GraphMappingItem,
} from "@/components/course-content-dashboard";

export const dynamic = "force-dynamic";

type CurriculumGraph = {
  version: 2;
  formFamilies: FormFamily[];
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type FormFamily = {
  id: string;
  label: string;
  language: string;
  lemmaNodeId: string;
  formNodeIds: string[];
  description: string;
};

type GraphNode = {
  id: string;
  label: string;
  language: string;
  type: string;
  aliases: string[];
  citationForm?: string;
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
    return {
      version: 2,
      formFamilies: [],
      nodes: [],
      edges: [],
    } satisfies CurriculumGraph;
  }
}

function stripPresentationPunctuation(value: string) {
  return value.trim().replace(/[.?!]+$/u, "");
}

function getGraphMappingItems(graph: CurriculumGraph) {
  const nodesById = new Map(
    graph.nodes.map((node) => [node.id, node]),
  );
  const formFamilyByNodeId = new Map(
    graph.formFamilies.flatMap((family) =>
      family.formNodeIds.map((nodeId) => [nodeId, family] as const),
    ),
  );
  const lemmaNodeIdByNodeId = new Map(
    graph.edges
      .filter((edge) => edge.type === "form_of" || edge.type === "contains")
      .map((edge) => [edge.from, edge.to]),
  );

  return graph.edges
    .filter(
      (edge) =>
        edge.type === "maps_to" &&
        ["es_to_en", "en_to_es", "bidirectional"].includes(edge.direction),
    )
    .map((edge) => {
      const fromLabel = nodesById.get(edge.from)?.label ?? edge.from;
      const toLabel = nodesById.get(edge.to)?.label ?? edge.to;
      const spanish =
        edge.direction === "en_to_es" ? toLabel : fromLabel;
      const english =
        edge.direction === "en_to_es" ? fromLabel : toLabel;
      const source = edge.direction === "en_to_es" ? english : spanish;
      const target = edge.direction === "en_to_es" ? spanish : english;
      const sourceNode = nodesById.get(edge.from);
      const targetNode = nodesById.get(edge.to);
      const sourceFamily = formFamilyByNodeId.get(edge.from);
      const sourceLemmaNode = sourceFamily
        ? nodesById.get(sourceFamily.lemmaNodeId)
        : nodesById.get(lemmaNodeIdByNodeId.get(edge.from) ?? edge.from);
      const targetLemmaNode = nodesById.get(
        lemmaNodeIdByNodeId.get(edge.to) ?? edge.to,
      );

      return {
        id: edge.id,
        source,
        target,
        sourceLanguage: edge.direction === "en_to_es" ? "English" : "Spanish",
        targetLanguage: edge.direction === "en_to_es" ? "Spanish" : "English",
        sourceType: sourceNode?.type ?? "concept",
        targetType: targetNode?.type ?? "concept",
        sourceLemma: sourceLemmaNode?.label ?? sourceNode?.label ?? edge.from,
        targetLemma: targetLemmaNode?.label ?? targetNode?.label ?? edge.to,
        sourceCitationForm:
          sourceLemmaNode?.citationForm ?? sourceLemmaNode?.label ?? source,
        targetCitationForm:
          targetLemmaNode?.citationForm ?? targetLemmaNode?.label ?? target,
        sourceFormFamily: sourceFamily?.label ?? null,
        sourceFormFamilySize: sourceFamily?.formNodeIds.length ?? null,
        coveredForm: `${source} → ${target}`,
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
    .reduce<GraphMappingItem[]>((items, mapping) => {
      const existing = items.find(
        (item) =>
          item.direction === mapping.direction &&
          item.sourceLemma === mapping.sourceLemma &&
          item.targetLemma === mapping.targetLemma &&
          item.context === mapping.context,
      );

      if (existing) {
        if (!existing.coveredForms.includes(mapping.coveredForm)) {
          existing.coveredForms.push(mapping.coveredForm);
        }
        existing.evidence.push(...mapping.evidence);
        return items;
      }

      items.push({ ...mapping, coveredForms: [mapping.coveredForm] });
      return items;
    }, [])
    .sort((firstItem, secondItem) =>
      firstItem.sourceLemma.localeCompare(secondItem.sourceLemma),
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
            Curriculum
          </h1>
        </div>

        <CourseContentDashboard graphMappings={graphMappings} />
      </div>
    </main>
  );
}
