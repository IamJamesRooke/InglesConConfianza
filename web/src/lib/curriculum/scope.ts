import type { CurriculumRole } from "@/lib/curriculum/types";

// A topic page's scope is normally just its `baseCollection`. A topic may also
// declare exclusions: material that carries the base tag but does not belong in
// that page's browser.
//
// The motivating case: the Verbs page is based on `pos:verb`, but ~315 of its
// rows are Latinate cognate verbs (to abstain, to depose) and ~552 are phrasal
// / prepositional verbs (to look for, to turn on). Both have their own pages —
// Cognates (grouped by spelling pattern) and the two Phrasal Verbs pages
// (grouped by root and by particle) — and both were drowning the plain-verb
// browser. `topics.ts` excludes `topic:cognate` and `topic:phrasal-verb` from
// the Verbs topic unconditionally (`unlessRole: []`).
//
// This is a display policy, not a fact about the concept, so it lives in config
// rather than in the data: no row is retagged, `pos:verb` stays true. An
// exclusion with a non-empty `unlessRole` keeps rows at those priorities.
//
// One definition, three consumers: the page query (curriculum-store.ts), the
// inventory script, and the reachability test all go through here, so the rule
// cannot drift between what the page shows and what the audit measures.
export type TopicBaseExclusion = {
  // Concepts carrying this collection are excluded from the topic...
  collection: string;
  // ...unless their role is one of these.
  unlessRole: readonly CurriculumRole[];
};

export type TopicScope = {
  baseCollection: string;
  baseExclusions?: readonly TopicBaseExclusion[];
};

/**
 * True when a concept belongs in a topic's scope: it carries the base
 * collection and survives every declared exclusion.
 */
export function conceptInTopicScope(
  topic: TopicScope,
  concept: { curriculumRole: string; collections: Iterable<string> },
): boolean {
  const collections =
    concept.collections instanceof Set
      ? (concept.collections as Set<string>)
      : new Set(concept.collections);
  if (!collections.has(topic.baseCollection)) return false;
  return !isExcludedFromTopic(topic, {
    curriculumRole: concept.curriculumRole,
    collections,
  });
}

/**
 * True when a concept carries the base tag but a declared exclusion removes it.
 * Separate from `conceptInTopicScope` so callers that already know the base tag
 * is present (and audits that want to report *why* a row is absent) can ask
 * about the exclusion alone.
 */
export function isExcludedFromTopic(
  topic: TopicScope,
  concept: { curriculumRole: string; collections: Iterable<string> },
): boolean {
  const collections =
    concept.collections instanceof Set
      ? (concept.collections as Set<string>)
      : new Set(concept.collections);
  for (const exclusion of topic.baseExclusions ?? []) {
    if (!collections.has(exclusion.collection)) continue;
    if (
      !exclusion.unlessRole.includes(concept.curriculumRole as CurriculumRole)
    ) {
      return true;
    }
  }
  return false;
}
