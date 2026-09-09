import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const nounsTopic: CurriculumTopic = {
  slug: "nouns",
  title: "Nouns",
  description:
    "Every noun, with its article bracketed to show gender — [la] mesa, [el] hombre, [el/la] estudiante — plus a subject-matter theme so you can browse by topic instead of alphabetically.",
  baseCollection: "pos:noun",
  facetButtons: [
    {
      collection: "topic:masc-o",
      label: "el, -o",
      family: "Articles & gender",
    },
    {
      collection: "topic:masc-consonant",
      label: "el, consonant",
      family: "Articles & gender",
    },
    {
      collection: "topic:masc-e",
      label: "el, -e",
      family: "Articles & gender",
    },
    {
      collection: "topic:masc-exceptions",
      label: "el, exceptions to -o",
      family: "Articles & gender",
    },
    {
      collection: "topic:fem-a",
      label: "la, -a",
      family: "Articles & gender",
    },
    {
      collection: "topic:fem-abstract-suffix",
      label: "la, -dad/-ción/-sión",
      family: "Articles & gender",
    },
    {
      collection: "topic:fem-consonant",
      label: "la, consonant",
      family: "Articles & gender",
    },
    {
      collection: "topic:fem-exceptions",
      label: "la, exceptions to -a",
      family: "Articles & gender",
    },
    {
      collection: "topic:common-gender-professions",
      label: "el/la, -ista professions",
      family: "Articles & gender",
    },
    {
      collection: "topic:common-gender-other-roles",
      label: "el/la, other roles",
      family: "Articles & gender",
    },
    {
      collection: "gender:invariant",
      label: "No article / neuter lo",
      family: "Articles & gender",
    },
    {
      collection: "topic:family-immediate",
      label: "Family — Immediate",
      family: "People & family",
    },
    {
      collection: "topic:family-extended",
      label: "Family — Extended",
      family: "People & family",
    },
    {
      collection: "topic:family-groups-terms",
      label: "Family — Groups & Terms",
      family: "People & family",
    },
    {
      collection: "topic:people-professions",
      label: "People — Professions & Roles",
      family: "People & family",
    },
    {
      collection: "topic:people-general",
      label: "People — General & Groups",
      family: "People & family",
    },
    {
      collection: "topic:places-home-buildings",
      label: "Home & Buildings",
      family: "Places",
    },
    {
      collection: "topic:places-public-city",
      label: "Public & City",
      family: "Places",
    },
    {
      collection: "topic:noun-time-months",
      label: "Months",
      family: "Time & calendar",
    },
    {
      collection: "topic:noun-time-days-periods",
      label: "Days & Periods",
      family: "Time & calendar",
    },
    {
      collection: "topic:calendar",
      label: "Calendar & Relative Time",
      family: "Time & calendar",
    },
    { collection: "topic:education", label: "Education", family: "Domains" },
    {
      collection: "topic:business-work",
      label: "Work & Employment",
      family: "Domains",
    },
    {
      collection: "topic:money-business",
      label: "Money & Finance",
      family: "Domains",
    },
    {
      collection: "topic:objects-money-business",
      label: "Business & Commerce",
      family: "Domains",
    },
    { collection: "topic:food", label: "Food", family: "Domains" },
    {
      collection: "topic:technology",
      label: "Technology",
      family: "Domains",
    },
    { collection: "topic:health", label: "Health", family: "Domains" },
    {
      collection: "topic:body-parts",
      label: "Body parts",
      family: "Domains",
    },
    { collection: "topic:clothing", label: "Clothing", family: "Domains" },
    {
      collection: "topic:government-politics",
      label: "Government & Politics",
      family: "Domains",
    },
    {
      collection: "topic:crime-law",
      label: "Crime & Law",
      family: "Domains",
    },
    {
      collection: "topic:art-culture",
      label: "Art & Culture",
      family: "Domains",
    },
    {
      collection: "topic:communication-request",
      label: "Communication & Requests",
      family: "Domains",
    },
    {
      collection: "topic:sports-recreation",
      label: "Sports & Travel",
      family: "Domains",
    },
    { collection: "topic:event", label: "Events", family: "Domains" },
    {
      collection: "topic:objects-physical",
      label: "Physical Items",
      family: "Objects & things",
    },
    {
      collection: "topic:objects-communication-media",
      label: "Communication & Media Objects",
      family: "Objects & things",
    },
    {
      collection: "topic:objects-misc-language",
      label: "Misc & Language",
      family: "Objects & things",
    },
    {
      collection: "topic:abstract-encia-ancia",
      label: "Abstract — -encia/-ancia",
      family: "Abstract nouns by suffix",
    },
    {
      collection: "topic:abstract-cion-sion",
      label: "Abstract — -ción/-sión",
      family: "Abstract nouns by suffix",
    },
    {
      collection: "topic:abstract-dad-tud",
      label: "Abstract — -dad/-tud",
      family: "Abstract nouns by suffix",
    },
    {
      collection: "topic:abstract-mento-miento",
      label: "Abstract — -mento/-miento",
      family: "Abstract nouns by suffix",
    },
    {
      collection: "topic:abstract-ismo-and-misc",
      label: "Abstract — -ismo & misc",
      family: "Abstract nouns by suffix",
    },
    {
      collection: "topic:abstract-general",
      label: "Other abstract nouns",
      family: "Other abstract nouns",
    },
  ],
};
