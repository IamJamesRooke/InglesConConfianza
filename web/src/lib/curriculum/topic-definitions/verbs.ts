import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const verbsTopic: CurriculumTopic = {
  slug: "verbs",
  title: "Verbs",
  description:
    "Plain, everyday verbs grouped by theme instead of alphabetically — communication, thinking, movement, possession, money, and more — so you can browse them the way you'd actually reach for them in conversation. The copula/modal machinery (to be, to have, can, must) lives on the Special Verbs page; cognate verbs on Cognates; phrasal verbs on the two Phrasal Verbs pages.",
  baseCollection: "pos:verb",
  // The Verbs page is plain lexical verbs only. Three unconditional
  // exclusions send the rest to their own pages: `topic:verb-system` (ser /
  // estar / haber / hay / modals) -> Special Verbs; `topic:cognate` ->
  // Cognates (by spelling pattern); `topic:phrasal-verb` -> the two Phrasal
  // Verbs pages (by root, by particle).
  baseExclusions: [
    { collection: "topic:verb-system", unlessRole: [] },
    { collection: "topic:cognate", unlessRole: [] },
    { collection: "topic:phrasal-verb", unlessRole: [] },
  ],
  facetButtons: [
    // Communication
    { collection: "topic:verb-communication-talking", label: "Talking", family: "Communication" },
    { collection: "topic:verb-communication-saying", label: "Saying & Telling", family: "Communication" },
    { collection: "topic:verb-communication-other", label: "Informing & Reporting", family: "Communication" },
    { collection: "topic:verb-communication-naming", label: "Naming & Calling", family: "Communication" },
    { collection: "topic:verb-asking-requesting", label: "Asking & Requesting", family: "Communication" },
    // Thinking & knowing
    { collection: "topic:verb-thinking-opinions", label: "Thinking & Opinions", family: "Thinking & knowing" },
    { collection: "topic:verb-deciding-considering", label: "Deciding & Considering", family: "Thinking & knowing" },
    { collection: "topic:verb-knowing", label: "Knowing", family: "Thinking & knowing" },
    { collection: "topic:verb-learning-teaching", label: "Learning & Teaching", family: "Thinking & knowing" },
    { collection: "topic:verb-remembering-forgetting", label: "Remembering & Forgetting", family: "Thinking & knowing" },
    // Perception & feelings
    { collection: "topic:verb-seeing-ver", label: "Seeing", family: "Perception & feelings" },
    { collection: "topic:verb-watching-other", label: "Watching & Observing", family: "Perception & feelings" },
    { collection: "topic:verb-perception-hearing", label: "Hearing & Listening", family: "Perception & feelings" },
    { collection: "topic:verb-feelings-general", label: "Feelings & Sensations", family: "Perception & feelings" },
    { collection: "topic:verb-feelings-love-like", label: "Love & Liking", family: "Perception & feelings" },
    { collection: "topic:verb-feelings-dislike-worry", label: "Dislike, Worry & Missing", family: "Perception & feelings" },
    // Movement
    { collection: "topic:verb-movement-going", label: "Going & Coming", family: "Movement" },
    { collection: "topic:verb-movement-arriving-passing", label: "Arriving & Passing", family: "Movement" },
    { collection: "topic:verb-movement-leaving", label: "Leaving", family: "Movement" },
    { collection: "topic:verb-movement-directional", label: "Direction — Up, Down & Back", family: "Movement" },
    { collection: "topic:verb-locomotion-general", label: "Walking & Running", family: "Movement" },
    { collection: "topic:verb-following-continuing", label: "Following & Continuing", family: "Movement" },
    // Possession & transfer
    { collection: "topic:verb-possession-having", label: "Having (tener)", family: "Possession & transfer" },
    { collection: "topic:verb-possession-obtaining", label: "Getting & Obtaining", family: "Possession & transfer" },
    { collection: "topic:verb-tomar-general", label: "Taking (tomar)", family: "Possession & transfer" },
    { collection: "topic:verb-dar-giving", label: "Giving (dar)", family: "Possession & transfer" },
    { collection: "topic:verb-dar-idioms", label: "Giving (dar) — Idioms", family: "Possession & transfer" },
    { collection: "topic:verb-giving-lending-other", label: "Giving & Lending — Other Verbs", family: "Possession & transfer" },
    { collection: "topic:verb-offering", label: "Offering & Providing", family: "Possession & transfer" },
    { collection: "topic:verb-taking-removing", label: "Taking Away", family: "Possession & transfer" },
    { collection: "topic:verb-keeping-storing", label: "Keeping & Storing", family: "Possession & transfer" },
    { collection: "topic:verb-carrying", label: "Carrying", family: "Possession & transfer" },
    { collection: "topic:verb-bringing", label: "Bringing", family: "Possession & transfer" },
    // Daily life & money
    { collection: "topic:verb-eating-drinking", label: "Eating & Drinking", family: "Daily life & money" },
    { collection: "topic:verb-daily-routine", label: "Daily Routine & Self-care", family: "Daily life & money" },
    { collection: "topic:verb-work-employment", label: "Work & Employment", family: "Daily life & money" },
    { collection: "topic:verb-money-earning-spending", label: "Money — Earning & Spending", family: "Daily life & money" },
    { collection: "topic:verb-money-commerce", label: "Money — Buying & Selling", family: "Daily life & money" },
    // Making, changing & home
    { collection: "topic:verb-creation-hacer", label: "Making & Doing (hacer)", family: "Making, changing & home" },
    { collection: "topic:verb-creation-repair-other", label: "Creating, Fixing & Changing", family: "Making, changing & home" },
    { collection: "topic:verb-poner-idioms", label: "Placing & Setting (poner)", family: "Making, changing & home" },
    { collection: "topic:verb-household", label: "Household & Objects", family: "Making, changing & home" },
    { collection: "topic:verb-health-body", label: "Body & Health", family: "Making, changing & home" },
    // Social life
    { collection: "topic:verb-social-relationships", label: "Relationships", family: "Social life" },
    { collection: "topic:verb-conflict-crime", label: "Conflict & Crime", family: "Social life" },
    { collection: "topic:verb-loss-death", label: "Loss & Death", family: "Social life" },
    { collection: "topic:verb-admin-legal-formal", label: "Administrative, Legal & Formal", family: "Social life" },
    // Wanting, needing & hoping
    { collection: "topic:verb-wishes", label: "Wishes & Hypotheticals", family: "Wanting, needing & hoping" },
    { collection: "topic:verb-hoping-waiting", label: "Hoping & Waiting", family: "Wanting, needing & hoping" },
    { collection: "topic:verb-depending-fitting", label: "Needing, Depending & Fitting", family: "Wanting, needing & hoping" },
    { collection: "topic:verb-weather-time-duration", label: "Weather, Time & Duration", family: "Wanting, needing & hoping" },
  ],
};
