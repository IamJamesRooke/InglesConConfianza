import Link from "next/link";

const tabs = [
  { href: "/lesson-builder/modules", label: "Modules", key: "modules" },
  { href: "/lesson-builder", label: "Lesson Builder", key: "builder" },
  {
    href: "/lesson-builder/coverage",
    label: "Concepts Covered",
    key: "coverage",
  },
] as const;

export function BuilderNav({
  active,
}: {
  active: "builder" | "modules" | "coverage";
}) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-0.5 pb-3 text-sm font-semibold transition ${
              tab.key === active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
