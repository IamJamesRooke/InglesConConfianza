export { facetGroup } from "@/lib/curriculum/navigation";

// Display copy only. Collection names and topic slugs remain canonical.
export const topicTitles: Record<string, string> = {
  mappings: "Spanish → English",
  "en-mappings": "English → Spanish",
  "phrasal-verbs-by-root": "Phrasal verbs · verb",
  "phrasal-verbs-by-particle": "Phrasal verbs · particle",
  "verb-forms": "Past forms",
  "verb-patterns": "Verb patterns",
  "questions-negation": "Questions & negatives",
  imperatives: "Commands",
  expressions: "Everyday expressions",
};

export const topicDescriptions: Record<string, string> = {
  cognates:
    "Explore shared roots, spelling patterns, and false friends across Spanish and English.",
  "verb-forms":
    "Explore regular endings and irregular past forms by sound pattern.",
  "verb-patterns": "See how verbs combine with the words that follow them.",
  mappings: "Choose a Spanish word to explore its English meanings in context.",
  "en-mappings":
    "Choose an English word to explore its Spanish meanings in context.",
  "phrasal-verbs-by-root":
    "Choose a verb to explore its combinations with particles.",
  "phrasal-verbs-by-particle":
    "Choose a particle to explore the phrasal verbs that use it.",
};

const shortLabels: Record<string, string> = {
  "contrast:confusable": "Common confusions",
  "grammar:ser-adjective": "ser + adjective",
  "grammar:estar-adjective": "estar + adjective",
  "grammar:tener-adjective": "tener expressions",
  "gender:masculine": "el · masculine",
  "gender:feminine": "la · feminine",
  "gender:common": "el / la · common",
  "gender:neuter": "lo · neuter",
  "adv:possibility": "Possibility",
  "adv:degree": "Degree & approximation",
  "adv:habitual": "Habitual actions",
  "grammar:addition": "also / either",
  "grammar:possessive-determiner": "Possessive determiners",
  "grammar:possessive-pronoun": "Possessive pronouns",
  "grammar:demonstrative-determiner": "Demonstrative determiners",
  "grammar:demonstrative-pronoun": "Demonstrative pronouns",
  "cognate:transparent": "Transparent cognates",
  "cognate:opaque-gloss": "Different English word",
  "cognate:false-friend": "False friends",
  "cognate:latin-root": "All Latin roots",
  "qn:do-support-negation": "don't · doesn't · didn't",
  "qn:modal-be-have-negation": "can't · isn't · haven't",
  "qn:do-support-question": "Do you…?",
  "qn:inversion-question": "Can you…? · Are you…?",
  "qn:negative-question": "Don't you…? · Isn't it…?",
  "qn:emphatic": "I DO like it",
  "imp:affirmative-informal": "Tú commands",
  "imp:affirmative-formal": "Usted / ustedes commands",
  "imp:negative": "Don't…",
  "imp:lets": "Let's…",
  "coll:make": "make",
  "coll:take": "take",
  "coll:have": "have",
  "coll:set": "set",
  "coll:other": "Other verbs",
  "sound:regular-past-pronounced-d": "played · /d/",
  "sound:regular-past-pronounced-t": "watched · /t/",
  "sound:regular-past-pronounced-id": "wanted · /ɪd/",
  "sound:cut-hit-hurt-put-set-shut": "cut → cut",
  "sound:run-come-become": "come → come",
  "sound:reviewed": "Unique patterns",
  "construction:followed-by-full-infinitive": "want to go",
  "construction:followed-by-bare-infinitive": "let him go",
  "construction:followed-by-gerund": "enjoy going",
  "construction:allows-full-infinitive-or-gerund": "start to go / start going",
  "construction:allows-bare-infinitive-or-present-participle":
    "saw him go / going",
  "construction:allows-full-infinitive-or-bare-infinitive":
    "help him go / to go",
  "construction:somebody-bare-infinitive": "make her go",
  "construction:somebody-doing-something": "caught him going",
  "construction:have-something-done": "have something done",
  "construction:get-something-done": "get something done",
  "construction:preposition-plus-gerund": "before going",
  "construction:go-ing": "go shopping",
  "construction:be-present-participle": "be going",
  "construction:auxiliary-do": "did they go?",
  "construction:double-object": "give somebody something",
  "construction:object-plus-complement": "expect somebody to go",
  "grammar:passive": "something is needed",
  "grammar:going-to": "going to · future",
};

export function presentFacet(facet: { collection: string; label: string }) {
  const { collection, label } = facet;
  if (
    collection === "degree:comparative-er" ||
    collection === "degree:superlative-est"
  ) {
    const ending = collection === "degree:comparative-er" ? "er" : "est";
    return {
      label: `hard${ending}`,
      before: "hard",
      emphasis: ending,
      after: "",
      description: label,
    };
  }
  const affix = collection.match(/^morphology:(suffix|prefix)-(.+)$/u);
  const example = label.match(/\([^()]*→\s*([^()]+)\)$/u);
  if (affix && example) {
    const word = example[1].trim().replace(/^(the|to) /u, "");
    const ending = affix[2]
      .split("-")
      .find((part) =>
        affix[1] === "suffix" ? word.endsWith(part) : word.startsWith(part),
      );
    if (ending) {
      const start = affix[1] === "suffix" ? word.length - ending.length : 0;
      return {
        label: word,
        before: word.slice(0, start),
        emphasis: ending,
        after: word.slice(start + ending.length),
        description: label,
      };
    }
  }
  const compact = shortLabels[collection] ?? label;
  return {
    label: compact,
    before: compact,
    emphasis: "",
    after: "",
    description: label,
  };
}
