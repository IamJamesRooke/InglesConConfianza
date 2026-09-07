import type { CurriculumRole } from "@/lib/curriculum/types";

// A topic page's scope is normally just its `baseCollection`. A topic may also
// declare exclusions: material that carries the base tag but does not belong in
// that page's browser.
//
// The motivating case (2026-09-07): the Verbs page is based on `pos:verb`, and
// 315 of its 1804 rows are Latinate cognate verbs. The low-priority ones (to
// abstain, to depose, to allude) are reference material, not teaching
// vocabulary — they belong on the Cognates page, where they are organised by
// spelling pattern, and they were drowning the Verbs browser. The higher-tier
// ones (to prepare, to decide, to receive) are ordinary teaching verbs and
// stay. The Verbs exclusion in topics.ts keeps rows whose role is `core`,
// `essential` or `common`.
//
// This is a display policy, not a fact about the concept, so it lives in config
// rather than in the data: no row is retagged, `pos:verb` stays true, and a row
// promoted to a teaching tier later reappears on Verbs automatically.
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
