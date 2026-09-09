import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const connectorsTopic: CurriculumTopic = {
  slug: "connectors",
  title: "Connectors",
  description:
    "The words that join two clauses or ideas together — the everyday set (y, pero, o, porque, si) plus reason, concession, contrast, and addition connectors for building longer sentences.",
  baseCollection: "pos:connector",
  facetButtons: [
    {
      collection: "grammar:sentence-structure",
      label: "Everyday (and, but, or...)",
      family: "Everyday connectors",
    },
    {
      collection: "grammar:reason",
      label: "Reason",
      family: "Everyday connectors",
    },
    {
      collection: "grammar:concession",
      label: "Concession (although)",
      family: "Discourse & advanced",
    },
    {
      collection: "grammar:contrast",
      label: "Contrast",
      family: "Everyday connectors",
    },
    {
      collection: "grammar:addition",
      label: "Addition",
      family: "Everyday connectors",
    },
    {
      collection: "topic:time-connector",
      label: "Time",
      family: "Everyday connectors",
    },
    {
      collection: "grammar:discourse",
      label: "Discourse markers (that is, by the way)",
      family: "Discourse & advanced",
    },
    {
      collection: "grammar:sequence",
      label: "Sequence (then)",
      family: "Everyday connectors",
    },
    {
      collection: "grammar:conditional",
      label: "Conditional (as long as, unless)",
      family: "Discourse & advanced",
    },
    {
      collection: "grammar:correlative",
      label: "Correlative (either...or, neither...nor)",
      family: "Discourse & advanced",
    },
    {
      collection: "grammar:comparison",
      label: "Comparison (than)",
      family: "Discourse & advanced",
    },
  ],
};
