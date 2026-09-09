import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const cognatesTopic: CurriculumTopic = {
  slug: "cognates",
  title: "Cognates",
  description:
    "Words that share a Spanish/English root, grouped by the transformation trick that gets you from one to the other — spelling suffixes (-ción → -tion), Latin roots that don't share a spelling (tener → contain), and false friends that look related but aren't.",
  baseCollection: "topic:cognate",
  facetButtons: [
    {
      collection: "cognate:izar-to-ize",
      label: "-izar → -ize",
      family: "-ar verb cognates (preparAR → prepare)",
    },
    {
      collection: "cognate:ar-to-ate",
      label: "-ar → -ate",
      family: "-ar verb cognates (preparAR → prepare)",
    },
    {
      collection: "cognate:ificar-to-ify",
      label: "-ificar → -ify",
      family: "-ar verb cognates (preparAR → prepare)",
    },
    {
      collection: "cognate:inar-to-ine",
      label: "-inar → -ine",
      family: "-ar verb cognates (preparAR → prepare)",
    },
    {
      collection: "cognate:servar-to-serve",
      label: "servar → -serve",
      family: "-ar verb cognates (preparAR → prepare)",
    },
    {
      collection: "cognate:plicar-to-ply",
      label: "plicar → -ply",
      family: "-ar verb cognates (preparAR → prepare)",
    },
    {
      collection: "cognate:tener-to-tain",
      label: "tener → -tain",
      family: "-er verb cognates (defendER → defend)",
    },
    {
      collection: "cognate:poner-to-pose",
      label: "poner → -pose",
      family: "-er verb cognates (defendER → defend)",
    },
    {
      collection: "cognate:traer-to-tract",
      label: "traer → -tract",
      family: "-er verb cognates (defendER → defend)",
    },
    {
      collection: "cognate:ceder-to-cede",
      label: "ceder → -cede",
      family: "-er verb cognates (defendER → defend)",
    },
    {
      collection: "cognate:solver-to-solve",
      label: "solver → -solve",
      family: "-er verb cognates (defendER → defend)",
    },
    {
      collection: "cognate:hender-to-hend",
      label: "hender/prender → -hend",
      family: "-er verb cognates (defendER → defend)",
    },
    {
      collection: "cognate:ir-to-silent-e",
      label: "-ir → silent -e",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:mitir-to-mit",
      label: "mitir/meter → -mit",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:ferir-to-fer",
      label: "ferir/frir → -fer",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:ducir-to-duce",
      label: "ducir → -duce",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:tribuir-to-tribute",
      label: "tribuir → -tribute",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:struir-to-struct",
      label: "struir → -struct",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:escribir-to-scribe",
      label: "escribir → -scribe",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:cluir-to-clude",
      label: "cluir → -clude",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:decir-to-dict",
      label: "decir → -dict",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:primir-to-press",
      label: "primir/presar → -press",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:vertir-to-vert",
      label: "vertir → -vert",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:gerir-to-gest",
      label: "gerir → -gest",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:hibir-to-hibit",
      label: "hibir → -hibit",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:cibir-to-ceive",
      label: "cibir → -ceive",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:currir-to-cur",
      label: "currir → -cur",
      family: "-ir verb cognates (decidIR → decide)",
    },
    {
      collection: "cognate:anza-to-ance",
      label: "-anza → -ance",
      family: "Noun cognates",
    },
    {
      collection: "cognate:arte-to-art",
      label: "-arte → -art",
      family: "Noun cognates",
    },
    {
      collection: "cognate:cion-to-tion",
      label: "-ción → -tion",
      family: "Noun cognates",
    },
    {
      collection: "cognate:dad-to-ty",
      label: "-dad → -ty",
      family: "Noun cognates",
    },
    {
      collection: "cognate:ecto-to-ect",
      label: "-ecto → -ect",
      family: "Noun cognates",
    },
    {
      collection: "cognate:el-to-el",
      label: "-el → -el",
      family: "Noun cognates",
    },
    {
      collection: "cognate:es-to-s",
      label: "-es → -s",
      family: "Noun cognates",
    },
    {
      collection: "cognate:icto-to-ict",
      label: "-icto → -ict",
      family: "Noun cognates",
    },
    {
      collection: "cognate:ma-to-m",
      label: "-ma → -m",
      family: "Noun cognates",
    },
    {
      collection: "cognate:sion-to-sion",
      label: "-sión → -sion",
      family: "Noun cognates",
    },
    {
      collection: "cognate:sis-to-sis",
      label: "-sis → -sis",
      family: "Noun cognates",
    },
    {
      collection: "cognate:tud-to-tude",
      label: "-tud → -tude",
      family: "Noun cognates",
    },
    {
      collection: "cognate:uro-ura-to-ure",
      label: "-uro/-ura → -ure",
      family: "Noun cognates",
    },
    {
      collection: "topic:cognate-encia-ancia",
      label: "-encia/-ancia → -ence/-ance",
      family: "Noun cognates",
    },
    {
      collection: "cognate:ia-to-y",
      label: "-ia → -y",
      family: "Noun cognates",
    },
    {
      collection: "cognate:mento-miento-to-ment",
      label: "-mento/-miento → -ment",
      family: "Noun cognates",
    },
    {
      collection: "cognate:ista-to-ist",
      label: "-ista → -ist",
      family: "Noun cognates",
    },
    {
      collection: "cognate:ismo-to-ism",
      label: "-ismo → -ism",
      family: "Noun cognates",
    },
    {
      collection: "cognate:ema-to-em",
      label: "-ema → -em",
      family: "Noun cognates",
    },
    {
      collection: "cognate:able-to-able",
      label: "-able → -able",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:acto-to-act",
      label: "-acto → -act",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:al-to-al",
      label: "-al → -al",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ante-to-ant",
      label: "-ante → -ant",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ar-to-ar",
      label: "-ar → -ar",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ario-to-ary",
      label: "-ario → -ary",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ente-to-ent",
      label: "-ente → -ent",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ible-to-ible",
      label: "-ible → -ible",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ico-to-ic",
      label: "-ico → -ic",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ido-to-id",
      label: "-ido → -id",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:il-to-ile",
      label: "-il → -ile",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ivo-to-ive",
      label: "-ivo → -ive",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:orio-to-ory",
      label: "-orio → -ory",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:oso-to-ous",
      label: "-oso → -ous",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ano-iano-to-an-ian",
      label: "-ano/-iano → -an/-ian",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:ico-to-ical",
      label: "-ico → -ical",
      family: "Adjective cognates",
    },
    {
      collection: "cognate:mente-to-ly",
      label: "-mente → -ly",
      family: "Adverb cognates",
    },
    {
      collection: "cognate:ando-to-ing",
      label: "-ando → -ing",
      family: "Verb form endings",
    },
    {
      collection: "cognate:dido-to-ded",
      label: "-dido → -ded",
      family: "Verb form endings",
    },
    {
      collection: "cognate:iendo-to-ing",
      label: "-iendo → -ing",
      family: "Verb form endings",
    },
    {
      collection: "cognate:ado-ido-to-ed",
      label: "-ado/-ido → -ed",
      family: "Verb form endings",
    },
    {
      collection: "topic:cognate-transparent",
      label: "Identical / transparent",
      family: "How close is it?",
    },
    {
      collection: "topic:cognate-opaque",
      label: "Looks different",
      family: "How close is it?",
    },
    {
      collection: "cognate:false-friend",
      label: "False friends",
      family: "How close is it?",
    },
    {
      collection: "topic:cognate-latin-root",
      label: "Latin roots (any)",
      family: "Latin roots — not yet sorted by stem",
    },
    // Spelling-suffix families.
    // Latin-root families (spelling doesn't match; grouped by verb stem).
  ],
};
