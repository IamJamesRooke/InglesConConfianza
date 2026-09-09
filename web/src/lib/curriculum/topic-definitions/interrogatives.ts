import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const interrogativesTopic: CurriculumTopic = {
  slug: "interrogatives",
  title: "Interrogatives",
  description:
    "The question words — qué, quién, cuál, cuándo, dónde, cómo, cuánto, por qué — as pronouns, determiners, and adverbs. Click a chip to trace one form.",
  baseCollection: "topic:interrogative",
  facetButtons: [
    {
      collection: "grammar:interrogative-pronoun",
      label: "Pronoun",
      family: "Question-word roles",
    },
    {
      collection: "grammar:interrogative-determiner",
      label: "Determiner",
      family: "Question-word roles",
    },
    {
      collection: "grammar:interrogative-adverb",
      label: "Adverb",
      family: "Question-word roles",
    },
  ],
};
