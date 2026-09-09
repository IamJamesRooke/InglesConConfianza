import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const determinersTopic: CurriculumTopic = {
  slug: "determiners",
  title: "Determiners",
  description:
    "Everything that can stand where “the” does in front of a noun — articles, demonstratives, possessives, quantifiers, and numbers. Click a Spanish or English chip to trace one form.",
  baseCollection: "topic:determiner",
  facetButtons: [
    {
      collection: "grammar:definite-article",
      label: "Definite article",
      family: "Determiner types",
    },
    {
      collection: "grammar:indefinite-article",
      label: "Indefinite article",
      family: "Determiner types",
    },
    {
      collection: "grammar:demonstrative-determiner",
      label: "Demonstrative",
      family: "Determiner types",
    },
    {
      collection: "grammar:possessive-determiner",
      label: "Possessive",
      family: "Determiner types",
    },
    {
      collection: "topic:quant-much-many",
      label: "Quantifier — Much & Many",
      family: "Determiner types",
    },
    {
      collection: "topic:quant-little-few",
      label: "Quantifier — Little & Few",
      family: "Determiner types",
    },
    {
      collection: "topic:quant-more-less",
      label: "Quantifier — More & Less",
      family: "Determiner types",
    },
    {
      collection: "topic:quant-both-all-whole",
      label: "Quantifier — Both, All & Whole",
      family: "Determiner types",
    },
    {
      collection: "topic:quant-some-any-no",
      label: "Quantifier — Some, Any & No",
      family: "Determiner types",
    },
    {
      collection: "topic:quant-other-certain-such",
      label: "Quantifier — Other, Certain & Such",
      family: "Determiner types",
    },
    {
      collection: "topic:cardinal-1-10",
      label: "Number — 1-10",
      family: "Determiner types",
    },
    {
      collection: "topic:cardinal-11-19",
      label: "Number — 11-19",
      family: "Determiner types",
    },
    {
      collection: "topic:cardinal-tens-and-up",
      label: "Number — Tens & Up",
      family: "Determiner types",
    },
    {
      collection: "grammar:interrogative-determiner",
      label: "Interrogative",
      family: "Determiner types",
    },
    {
      collection: "grammar:relative-determiner",
      label: "Relative (cuyo)",
      family: "Determiner types",
    },
    {
      collection: "grammar:negative",
      label: "Negative (ningún)",
      family: "Determiner types",
    },
  ],
};
