// Pure decision behind the onboarding gate (docs/design/onboarding.md §1).
// No fs, no next/headers — unit-tested directly; the server helper that
// reads cookies() and the course summary lives in onboarding-gate-server.ts.

export type OnboardingGateInput = {
  /** A module of kind "onboarding" whose status is not draft AND which has
   * >=1 non-draft lesson with >=1 block — see course-summary-core.ts. */
  hasPublishedOnboarding: boolean;
  /** Whether the `icc_onboarded` cookie is present (any value counts). */
  onboardedCookie: boolean;
};

export type OnboardingGateResult = "welcome" | "pass";

// Send the learner to /bienvenida only when there is somewhere to send them
// (a published onboarding module) AND they have not already finished it.
export function onboardingGate({
  hasPublishedOnboarding,
  onboardedCookie,
}: OnboardingGateInput): OnboardingGateResult {
  if (!hasPublishedOnboarding) return "pass";
  if (onboardedCookie) return "pass";
  return "welcome";
}
