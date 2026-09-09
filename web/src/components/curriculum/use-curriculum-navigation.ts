"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type NavigationUpdates = Record<string, string | number | null>;

/**
 * Owns every URL change the curriculum table makes: it reads the current query,
 * applies an update map (a `null`/empty/`"all"` value clears the parameter),
 * optionally resets pagination, and pushes the new route inside a transition so
 * the table can show a pending state. Scope selectors are thin wrappers over the
 * same `navigate` call. It holds no table state and refreshes nothing.
 */
export function useCurriculumNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();

  function navigate(updates: NavigationUpdates, resetPage = true) {
    const parameters = new URLSearchParams(searchParams.toString());
    for (const [name, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "all") {
        parameters.delete(name);
      } else {
        parameters.set(name, String(value));
      }
    }
    if (resetPage) parameters.delete("page");
    const query = parameters.toString();
    startNavigation(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function selectTopic(slug: string | null) {
    navigate({
      topic: slug,
      family: null,
      leaf: null,
      facets: null,
      collection: null,
    });
  }

  function selectFamily(familyId: string | null) {
    navigate({
      family: familyId,
      leaf: null,
      facets: null,
      collection: null,
    });
  }

  function selectLeaf(familyId: string, collection: string | null) {
    navigate({
      family: familyId,
      leaf: collection,
      facets: null,
      collection: null,
    });
  }

  return { isNavigating, navigate, selectTopic, selectFamily, selectLeaf };
}
