// Curriculum topic subpages. Each entry is a curated browse view scoped to one
// base collection, with quick-filter buttons for its sub-facets. The page renders
// the same CurriculumTable as /curriculum.

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
      "Every pronoun in the curriculum, Spanish to English, with its grammatical role. Click en:her to see every Spanish form.",
    baseCollection: "topic:pronoun",
    facetButtons: [
      { collection: "grammar:subject-pronoun", label: "Subject" },
      { collection: "grammar:object-pronoun", label: "Object" },
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
      { collection: "grammar:subordinate-subject-pronoun", label: "In “want X to”" },
      { collection: "grammar:first-person", label: "1st person" },
      { collection: "grammar:second-person", label: "2nd person" },
      { collection: "grammar:third-person", label: "3rd person" },
      { collection: "grammar:plural", label: "Plural" },
    ],
  },
];

export function findCurriculumTopic(slug: string): CurriculumTopic | undefined {
  return CURRICULUM_TOPICS.find((topic) => topic.slug === slug);
}
