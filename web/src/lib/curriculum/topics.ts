// Curriculum macrotags. Each is a curated view of /admin/curriculum scoped to one
// base collection, with quick-filter buttons for its sub-facets, shown inline
// on the curriculum table.

export type CurriculumTopic = {
  slug: string;
  title: string;
  description: string;
  baseCollection: string;
  facetButtons: Array<{ collection: string; label: string }>;
};

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  {
    slug: "pronouns",
    title: "Pronouns",
    description:
      "Every pronoun, Spanish to English, with its grammatical role. Click a Spanish or English chip to trace one form across the whole system.",
    baseCollection: "topic:pronoun",
    facetButtons: [
      { collection: "grammar:subject-pronoun", label: "Subject" },
      { collection: "grammar:direct-object-pronoun", label: "Direct object" },
      { collection: "grammar:indirect-object-pronoun", label: "Indirect object" },
      { collection: "grammar:prepositional-pronoun", label: "Prepositional" },
      { collection: "grammar:possessive-determiner", label: "Possessive (det)" },
      { collection: "grammar:possessive-pronoun", label: "Possessive (pron)" },
      { collection: "grammar:reflexive-pronoun", label: "Reflexive" },
      { collection: "grammar:reciprocal-pronoun", label: "Reciprocal" },
      { collection: "grammar:demonstrative-determiner", label: "Demonstrative (det)" },
      { collection: "grammar:demonstrative-pronoun", label: "Demonstrative (pron)" },
      { collection: "grammar:indefinite-pronoun", label: "Indefinite" },
      { collection: "grammar:interrogative-pronoun", label: "Interrogative" },
      { collection: "grammar:relative-pronoun", label: "Relative" },
      { collection: "grammar:exclamative", label: "Exclamative" },
      { collection: "grammar:subordinate-subject-pronoun", label: "él → him" },
      { collection: "contrast:confusable", label: "Confusions" },
    ],
  },
  {
    slug: "determiners",
    title: "Determiners",
    description:
      "Everything that can stand where “the” does in front of a noun — articles, demonstratives, possessives, quantifiers, and numbers. Click a Spanish or English chip to trace one form.",
    baseCollection: "topic:determiner",
    facetButtons: [
      { collection: "grammar:definite-article", label: "Definite article" },
      { collection: "grammar:indefinite-article", label: "Indefinite article" },
      { collection: "grammar:demonstrative-determiner", label: "Demonstrative" },
      { collection: "grammar:possessive-determiner", label: "Possessive" },
      { collection: "grammar:quantifier", label: "Quantifier" },
      { collection: "grammar:cardinal-number", label: "Number" },
      { collection: "grammar:interrogative-determiner", label: "Interrogative" },
      { collection: "grammar:relative-determiner", label: "Relative (cuyo)" },
      { collection: "grammar:negative", label: "Negative (ningún)" },
      { collection: "contrast:confusable", label: "Confusions" },
    ],
  },
  {
    slug: "interrogatives",
    title: "Interrogatives",
    description:
      "The question words — qué, quién, cuál, cuándo, dónde, cómo, cuánto, por qué — as pronouns, determiners, and adverbs. Click a chip to trace one form.",
    baseCollection: "topic:interrogative",
    facetButtons: [
      { collection: "grammar:interrogative-pronoun", label: "Pronoun" },
      { collection: "grammar:interrogative-determiner", label: "Determiner" },
      { collection: "grammar:interrogative-adverb", label: "Adverb" },
      { collection: "contrast:confusable", label: "Confusions" },
    ],
  },
  {
    slug: "verbs",
    title: "Verbs",
    description:
      "Regular verbs stay infinitive-only — conjugation is a rule, not vocabulary. This is the short list of suppletive/irregular verbs whose conjugated forms don't resemble the infinitive: ser and estar (both “to be”), ir (“to go” / going-to), tener (“to have”), haber (“to have done”).",
    baseCollection: "pos:verb",
    facetButtons: [
      { collection: "es:ser", label: "ser (to be)" },
      { collection: "es:estar", label: "estar (to be)" },
      { collection: "es:ir", label: "ir (to go / going to)" },
      { collection: "es:tener", label: "tener (to have)" },
      { collection: "es:haber", label: "haber (have done)" },
      { collection: "conjugation:1sg", label: "I (yo)" },
      { collection: "conjugation:3sg", label: "he / she / it" },
      { collection: "contrast:confusable", label: "Confusions" },
    ],
  },
];

export function findCurriculumTopic(slug: string): CurriculumTopic | undefined {
  return CURRICULUM_TOPICS.find((topic) => topic.slug === slug);
}
