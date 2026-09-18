import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasPublishedOnboarding } from "@/lib/lesson-builder/course-summary-core";
import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";
import { onboardedCookieName } from "@/lib/learner/onboarding";
import { onboardingGate } from "@/lib/learner/onboarding-gate";

// Used by the `/` and `/practice` page SERVER COMPONENTS only (never
// proxy.ts, which stays admin-only — docs/design/onboarding.md §1). Reading
// `cookies()` here opts both routes into dynamic rendering (see
// docs/engineering/deploy.md).
export async function redirectToOnboardingIfNeeded(): Promise<void> {
  const [cookieStore, lessonFile] = await Promise.all([
    cookies(),
    readLessonFile(),
  ]);
  const decision = onboardingGate({
    hasPublishedOnboarding: hasPublishedOnboarding(lessonFile),
    onboardedCookie: cookieStore.has(onboardedCookieName),
  });
  if (decision === "welcome") redirect("/bienvenida");
}
