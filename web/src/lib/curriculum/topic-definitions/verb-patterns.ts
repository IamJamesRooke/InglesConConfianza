import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const verbPatternsTopic: CurriculumTopic = {
  slug: "verb-patterns",
  title: "Verb Patterns",
  description:
    "What comes after a verb: a bare infinitive (let him go), a full infinitive (want to go), a gerund (enjoy going), or either. English doesn't pick one by rule — each verb just takes what it takes, so this is memorized per verb, not derived from meaning.",
  baseCollection: "topic:verb-pattern",
  facetButtons: [
    {
      collection: "topic:vp-full-inf",
      label: "verb + to + infinitive (want to go)",
      family: "Sentence patterns",
    },
    {
      collection: "topic:vp-bare-inf",
      label: "verb + bare infinitive (let him go)",
      family: "Sentence patterns",
    },
    {
      collection: "topic:vp-gerund",
      label: "verb + gerund (enjoy going)",
      family: "Sentence patterns",
    },
    {
      collection: "construction:allows-full-infinitive-or-gerund",
      label: "either, same meaning (start to go / start going)",
      family: "Verb complements",
    },
    {
      collection: "construction:allows-bare-infinitive-or-present-participle",
      label: "perception verbs (saw him go / saw him going)",
      family: "Verb complements",
    },
    {
      collection: "construction:allows-full-infinitive-or-bare-infinitive",
      label: "help + either (help him go / help him to go)",
      family: "Verb complements",
    },
    {
      collection: "construction:somebody-bare-infinitive",
      label: "verb + somebody + bare infinitive (make her go)",
      family: "Verb complements",
    },
    {
      collection: "construction:somebody-doing-something",
      label: "verb + somebody + gerund (caught him going)",
      family: "Verb complements",
    },
    {
      collection: "construction:have-something-done",
      label: "have something done (causative)",
      family: "Verb complements",
    },
    {
      collection: "construction:get-something-done",
      label: "get something done (causative)",
      family: "Verb complements",
    },
    {
      collection: "construction:preposition-plus-gerund",
      label: "preposition + gerund (before going)",
      family: "Sentence patterns",
    },
    {
      collection: "construction:go-ing",
      label: "go + gerund (go shopping)",
      family: "Sentence patterns",
    },
    {
      collection: "construction:be-present-participle",
      label: "progressive (to be going)",
      family: "Tense & auxiliary patterns",
    },
    {
      collection: "construction:auxiliary-do",
      label: "auxiliary do (did they go?)",
      family: "Tense & auxiliary patterns",
    },
    {
      collection: "construction:double-object",
      label: "double object (give somebody something)",
      family: "Verb complements",
    },
    {
      collection: "topic:vp-obj-complement",
      label: "object + complement (make/expect somebody to go)",
      family: "Sentence patterns",
    },
    {
      collection: "grammar:passive",
      label: "passive (something is needed)",
      family: "Sentence patterns",
    },
    {
      collection: "grammar:going-to",
      label: "going to (future)",
      family: "Tense & auxiliary patterns",
    },
  ],
};
