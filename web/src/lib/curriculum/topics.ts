// Curriculum topic subpages. Each entry is a curated browse view scoped to one
// base collection, with quick-filter buttons for its sub-facets.

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
      "Every pronoun in the curriculum, Spanish to English, with the grammatical role of each.",
    baseCollection: "pos:pronoun",
    facetButtons: [
      { collection: "grammar:subject-pronoun", label: "Subject" },
      { collection: "grammar:object-pronoun", label: "Object" },
      { collection: "grammar:direct-object-pronoun", label: "Direct object" },
      { collection: "grammar:indirect-object-pronoun", label: "Indirect object" },
      { collection: "grammar:reflexive-pronoun", label: "Reflexive" },
      { collection: "grammar:reciprocal-pronoun", label: "Reciprocal" },
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
