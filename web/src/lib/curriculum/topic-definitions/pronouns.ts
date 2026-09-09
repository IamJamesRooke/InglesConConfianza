import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const pronounsTopic: CurriculumTopic = {
  slug: "pronouns",
  title: "Pronouns",
  description:
    "Every pronoun, Spanish to English, with its grammatical role. Click a Spanish or English chip to trace one form across the whole system.",
  baseCollection: "topic:pronoun",
  facetButtons: [
    {
      collection: "grammar:subject-pronoun",
      label: "Subject",
      family: "Pronoun types",
    },
    {
      collection: "grammar:direct-object-pronoun",
      label: "Direct object",
      family: "Pronoun types",
    },
    {
      collection: "grammar:indirect-object-pronoun",
      label: "Indirect object",
      family: "Pronoun types",
    },
    {
      collection: "grammar:prep-pronoun-con",
      label: "Prepositional — con",
      family: "Pronoun types",
    },
    {
      collection: "grammar:prep-pronoun-para",
      label: "Prepositional — para",
      family: "Pronoun types",
    },
    {
      collection: "grammar:prep-pronoun-a",
      label: "Prepositional — a",
      family: "Pronoun types",
    },
    {
      collection: "grammar:possessive-determiner",
      label: "Possessive (det)",
      family: "Pronoun types",
    },
    {
      collection: "grammar:possessive-pronoun",
      label: "Possessive (pron)",
      family: "Pronoun types",
    },
    {
      collection: "grammar:reflexive-pronoun",
      label: "Reflexive",
      family: "Pronoun types",
    },
    {
      collection: "grammar:reciprocal-pronoun",
      label: "Reciprocal",
      family: "Pronoun types",
    },
    {
      collection: "grammar:demonstrative-determiner",
      label: "Demonstrative (det)",
      family: "Pronoun types",
    },
    {
      collection: "grammar:demonstrative-pronoun",
      label: "Demonstrative (pron)",
      family: "Pronoun types",
    },
    {
      collection: "grammar:indef-pronoun-person",
      label: "Indefinite — Person",
      family: "Pronoun types",
    },
    {
      collection: "grammar:indef-pronoun-thing",
      label: "Indefinite — Thing",
      family: "Pronoun types",
    },
    {
      collection: "grammar:indef-pronoun-place",
      label: "Indefinite — Place",
      family: "Pronoun types",
    },
    {
      collection: "grammar:indef-pronoun-quantity",
      label: "Indefinite — Quantity",
      family: "Pronoun types",
    },
    {
      collection: "grammar:interrogative-pronoun",
      label: "Interrogative",
      family: "Pronoun types",
    },
    {
      collection: "grammar:relative-pronoun",
      label: "Relative",
      family: "Pronoun types",
    },
    {
      collection: "grammar:exclamative",
      label: "Exclamative",
      family: "Pronoun types",
    },
    {
      collection: "grammar:subordinate-subject-pronoun",
      label: "él → him",
      family: "Pronoun types",
    },
  ],
};
