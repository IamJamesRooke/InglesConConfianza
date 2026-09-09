import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const questionsNegationTopic: CurriculumTopic = {
  slug: "questions-negation",
  title: "Questions & Negation",
  description:
    "English splits into two systems depending on the verb. Regular verbs borrow \"do\" (don't, doesn't, didn't) for both negation and questions. Modals and be/have negate and question by direct contraction or inversion instead — can't, isn't, haven't; Can you...?, Are you...?, Have you...? Negative questions and the emphatic \"I DO like it\" both ride on the same do-support system.",
  baseCollection: "topic:question-negation",
  facetButtons: [
    {
      collection: "qn:do-support-negation",
      label: "Negation — regular verbs (don't, doesn't, didn't)",
      family: "Question & negative patterns",
    },
    {
      collection: "qn:modal-be-have-negation",
      label: "Negation — modal/be/have (can't, isn't, haven't)",
      family: "Question & negative patterns",
    },
    {
      collection: "qn:do-support-question",
      label: "Questions — regular verbs (do, does, did)",
      family: "Question & negative patterns",
    },
    {
      collection: "qn:inversion-question",
      label: "Questions — modal/be/have (Can you...? Are you...?)",
      family: "Question & negative patterns",
    },
    {
      collection: "qn:negative-question",
      label: "Negative questions (Don't you...? Isn't it...?)",
      family: "Question & negative patterns",
    },
    {
      collection: "qn:emphatic",
      label: "Emphatic (I DO like it)",
      family: "Question & negative patterns",
    },
  ],
};
