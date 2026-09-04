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
  {
    slug: "cognates",
    title: "Cognates",
    description:
      "Words that share a Spanish/English root, grouped by the transformation trick that gets you from one to the other — spelling suffixes (-ción → -tion), Latin roots that don't share a spelling (tener → contain), and false friends that look related but aren't.",
    baseCollection: "topic:cognate",
    facetButtons: [
      { collection: "cognate:transparent", label: "Identical / transparent" },
      { collection: "cognate:opaque-gloss", label: "Looks different" },
      { collection: "cognate:false-friend", label: "False friends" },
      // Spelling-suffix families.
      { collection: "cognate:able-to-able", label: "-able → -able" },
      { collection: "cognate:acto-to-act", label: "-acto → -act" },
      { collection: "cognate:al-to-al", label: "-al → -al" },
      { collection: "cognate:ando-to-ing", label: "-ando → -ing" },
      { collection: "cognate:ante-to-ant", label: "-ante → -ant" },
      { collection: "cognate:anza-to-ance", label: "-anza → -ance" },
      { collection: "cognate:ar-to-ar", label: "-ar → -ar" },
      { collection: "cognate:ario-to-ary", label: "-ario → -ary" },
      { collection: "cognate:arte-to-art", label: "-arte → -art" },
      { collection: "cognate:cion-to-tion", label: "-ción → -tion" },
      { collection: "cognate:dad-to-ty", label: "-dad → -ty" },
      { collection: "cognate:dido-to-ded", label: "-dido → -ded" },
      { collection: "cognate:ecto-to-ect", label: "-ecto → -ect" },
      { collection: "cognate:el-to-el", label: "-el → -el" },
      { collection: "cognate:ente-to-ent", label: "-ente → -ent" },
      { collection: "cognate:es-to-s", label: "-es → -s" },
      { collection: "cognate:ible-to-ible", label: "-ible → -ible" },
      { collection: "cognate:ico-to-ic", label: "-ico → -ic" },
      { collection: "cognate:icto-to-ict", label: "-icto → -ict" },
      { collection: "cognate:ido-to-id", label: "-ido → -id" },
      { collection: "cognate:iendo-to-ing", label: "-iendo → -ing" },
      { collection: "cognate:il-to-ile", label: "-il → -ile" },
      { collection: "cognate:ivo-to-ive", label: "-ivo → -ive" },
      { collection: "cognate:ma-to-m", label: "-ma → -m" },
      { collection: "cognate:mente-to-ly", label: "-mente → -ly" },
      { collection: "cognate:orio-to-ory", label: "-orio → -ory" },
      { collection: "cognate:oso-to-ous", label: "-oso → -ous" },
      { collection: "cognate:sion-to-sion", label: "-sión → -sion" },
      { collection: "cognate:sis-to-sis", label: "-sis → -sis" },
      { collection: "cognate:tud-to-tude", label: "-tud → -tude" },
      { collection: "cognate:uro-ura-to-ure", label: "-uro/-ura → -ure" },
      // Latin-root families (spelling doesn't match; grouped by verb stem).
      { collection: "cognate:latin-root", label: "Latin roots (any)" },
      { collection: "cognate:tener-to-tain", label: "tener → -tain" },
      { collection: "cognate:poner-to-pose", label: "poner → -pose" },
      { collection: "cognate:mitir-to-mit", label: "mitir/meter → -mit" },
      { collection: "cognate:ferir-to-fer", label: "ferir/frir → -fer" },
      { collection: "cognate:ducir-to-duce", label: "ducir → -duce" },
      { collection: "cognate:tribuir-to-tribute", label: "tribuir → -tribute" },
      { collection: "cognate:struir-to-struct", label: "struir → -struct" },
      { collection: "cognate:traer-to-tract", label: "traer → -tract" },
      { collection: "cognate:escribir-to-scribe", label: "escribir → -scribe" },
      { collection: "cognate:cluir-to-clude", label: "cluir → -clude" },
      { collection: "cognate:decir-to-dict", label: "decir → -dict" },
      { collection: "cognate:ceder-to-cede", label: "ceder → -cede" },
      { collection: "cognate:primir-to-press", label: "primir/presar → -press" },
      { collection: "cognate:vertir-to-vert", label: "vertir → -vert" },
      { collection: "cognate:servar-to-serve", label: "servar → -serve" },
      { collection: "cognate:solver-to-solve", label: "solver → -solve" },
      { collection: "cognate:gerir-to-gest", label: "gerir → -gest" },
      { collection: "cognate:hibir-to-hibit", label: "hibir → -hibit" },
      { collection: "cognate:cibir-to-ceive", label: "cibir → -ceive" },
      { collection: "cognate:plicar-to-ply", label: "plicar → -ply" },
      { collection: "cognate:currir-to-cur", label: "currir → -cur" },
      { collection: "cognate:hender-to-hend", label: "hender/prender → -hend" },
      { collection: "contrast:confusable", label: "Confusions" },
    ],
  },
];

export function findCurriculumTopic(slug: string): CurriculumTopic | undefined {
  return CURRICULUM_TOPICS.find((topic) => topic.slug === slug);
}
