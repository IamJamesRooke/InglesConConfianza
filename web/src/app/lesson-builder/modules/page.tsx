import { BuilderNav } from "@/components/lesson-builder/builder-nav";
import { ModuleEditor } from "@/components/lesson-builder/module-editor";
import { readCourseView } from "@/lib/lesson-builder/server/course-view";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const course = await readCourseView();

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Modules</h1>
          <BuilderNav active="modules" />
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Pick a module on the left. Each has one learner promise and the
          sentence that proves it. Drag lessons to reorder; use “Move to…” to
          send a lesson to another module.
        </p>

        <ModuleEditor
          initialModules={course.modules}
          lessons={course.lessons}
        />
      </div>
    </main>
  );
}
