import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const numbersTopic: CurriculumTopic = {
  slug: "numbers",
  title: "Numbers",
  description:
    "Cardinals (uno, dos, tres), ordinals (primero, segundo, tercero), and the larger and more fractional numbers that come up once you're past counting on your fingers.",
  baseCollection: "pos:number",
  facetButtons: [
    {
      collection: "topic:cardinal-1-10",
      label: "Cardinal — 1-10",
      family: "Number groups",
    },
    {
      collection: "topic:cardinal-11-19",
      label: "Cardinal — 11-19",
      family: "Number groups",
    },
    {
      collection: "topic:cardinal-tens-and-up",
      label: "Cardinal — Tens & Up",
      family: "Number groups",
    },
    {
      collection: "topic:ordinal-1-10",
      label: "Ordinal — 1st-10th",
      family: "Number groups",
    },
    {
      collection: "topic:ordinal-11-19",
      label: "Ordinal — 11th-19th",
      family: "Number groups",
    },
    {
      collection: "topic:ordinal-20-and-up",
      label: "Ordinal — 20th & Up",
      family: "Number groups",
    },
    {
      collection: "topic:fractions-decimals-and-phone-numbers",
      label: "Fractions & decimals",
      family: "Number groups",
    },
    {
      collection: "topic:large-numbers",
      label: "Large numbers",
      family: "Number groups",
    },
  ],
};
