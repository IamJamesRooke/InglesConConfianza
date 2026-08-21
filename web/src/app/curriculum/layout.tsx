import type { ReactNode } from "react";

import { CurriculumNav } from "@/components/curriculum/curriculum-nav";

export default function CurriculumLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CurriculumNav />
      {children}
    </>
  );
}
