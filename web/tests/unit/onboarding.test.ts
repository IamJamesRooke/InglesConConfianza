import assert from "node:assert/strict";
import test from "node:test";

import {
  completeOnboarding,
  isOnboardingComplete,
  onboardedCookieName,
  onboardingStorageKey,
  readOnboardingState,
  reconcileOnboardedCookie,
  resetOnboarding,
} from "../../src/lib/learner/onboarding";

function withFakeWindow(run: (data: Map<string, string>) => void) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const data = new Map<string, string>();
  let cookieString = "";
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
      },
      location: { protocol: "http:" },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: {
      get cookie() {
        return cookieString;
      },
      set cookie(value: string) {
        const [pair, ...attrs] = value.split(";");
        const [name] = pair.split("=");
        const maxAge = attrs
          .map((a) => a.trim())
          .find((a) => a.toLowerCase().startsWith("max-age="));
        const isDelete = maxAge === "max-age=0";
        const existing = cookieString
          .split("; ")
          .filter(Boolean)
          .filter((entry) => !entry.startsWith(`${name.trim()}=`));
        cookieString = isDelete
          ? existing.join("; ")
          : [...existing, pair.trim()].join("; ");
      },
    },
    configurable: true,
  });
  try {
    run(data);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
}

test("completeOnboarding sets localStorage and the cookie together", () => {
  withFakeWindow((data) => {
    assert.equal(isOnboardingComplete(), false);
    completeOnboarding();
    assert.ok(readOnboardingState()?.completedAt);
    assert.ok(data.get(onboardingStorageKey));
    assert.match(document.cookie, new RegExp(`${onboardedCookieName}=1`));
  });
});

test("resetOnboarding clears both localStorage and the cookie", () => {
  withFakeWindow(() => {
    completeOnboarding();
    assert.equal(isOnboardingComplete(), true);
    resetOnboarding();
    assert.equal(isOnboardingComplete(), false);
    assert.doesNotMatch(document.cookie, new RegExp(`${onboardedCookieName}=1`));
  });
});

test("reconcileOnboardedCookie re-sets a lost cookie without touching completion", () => {
  withFakeWindow(() => {
    completeOnboarding();
    const completedAt = readOnboardingState()?.completedAt;
    // Simulate the cookie being lost (cleared browser cookies) while
    // localStorage survives.
    document.cookie = `${onboardedCookieName}=; path=/; max-age=0`;
    assert.doesNotMatch(document.cookie, new RegExp(`${onboardedCookieName}=1`));
    reconcileOnboardedCookie();
    assert.match(document.cookie, new RegExp(`${onboardedCookieName}=1`));
    assert.equal(readOnboardingState()?.completedAt, completedAt);
  });
});

test("readOnboardingState tolerates malformed storage", () => {
  withFakeWindow((data) => {
    data.set(onboardingStorageKey, "not json");
    assert.equal(readOnboardingState(), null);
    data.set(onboardingStorageKey, JSON.stringify({ nope: true }));
    assert.equal(readOnboardingState(), null);
  });
});
