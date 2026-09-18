"use client";

import { useSyncExternalStore } from "react";

import {
  readLearnerVariables,
  subscribeLearnerVariables,
  substituteVariables,
  type LearnerVariables,
} from "@/lib/learner/variables";

const EMPTY: LearnerVariables = {};

function serverSnapshot(): LearnerVariables {
  return EMPTY;
}

/**
 * The learner's stored variables, as a React value.
 *
 * `useSyncExternalStore` is the whole point: the server render (and the
 * hydration render with it) sees `{}` — so a `{name}` token renders as its
 * fallback or as nothing, never as a hydration mismatch — and React swaps in
 * the real localStorage snapshot immediately after mount, with no setState
 * inside an effect for the `react-hooks/set-state-in-effect` rule to object
 * to. Writes through `setLearnerVariable`/`clearLearnerVariables` notify
 * every subscriber, so a captured name reaches the next slide, the footer
 * and the feedback sheet without any of them re-reading storage.
 */
export function useLearnerVariables(): LearnerVariables {
  return useSyncExternalStore(
    subscribeLearnerVariables,
    readLearnerVariables,
    serverSnapshot,
  );
}

/** `substituteVariables` bound to the live store — the one helper every
 * learner-side surface uses to render authored text. */
export function useVariableText(): (text: string) => string {
  const variables = useLearnerVariables();
  return (text: string) => substituteVariables(text, variables);
}
