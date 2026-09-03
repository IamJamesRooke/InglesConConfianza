// Curriculum macrotags. Each is a curated view of /curriculum scoped to one
// base collection, with quick-filter buttons for its sub-facets, shown inline
// on the curriculum table.

export type CurriculumTopic = {
  slug: string;
  title: string;
  description: string;
  baseCollection: string;
  facetButtons: Array<{ collection: string; label: string }>;
};

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  {
    slug: "pronouns",
    title: "Pronouns",
    description:
      "Every pronoun, Spanish to English, with its grammatical role. Click a Spanish or English chip to trace one form across the whole system.",
    baseCollection: "topic:pronoun",
    facetButtons: [
      { collection: "grammar:subject-pronoun", label: "Subject" },
      { collection: "grammar:direct-object-pronoun", label: "Direct object" },
      { collection: "grammar:indirect-object-pronoun", label: "Indirect object" },
      { collection: "grammar:prepositional-pronoun", label: "Prepositional" },
      { collection: "grammar:possessive-determiner", label: "Possessive (det)" },
      { collection: "grammar:possessive-pronoun", label: "Possessive (pron)" },
      { collection: "grammar:reflexive-pronoun", label: "Reflexive" },
      { collection: "grammar:reciprocal-pronoun", label: "Reciprocal" },
      { collection: "grammar:demonstrative-determiner", label: "Demonstrative (det)" },
      { collection: "grammar:demonstrative-pronoun", label: "Demonstrative (pron)" },
      { collection: "grammar:indefinite-pronoun", label: "Indefinite" },
      { collection: "grammar:interrogative-pronoun", label: "Interrogative" },
      { collection: "grammar:relative-pronoun", label: "Relative" },
      { collection: "grammar:exclamative", label: "Exclamative" },
      { collection: "grammar:subordinate-subject-pronoun", label: "él → him" },
      { collection: "contrast:confusable", label: "Confusions" },
    ],
  },
];

export function findCurriculumTopic(slug: string): CurriculumTopic | undefined {
  return CURRICULUM_TOPICS.find((topic) => topic.slug === slug);
}
