import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const rulesTopic: CurriculumTopic = {
  slug: "rules",
  title: "Rules",
  description:
    "Grammar rules taught as their own concept so lessons can cover them and the checklist can tick them — one row per rule, grouped by level.",
  baseCollection: "topic:rule",
  facetButtons: [
    {
      collection: "grammar:rule",
      label: "Level 1 rules",
      family: "Level 1 rules",
    },
  ],
};
