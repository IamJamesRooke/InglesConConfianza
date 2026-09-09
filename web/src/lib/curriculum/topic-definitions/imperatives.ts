import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const imperativesTopic: CurriculumTopic = {
  slug: "imperatives",
  title: "Imperatives & Commands",
  description:
    'Spanish commands change form for formality and number (tú vs. usted vs. ustedes) and even switch conjugation entirely between affirmative and negative — English collapses all of that into one invariant "Close the door" / "Don\'t close the door." Watch the Spanish side change while the English stays put.',
  baseCollection: "topic:imperative",
  facetButtons: [
    {
      collection: "imp:affirmative-informal",
      label: "Affirmative — tú (informal)",
      family: "Command types",
    },
    {
      collection: "imp:affirmative-formal",
      label: "Affirmative — usted/ustedes (formal)",
      family: "Command types",
    },
    {
      collection: "imp:negative",
      label: "Negative (don't...)",
      family: "Command types",
    },
    {
      collection: "imp:lets",
      label: "Let's — nosotros",
      family: "Command types",
    },
  ],
};
