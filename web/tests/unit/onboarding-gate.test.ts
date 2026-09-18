import assert from "node:assert/strict";
import test from "node:test";

import { onboardingGate } from "../../src/lib/learner/onboarding-gate";

test("onboardingGate: no published onboarding always passes through", () => {
  assert.equal(
    onboardingGate({ hasPublishedOnboarding: false, onboardedCookie: false }),
    "pass",
  );
  assert.equal(
    onboardingGate({ hasPublishedOnboarding: false, onboardedCookie: true }),
    "pass",
  );
});

test("onboardingGate: published onboarding sends a fresh visitor to welcome", () => {
  assert.equal(
    onboardingGate({ hasPublishedOnboarding: true, onboardedCookie: false }),
    "welcome",
  );
});

test("onboardingGate: published onboarding + the cookie already set passes through", () => {
  assert.equal(
    onboardingGate({ hasPublishedOnboarding: true, onboardedCookie: true }),
    "pass",
  );
});
