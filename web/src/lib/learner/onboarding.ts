// Onboarding completion state, learner side (docs/design/onboarding.md §1).
// localStorage is the truth; the cookie is a hint that lets the server
// redirect with no flash of the home page — if it's lost but localStorage
// says done, /bienvenida's own reconcile re-sets it (see the route).
// Wrapped in try/catch throughout, same pattern as progress.ts.

export const onboardingStorageKey = "icc.onboarding.v1";
export const onboardedCookieName = "icc_onboarded";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type OnboardingState = { completedAt: string };

export function readOnboardingState(): OnboardingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(onboardingStorageKey);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      typeof (value as { completedAt?: unknown }).completedAt === "string"
    ) {
      return { completedAt: (value as OnboardingState).completedAt };
    }
    return null;
  } catch {
    return null;
  }
}

export function isOnboardingComplete(): boolean {
  return readOnboardingState() !== null;
}

function setOnboardedCookie() {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${onboardedCookieName}=1; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
  } catch {
    // Cookie is only a hint for the server-side redirect; localStorage
    // (set by the caller alongside this) remains the truth either way.
  }
}

function clearOnboardedCookie() {
  try {
    document.cookie = `${onboardedCookieName}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // Best-effort; see setOnboardedCookie.
  }
}

// Called once, when the learner finishes the last onboarding lesson (never
// in replay mode). Sets localStorage first (the truth) then the cookie.
export function completeOnboarding(): void {
  const completedAt = new Date().toISOString();
  try {
    window.localStorage.setItem(
      onboardingStorageKey,
      JSON.stringify({ completedAt } satisfies OnboardingState),
    );
  } catch {
    // If storage is unavailable the cookie alone still lets the server gate
    // work for this session; a future session without it will see
    // onboarding again, which is the documented "honest limit".
  }
  setOnboardedCookie();
}

// /bienvenida's reconcile: localStorage says done but the cookie was lost
// (cleared cookies, different subdomain, etc.) — re-set it without touching
// the completion timestamp.
export function reconcileOnboardedCookie(): void {
  if (isOnboardingComplete()) setOnboardedCookie();
}

// "Reiniciar todo el progreso" also clears onboarding (docs/design/
// onboarding.md §1, "testers will want to replay it").
export function resetOnboarding(): void {
  try {
    window.localStorage.removeItem(onboardingStorageKey);
  } catch {
    // Best-effort, same as progress.ts's reset helpers.
  }
  clearOnboardedCookie();
}
