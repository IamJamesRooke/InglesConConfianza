import Link from "next/link";

const tabs = [
  { href: "/lesson-builder", label: "Builder", key: "builder" },
  { href: "/lesson-builder/modules", label: "Modules", key: "modules" },
  { href: "/lesson-builder/coverage", label: "Coverage", key: "coverage" },
] as const;

export function BuilderNav({
  active,
}: {
  active: "builder" | "modules" | "coverage";
}) {
  return (
    <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1 text-sm font-medium">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`rounded-full px-3.5 py-1.5 transition ${
            tab.key === active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
