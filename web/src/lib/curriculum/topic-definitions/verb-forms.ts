import type { CurriculumTopic } from "@/lib/curriculum/topic-types";

export const verbFormsTopic: CurriculumTopic = {
  slug: "verb-forms",
  title: "Past-Tense & Past-Participle Formation",
  description:
    "How English builds its past forms, grouped by sound — regular verbs split by their -ed pronunciation (played /d/, watched /t/, wanted /ɪd/), irregular verbs grouped by rhyming pattern (tell → told, sell → sold; sing → sang → sung; drink → drank → drunk). Click a pill to drill one pattern instead of memorizing verbs one at a time.",
  baseCollection: "topic:verb-form",
  facetButtons: [
    {
      collection: "topic:vf-past-d",
      label: "regular /d/ (played)",
      family: "Regular endings",
    },
    {
      collection: "sound:regular-past-pronounced-t",
      label: "regular /t/ (watched)",
      family: "Regular endings",
    },
    {
      collection: "sound:regular-past-pronounced-id",
      label: "regular /ɪd/ (wanted)",
      family: "Regular endings",
    },
    {
      collection: "topic:vf-cut-hit-hurt",
      label: "unchanged (cut)",
      family: "Irregular patterns",
    },
    {
      collection: "sound:sent-bent-lent-spent",
      label: "send → sent",
      family: "Irregular patterns",
    },
    {
      collection: "sound:kept-slept-swept",
      label: "keep → kept",
      family: "Irregular patterns",
    },
    {
      collection: "sound:felt-dealt-knelt",
      label: "feel → felt",
      family: "Irregular patterns",
    },
    {
      collection: "sound:fed-bled-led",
      label: "feed → fed",
      family: "Irregular patterns",
    },
    {
      collection: "sound:found-bound-ground-wound",
      label: "find → found",
      family: "Irregular patterns",
    },
    {
      collection: "sound:bought-thought-taught",
      label: "buy → bought",
      family: "Irregular patterns",
    },
    {
      collection: "sound:sold-told",
      label: "sell → sold",
      family: "Irregular patterns",
    },
    {
      collection: "sound:built-gilt-spilt",
      label: "build → built",
      family: "Irregular patterns",
    },
    {
      collection: "sound:made-paid-laid",
      label: "make → made",
      family: "Irregular patterns",
    },
    {
      collection: "sound:held-beheld",
      label: "hold → held",
      family: "Irregular patterns",
    },
    {
      collection: "sound:stood-understood",
      label: "stand → stood",
      family: "Irregular patterns",
    },
    {
      collection: "sound:struck-stuck-snuck",
      label: "strike → struck",
      family: "Irregular patterns",
    },
    {
      collection: "sound:clung-flung-strung-stung-swung",
      label: "cling → clung",
      family: "Irregular patterns",
    },
    {
      collection: "sound:spun-won",
      label: "spin → spun",
      family: "Irregular patterns",
    },
    {
      collection: "sound:lit-bit",
      label: "light → lit",
      family: "Irregular patterns",
    },
    {
      collection: "sound:sat-spat",
      label: "sit → sat",
      family: "Irregular patterns",
    },
    {
      collection: "sound:got-forgot-shot",
      label: "get → got",
      family: "Irregular patterns",
    },
    {
      collection: "sound:began-rang-sang",
      label: "begin → began",
      family: "Irregular patterns",
    },
    {
      collection: "sound:begun-rung-sung",
      label: "begin → begun",
      family: "Irregular patterns",
    },
    {
      collection: "sound:drank-sank-shrank",
      label: "drink → drank",
      family: "Irregular patterns",
    },
    {
      collection: "sound:drunk-sunk-shrunk",
      label: "drink → drunk",
      family: "Irregular patterns",
    },
    {
      collection: "sound:did-hid-slid",
      label: "do → did",
      family: "Irregular patterns",
    },
    {
      collection: "sound:blew-grew-knew-threw-drew-flew",
      label: "blow → blew",
      family: "Irregular patterns",
    },
    {
      collection: "sound:known-grown-thrown",
      label: "know → known",
      family: "Irregular patterns",
    },
    {
      collection: "sound:drove-rode-strode-wove-throve",
      label: "drive → drove",
      family: "Irregular patterns",
    },
    {
      collection: "sound:driven-ridden-stridden",
      label: "drive → driven",
      family: "Irregular patterns",
    },
    {
      collection: "sound:spoke-broke-woke-awoke",
      label: "speak → spoke",
      family: "Irregular patterns",
    },
    {
      collection: "sound:spoken-broken-woken",
      label: "speak → spoken",
      family: "Irregular patterns",
    },
    {
      collection: "sound:took-shook",
      label: "take → took",
      family: "Irregular patterns",
    },
    {
      collection: "sound:taken-shaken-forsaken",
      label: "take → taken",
      family: "Irregular patterns",
    },
    {
      collection: "sound:chose-froze",
      label: "choose → chose",
      family: "Irregular patterns",
    },
    {
      collection: "sound:chosen-frozen",
      label: "choose → chosen",
      family: "Irregular patterns",
    },
    {
      collection: "sound:gave-forgave",
      label: "give → gave",
      family: "Irregular patterns",
    },
    {
      collection: "sound:given-forgiven",
      label: "give → given",
      family: "Irregular patterns",
    },
    {
      collection: "sound:gotten-forgotten",
      label: "get → gotten",
      family: "Irregular patterns",
    },
    {
      collection: "sound:hidden-written",
      label: "hide → hidden",
      family: "Irregular patterns",
    },
    {
      collection: "sound:rose-arose",
      label: "rise → rose",
      family: "Irregular patterns",
    },
    {
      collection: "sound:risen-arisen",
      label: "rise → risen",
      family: "Irregular patterns",
    },
    {
      collection: "sound:came-became",
      label: "come → came",
      family: "Irregular patterns",
    },
    {
      collection: "sound:run-come-become",
      label: "come (pp = base form)",
      family: "Irregular patterns",
    },
    {
      collection: "sound:done-gone",
      label: "do → done",
      family: "Irregular patterns",
    },
    {
      collection: "sound:tore-wore-swore",
      label: "tear → tore",
      family: "Irregular patterns",
    },
    {
      collection: "sound:sworn-torn-worn-drawn-born",
      label: "swear → sworn",
      family: "Irregular patterns",
    },
    {
      collection: "sound:eaten-beaten",
      label: "eat → eaten",
      family: "Irregular patterns",
    },
    {
      collection: "sound:stolen-swollen",
      label: "steal → stolen",
      family: "Irregular patterns",
    },
    {
      collection: "sound:proven-sewn-shaven",
      label: "prove → proven",
      family: "Irregular patterns",
    },
    {
      collection: "sound:forbidden-bidden-trodden",
      label: "forbid → forbidden",
      family: "Irregular patterns",
    },
    {
      collection: "sound:striven-thriven",
      label: "strive → striven",
      family: "Irregular patterns",
    },
    {
      collection: "topic:vf-oneoff",
      label: "one-off (no rhyme partner)",
      family: "Irregular patterns",
    },
  ],
};
