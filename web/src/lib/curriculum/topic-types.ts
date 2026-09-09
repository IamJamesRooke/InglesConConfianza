import type { TopicBaseExclusion } from "@/lib/curriculum/scope";

export type CurriculumTopic = {
  slug: string;
  title: string;
  description: string;
  baseCollection: string;
  // Material that carries `baseCollection` but does not belong in this page's
  // browser. See src/lib/curriculum/scope.ts for the rule and the rationale.
  baseExclusions?: readonly TopicBaseExclusion[];
  facetButtons: Array<{ collection: string; label: string; family: string }>;
};

