// Curriculum macrotags. Each is a curated view of /admin/curriculum scoped to one
// base collection, with quick-filter buttons for its sub-facets, shown inline
// on the curriculum table.

import { pronounsTopic } from "@/lib/curriculum/topic-definitions/pronouns";
import { determinersTopic } from "@/lib/curriculum/topic-definitions/determiners";
import { interrogativesTopic } from "@/lib/curriculum/topic-definitions/interrogatives";
import { verbsTopic } from "@/lib/curriculum/topic-definitions/verbs";
import { specialVerbsTopic } from "@/lib/curriculum/topic-definitions/special-verbs";
import { cognatesTopic } from "@/lib/curriculum/topic-definitions/cognates";
import { nounsTopic } from "@/lib/curriculum/topic-definitions/nouns";
import { adjectivesTopic } from "@/lib/curriculum/topic-definitions/adjectives";
import { adverbsTopic } from "@/lib/curriculum/topic-definitions/adverbs";
import { numbersTopic } from "@/lib/curriculum/topic-definitions/numbers";
import { expressionsTopic } from "@/lib/curriculum/topic-definitions/expressions";
import { connectorsTopic } from "@/lib/curriculum/topic-definitions/connectors";
import { prepositionsTopic } from "@/lib/curriculum/topic-definitions/prepositions";
import { mappingsTopic } from "@/lib/curriculum/topic-definitions/mappings";
import { enMappingsTopic } from "@/lib/curriculum/topic-definitions/en-mappings";
import { phrasalVerbsByRootTopic } from "@/lib/curriculum/topic-definitions/phrasal-verbs-by-root";
import { phrasalVerbsByParticleTopic } from "@/lib/curriculum/topic-definitions/phrasal-verbs-by-particle";
import { transformationsTopic } from "@/lib/curriculum/topic-definitions/transformations";
import { verbFormsTopic } from "@/lib/curriculum/topic-definitions/verb-forms";
import { verbPatternsTopic } from "@/lib/curriculum/topic-definitions/verb-patterns";
import { questionsNegationTopic } from "@/lib/curriculum/topic-definitions/questions-negation";
import { imperativesTopic } from "@/lib/curriculum/topic-definitions/imperatives";
import { collocationsTopic } from "@/lib/curriculum/topic-definitions/collocations";
import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  pronounsTopic,
  determinersTopic,
  interrogativesTopic,
  verbsTopic,
  specialVerbsTopic,
  cognatesTopic,
  nounsTopic,
  adjectivesTopic,
  adverbsTopic,
  numbersTopic,
  expressionsTopic,
  connectorsTopic,
  prepositionsTopic,
  mappingsTopic,
  enMappingsTopic,
  phrasalVerbsByRootTopic,
  phrasalVerbsByParticleTopic,
  transformationsTopic,
  verbFormsTopic,
  verbPatternsTopic,
  questionsNegationTopic,
  imperativesTopic,
  collocationsTopic,
];

export function findCurriculumTopic(slug: string): CurriculumTopic | undefined {
  return CURRICULUM_TOPICS.find((topic) => topic.slug === slug);
}
