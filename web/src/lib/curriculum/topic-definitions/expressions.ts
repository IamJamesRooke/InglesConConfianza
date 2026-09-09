import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const expressionsTopic: CurriculumTopic = {
  slug: "expressions",
  title: "Expressions",
  description:
    "Fixed social phrases that don't break down grammatically — please, thank you, excuse me, nice to meet you — learned whole rather than built word by word.",
  baseCollection: "topic:social-expression",
  facetButtons: [
    {
      collection: "expr:politeness",
      label: "Politeness",
      family: "Expression groups",
    },
    {
      collection: "expr:greeting",
      label: "Greetings",
      family: "Expression groups",
    },
    {
      collection: "expr:apology",
      label: "Apologies",
      family: "Expression groups",
    },
    {
      collection: "expr:response",
      label: "Response words",
      family: "Expression groups",
    },
    {
      collection: "expr:farewell",
      label: "Farewells",
      family: "Expression groups",
    },
    {
      collection: "expr:warning-command",
      label: "Warnings & commands",
      family: "Expression groups",
    },
    {
      collection: "expr:idiom",
      label: "Idioms & fixed phrases",
      family: "Expression groups",
    },
  ],
};
