import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const prepositionsTopic: CurriculumTopic = {
  slug: "prepositions",
  title: "Prepositions",
  description:
    "The compound and multi-word prepositions beyond the basic set already covered on the Mappings pages (de, en, con, a, por) — mostly time and location relationships: antes de, detrás de, a lo largo de.",
  baseCollection: "pos:preposition",
  facetButtons: [
    { collection: "topic:time", label: "Time", family: "Preposition groups" },
    {
      collection: "topic:location-vertical-relative",
      label: "Location — Vertical & Relative",
      family: "Preposition groups",
    },
    {
      collection: "topic:location-path-between",
      label: "Location — Path & Between",
      family: "Preposition groups",
    },
    {
      collection: "construction:map-segun-according-to",
      label: "According to",
      family: "Preposition groups",
    },
    {
      collection: "grammar:purpose",
      label: "Purpose, without & except",
      family: "Preposition groups",
    },
  ],
};
