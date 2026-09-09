import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const collocationsTopic: CurriculumTopic = {
  slug: "collocations",
  title: "Collocations",
  description:
    'Which "light" verb goes with which noun is arbitrary in English — you make a decision but take a risk, have a good time but set a goal — and Spanish carves it up completely differently (hacer, tomar, tener, poner all overlap in ways that don\'t map word-for-word). These have to be memorized as pairs, not built from the parts.',
  baseCollection: "topic:collocation",
  facetButtons: [
    {
      collection: "coll:make",
      label: "make (a decision, an effort, a call)",
      family: "Verb groups",
    },
    {
      collection: "coll:take",
      label: "take (a photo, a risk, a look)",
      family: "Verb groups",
    },
    {
      collection: "coll:have",
      label: "have (a good time, a hard time)",
      family: "Verb groups",
    },
    {
      collection: "coll:set",
      label: "set (an alarm, a goal, the table)",
      family: "Verb groups",
    },
    {
      collection: "coll:other",
      label: "give, tell, pay, hold, break, keep, catch...",
      family: "Verb groups",
    },
  ],
};
