import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const transformationsTopic: CurriculumTopic = {
  slug: "transformations",
  title: "Transformations",
  description:
    "One word, rebuilt into another part of speech by a suffix or prefix — power → powerful, power → powerless → powerlessness. Each pill is one transformation pattern; click it to see every word pair the catalog has for that pattern. Spanish/English cognate spelling patterns (-ción → -tion and the like) live on the Cognates page instead — this page is about English word-building alone.",
  baseCollection: "topic:transformation",
  facetButtons: [
    {
      collection: "morphology:suffix-ful",
      label: "-ful (power → powerful)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-less",
      label: "-less (thought → thoughtless)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ness",
      label: "-ness (aware → awareness)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-hood",
      label: "-hood (neighbor → neighborhood)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ship",
      label: "-ship (partner → partnership)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-dom",
      label: "-dom (bored → boredom)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-th",
      label: "-th (long → length)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ment",
      label: "-ment (agree → agreement)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-al",
      label: "-al (arrive → arrival)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-tion",
      label: "-tion (educate → education)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-sion",
      label: "-sion (decide → decision)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ity",
      label: "-ity (possible → possibility)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ing",
      label: "-ing (weaken → the weakening)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-er",
      label: "-er (whiten → the whitener)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-er-or",
      label: "-er/-or (survive → the survivor)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-able",
      label: "-able (accept → acceptable)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ible",
      label: "-ible (convert → convertible)",
      family: "Endings",
    },
    {
      collection: "topic:morph-ish",
      label: "-ish (tall → tallish)",
      family: "Word types",
    },
    {
      collection: "morphology:suffix-y",
      label: "-y (cloud → cloudy)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-en",
      label: "-en (weak → to weaken)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ern",
      label: "-ern (north → northern)",
      family: "Endings",
    },
    {
      collection: "topic:morph-ward",
      label: "-ward (in → inward)",
      family: "Word types",
    },
    {
      collection: "morphology:suffix-ly",
      label: "-ly (careful → carefully)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-ed",
      label: "-ed (weaken → weakened)",
      family: "Endings",
    },
    {
      collection: "morphology:suffix-most",
      label: "-most (lower → lowermost)",
      family: "Endings",
    },
    {
      collection: "morphology:prefix-common",
      label: "Common prefixes (un-, dis-, mis-, re-, over-, under-, fore-)",
      family: "Word types",
    },
    {
      collection: "topic:morph-noun-to-adj",
      label: "noun → adjective",
      family: "Word types",
    },
    {
      collection: "topic:morph-adj-to-noun",
      label: "adjective → noun",
      family: "Word types",
    },
    {
      collection: "topic:morph-verb-to-noun",
      label: "verb → noun",
      family: "Word types",
    },
    {
      collection: "morphology:noun-to-verb",
      label: "noun → verb",
      family: "Word types",
    },
    {
      collection: "morphology:verb-to-adjective",
      label: "verb → adjective",
      family: "Word types",
    },
    {
      collection: "morphology:adjective-to-verb",
      label: "adjective → verb",
      family: "Word types",
    },
    {
      collection: "morphology:adjective-to-adjective",
      label: "adjective → adjective",
      family: "Word types",
    },
    {
      collection: "morphology:verb-to-verb",
      label: "verb → verb (prefixed)",
      family: "Word types",
    },
    {
      collection: "topic:morph-noun-to-noun",
      label: "noun → noun",
      family: "Word types",
    },
    {
      collection: "morphology:expression-to-adjective",
      label: "expression → adjective",
      family: "Word types",
    },
    {
      collection: "morphology:number-to-expression",
      label: "number → expression",
      family: "Word types",
    },
  ],
};
