"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const curriculumLinks = [
  { href: "/curriculum", label: "Database" },
  { href: "/curriculum/review", label: "Review inbox" },
  { href: "/curriculum/progress", label: "Migration progress" },
];

export function CurriculumNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Curriculum" className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl gap-1 px-6">
        {curriculumLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
