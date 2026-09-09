import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const specialVerbsTopic: CurriculumTopic = {
  slug: "special-verbs",
  title: "Special Verbs",
  description:
    "The grammatical verb machinery, kept separate from the thematic Verbs page because its English translations swing wildly by context: the two verbs for “to be” (ser and estar), “there is / there are” (hay), “to have” as the perfect auxiliary, and the modals (can, could, may, must, should, have to).",
  baseCollection: "topic:verb-system",
  facetButtons: [
    { collection: "topic:verb-ser-idioms", label: "To Be (ser) — Idioms & Uses", family: "To be & there is" },
    { collection: "topic:verb-estar-idioms", label: "To Be (estar) — Idioms & Uses", family: "To be & there is" },
    { collection: "topic:verb-tobe-present", label: "To Be — Conjugated Forms (am/is/are, was/were)", family: "To be & there is" },
    { collection: "topic:verb-tobe-existence-hay", label: "There Is / Are (hay)", family: "To be & there is" },
    { collection: "topic:verb-perfect-auxiliary", label: "Have — Perfect Auxiliary (have/has/had done)", family: "Modals & auxiliaries" },
    { collection: "topic:verb-modal-ability", label: "Can & Could — Ability & Permission", family: "Modals & auxiliaries" },
    { collection: "topic:verb-modal-possibility", label: "May & Might — Possibility", family: "Modals & auxiliaries" },
    { collection: "topic:verb-modal-obligation", label: "Must, Should & Have To — Obligation", family: "Modals & auxiliaries" },
  ],
};
