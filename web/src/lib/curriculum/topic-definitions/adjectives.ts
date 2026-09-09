import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const adjectivesTopic: CurriculumTopic = {
  slug: "adjectives",
  title: "Adjectives",
  description:
    "Every adjective, with its copula bracketed to show how it's actually used — [ser] importante, [estar] listo, [tener] hambre — plus comparative/superlative forms and a quality-based theme.",
  baseCollection: "pos:adjective",
  facetButtons: [
    {
      collection: "topic:adj-oso-osa",
      label: "-oso/-osa (famoso, nervioso)",
      family: "Adjective endings",
    },
    {
      collection: "topic:adj-ico-ica",
      label: "-ico/-ica (práctico, típico)",
      family: "Adjective endings",
    },
    {
      collection: "topic:adj-ivo-iva",
      label: "-ivo/-iva (activo, creativo)",
      family: "Adjective endings",
    },
    {
      collection: "topic:adj-able",
      label: "-able (aceptable, notable)",
      family: "Adjective endings",
    },
    {
      collection: "topic:adj-ible",
      label: "-ible (posible, visible)",
      family: "Adjective endings",
    },
    {
      collection: "topic:adj-ente",
      label: "-ente (diferente, evidente)",
      family: "Adjective endings",
    },
    {
      collection: "topic:adj-al",
      label: "-al (natural, general)",
      family: "Adjective endings",
    },
    {
      collection: "topic:adj-ano-ana",
      label: "-ano/-ana (americano, cotidiano)",
      family: "Adjective endings",
    },
    { collection: "topic:color", label: "Color", family: "Semantic themes" },
    { collection: "topic:size", label: "Size", family: "Semantic themes" },
    { collection: "topic:age", label: "Age", family: "Semantic themes" },
    { collection: "topic:speed", label: "Speed", family: "Semantic themes" },
    {
      collection: "topic:weather",
      label: "Weather",
      family: "Semantic themes",
    },
    { collection: "topic:time", label: "Time", family: "Semantic themes" },
    {
      collection: "topic:value-price",
      label: "Value / price",
      family: "Semantic themes",
    },
    {
      collection: "topic:nationality",
      label: "Nationality",
      family: "Semantic themes",
    },
    {
      collection: "topic:difficulty",
      label: "Difficulty",
      family: "Semantic themes",
    },
    {
      collection: "topic:personality",
      label: "Personality",
      family: "Semantic themes",
    },
    {
      collection: "topic:emotion-physical-sensation",
      label: "Emotion — Physical Sensation",
      family: "Semantic themes",
    },
    {
      collection: "topic:emotion-feeling",
      label: "Emotion — Feeling",
      family: "Semantic themes",
    },
    {
      collection: "topic:condition-state",
      label: "Condition / state",
      family: "Semantic themes",
    },
    {
      collection: "topic:estar-adj",
      label: "estar (temporary state)",
      family: "How it's used",
    },
    {
      collection: "grammar:tener-adjective",
      label: "tener (idiom)",
      family: "How it's used",
    },
    {
      collection: "grammar:adjective-position",
      label: "Word order & sentence frame",
      family: "How it's used",
    },
    {
      collection: "degree:comparative-er",
      label: "-er (harder)",
      family: "Comparison",
    },
    {
      collection: "degree:superlative-est",
      label: "-est (hardest)",
      family: "Comparison",
    },
    {
      collection: "degree:comparative-more",
      label: "more ___",
      family: "Comparison",
    },
    {
      collection: "degree:superlative-most",
      label: "most ___",
      family: "Comparison",
    },
    {
      collection: "degree:irregular-comparative",
      label: "irregular comparative",
      family: "Comparison",
    },
    {
      collection: "degree:irregular-superlative",
      label: "irregular superlative",
      family: "Comparison",
    },
    {
      collection: "topic:adj-ser-general",
      label: "Other descriptive adjectives",
      family: "Other descriptive adjectives",
    },
  ],
};
