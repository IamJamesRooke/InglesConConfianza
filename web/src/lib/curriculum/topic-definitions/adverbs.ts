import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const adverbsTopic: CurriculumTopic = {
  slug: "adverbs",
  title: "Adverbs",
  description:
    "Words that modify a verb, adjective, or whole sentence instead of naming a thing — frequency (siempre, nunca), manner (-mente words, like rápidamente), intensifiers (muy, tan), and the question-word adverbs already covered on the Interrogatives page.",
  baseCollection: "pos:adverb",
  facetButtons: [
    {
      collection: "grammar:frequency-adverb",
      label: "Frequency",
      family: "Word types",
    },
    {
      collection: "grammar:manner",
      label: "Manner (-mente)",
      family: "Word types",
    },
    {
      collection: "grammar:intensifier",
      label: "Intensifiers",
      family: "Word types",
    },
    {
      collection: "grammar:interrogative-adverb",
      label: "Interrogative",
      family: "Word types",
    },
    {
      collection: "topic:adv-time-relative-day",
      label: "Time — Relative Day",
      family: "Meaning & context",
    },
    {
      collection: "topic:adv-time-now-and-timing",
      label: "Time — Now & Timing",
      family: "Meaning & context",
    },
    {
      collection: "topic:location",
      label: "Place",
      family: "Meaning & context",
    },
    {
      collection: "topic:cognate",
      label: "Cognates",
      family: "Meaning & context",
    },
    {
      collection: "adv:possibility",
      label: "Possibility (maybe, apparently)",
      family: "Word types",
    },
    {
      collection: "adv:degree",
      label: "Degree / approximation (almost, barely, somewhat)",
      family: "Word types",
    },
    {
      collection: "adv:habitual",
      label: "Habitual (soler)",
      family: "Word types",
    },
    {
      collection: "grammar:addition",
      label: "Addition (also, either)",
      family: "Word types",
    },
  ],
};
